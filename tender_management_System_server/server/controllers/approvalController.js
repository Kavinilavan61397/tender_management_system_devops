const Approval = require('../models/Approval');
const Tender = require('../models/Tender');
const Bid = require('../models/Bid');
const { createNotification, notifyByRole } = require('./notificationController');
const { logAction } = require('./auditLogController');

// @desc    Initiate approval workflow for a tender award
// @route   POST /api/approvals
// @access  Admin
const initiateApproval = async (req, res) => {
    try {
        const { tenderId, bidId } = req.body;

        const tender = await Tender.findById(tenderId);
        if (!tender) return res.status(404).json({ message: 'Tender not found' });

        const bid = await Bid.findById(bidId);
        if (!bid) return res.status(404).json({ message: 'Bid not found' });

        // Check if approval already exists
        const existing = await Approval.findOne({ tender: tenderId });
        if (existing) {
            return res.status(400).json({ message: 'Approval workflow already exists for this tender' });
        }

        // Create approval with 2-step chain: Manager → Director
        const approval = await Approval.create({
            tender: tenderId,
            bid: bidId,
            initiatedBy: req.user._id,
            currentStep: 0,
            steps: [
                { role: 'MANAGER', status: 'PENDING' },
                { role: 'DIRECTOR', status: 'PENDING' }
            ]
        });

        // Update tender status to REVIEW
        tender.status = 'REVIEW';
        await tender.save();

        // Update bid status to UNDER_REVIEW
        bid.status = 'UNDER_REVIEW';
        await bid.save();

        const populated = await Approval.findById(approval._id)
            .populate('tender', 'title budget category')
            .populate('bid', 'amount vendor')
            .populate('initiatedBy', 'name email')
            .populate('steps.approver', 'name email role');

        // Notify managers & directors that approval is needed
        notifyByRole(['MANAGER', 'DIRECTOR'], {
            type: 'APPROVAL_NEEDED',
            title: 'Approval Required',
            message: `"${tender.title}" needs your approval for award`,
            link: '/approvals',
            metadata: { tenderId, bidId, approvalId: approval._id }
        });

        // Notify vendor that bid is under review
        createNotification({
            recipient: bid.vendor,
            type: 'BID_UNDER_REVIEW',
            title: 'Bid Under Review',
            message: `Your bid on "${tender.title}" has been sent for management approval`,
            link: '/my-bids',
            metadata: { tenderId, bidId }
        });

        res.status(201).json(populated);

        logAction({ action: 'APPROVAL_INITIATED', performedBy: req.user._id, targetType: 'APPROVAL', targetId: approval._id, description: `Initiated approval for tender "${tender.title}"`, ipAddress: req.ip });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Approval already exists for this tender' });
        }
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all approval workflows
// @route   GET /api/approvals
// @access  Admin/Manager/Director
const getApprovals = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = {};
        if (status) filter.overallStatus = status;

        const approvals = await Approval.find(filter)
            .populate('tender', 'title budget category status')
            .populate({
                path: 'bid',
                select: 'amount vendor status',
                populate: { path: 'vendor', select: 'name profile.companyName' }
            })
            .populate('initiatedBy', 'name email')
            .populate('steps.approver', 'name email role')
            .sort({ createdAt: -1 });

        res.json(approvals);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get single approval by ID
// @route   GET /api/approvals/:id
// @access  Admin/Manager/Director
const getApprovalById = async (req, res) => {
    try {
        const approval = await Approval.findById(req.params.id)
            .populate('tender', 'title budget category status deadline')
            .populate({
                path: 'bid',
                select: 'amount vendor status technicalProposal financialProposal',
                populate: { path: 'vendor', select: 'name email profile.companyName' }
            })
            .populate('initiatedBy', 'name email role')
            .populate('steps.approver', 'name email role');

        if (!approval) return res.status(404).json({ message: 'Approval not found' });

        res.json(approval);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Approve or reject current step
// @route   PUT /api/approvals/:id/action
// @access  Manager/Director
const processApproval = async (req, res) => {
    try {
        const { action, comments } = req.body; // action: 'APPROVED' or 'REJECTED'

        if (!['APPROVED', 'REJECTED'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action. Use APPROVED or REJECTED' });
        }

        const approval = await Approval.findById(req.params.id);
        if (!approval) return res.status(404).json({ message: 'Approval not found' });

        if (approval.overallStatus !== 'IN_PROGRESS') {
            return res.status(400).json({ message: 'This approval is already finalized' });
        }

        const currentStep = approval.steps[approval.currentStep];
        if (!currentStep) {
            return res.status(400).json({ message: 'No pending step' });
        }

        // Verify the user's role matches the current step (Director/Admin can override/approve)
        const isDirector = req.user.role === 'DIRECTOR';
        const isAdmin = req.user.role === 'ADMIN';
        const isCorrectRole = req.user.role === currentStep.role;

        const canApprove = isCorrectRole || isAdmin || (isDirector && currentStep.role === 'MANAGER');
        if (!canApprove) {
            return res.status(403).json({
                message: `This step requires a ${currentStep.role} to approve. Your role is ${req.user.role}`
            });
        }

        // Senior Override Logic: If Director/Admin approves, we can skip to final if we want
        // For now, let's keep the sequence but allow one-click finalization if they are the FINAL role anyway
        // Actually, the user specifically mentioned "Director has to approve 2 times"
        // Let's make it so if a Director/Admin is the one approving, and they satisfy the FINAL step requirement too, it just finishes.

        const isFinalStep = approval.currentStep === approval.steps.length - 1;
        const willFullyApprove = action === 'APPROVED' && isFinalStep;

        // Update the current step
        currentStep.status = action;
        currentStep.approver = req.user._id;
        currentStep.comments = comments || '';
        currentStep.actionDate = new Date();

        if (action === 'REJECTED') {
            // Reject the entire chain
            approval.overallStatus = 'REJECTED';
            approval.rejectionReason = comments || 'Rejected by ' + req.user.role;

            const tender = await Tender.findById(approval.tender);
            if (tender) {
                tender.status = 'REJECTED';
                await tender.save();
            }
            const bid = await Bid.findById(approval.bid);
            if (bid) {
                bid.status = 'REJECTED';
                await bid.save();

                // Notify vendor of rejection
                createNotification({
                    recipient: bid.vendor,
                    type: 'BID_REJECTED',
                    title: 'Bid Rejected',
                    message: `Your bid on "${tender?.title}" was rejected: ${comments || 'No reason provided'}`,
                    link: '/my-bids',
                    metadata: { tenderId: approval.tender, bidId: approval.bid }
                });
            }
        } else if (action === 'APPROVED') {
            if (willFullyApprove) {
                // ... (existing willFullyApprove logic) ...
                // Finalize immediately (Senior Override)
                approval.overallStatus = 'APPROVED';

                // Mark all remaining steps as APPROVED by this user
                approval.steps.forEach((step, idx) => {
                    if (idx >= approval.currentStep) {
                        step.status = 'APPROVED';
                        step.approver = req.user._id;
                        step.actionDate = new Date();
                        if (idx > approval.currentStep) step.comments = 'Senior Override Approval';
                    }
                });

                const tender = await Tender.findById(approval.tender);
                if (tender) {
                    tender.status = 'AWARDED';
                    await tender.save();
                }

                const winnerBid = await Bid.findByIdAndUpdate(approval.bid, { status: 'ACCEPTED' });
                await Bid.updateMany(
                    { tender: approval.tender, _id: { $ne: approval.bid } },
                    { status: 'REJECTED' }
                );

                // Notify winning vendor
                if (winnerBid) {
                    createNotification({
                        recipient: winnerBid.vendor,
                        type: 'BID_ACCEPTED',
                        title: 'Congratulations! Bid Accepted 🏆',
                        message: `Your bid on "${tender?.title}" has been awarded!`,
                        link: '/my-bids',
                        metadata: { tenderId: approval.tender, bidId: approval.bid }
                    });
                }
            } else {
                // Regular sequential approval
                approval.currentStep += 1;

                // Notify next approver role
                const nextStep = approval.steps[approval.currentStep];
                const tender = await Tender.findById(approval.tender);
                notifyByRole([nextStep.role], {
                    type: 'APPROVAL_NEEDED',
                    title: 'Your Approval Needed',
                    message: `"${tender?.title}" needs ${nextStep.role} approval`,
                    link: '/approvals',
                    metadata: { approvalId: approval._id }
                });
            }
        }

        await approval.save();

        const populated = await Approval.findById(approval._id)
            .populate('tender', 'title budget category status')
            .populate({
                path: 'bid',
                select: 'amount vendor status',
                populate: { path: 'vendor', select: 'name profile.companyName' }
            })
            .populate('initiatedBy', 'name email')
            .populate('steps.approver', 'name email role');

        res.json(populated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { initiateApproval, getApprovals, getApprovalById, processApproval };
