const Bid = require('../models/Bid');
const Tender = require('../models/Tender');
const { createNotification, notifyByRole } = require('./notificationController');
const { logAction } = require('./auditLogController');

// @desc    Submit a bid on a tender
// @route   POST /api/bids
// @access  Vendor only
const submitBid = async (req, res) => {
    try {
        const { tenderId, amount, technicalProposal, financialProposal, remarks } = req.body;

        // Check if tender exists
        const tender = await Tender.findById(tenderId);
        if (!tender) {
            return res.status(404).json({ message: 'Tender not found' });
        }

        // Only allow bids on PUBLISHED or OPEN tenders
        if (!['PUBLISHED', 'OPEN'].includes(tender.status)) {
            return res.status(400).json({ message: 'This tender is not accepting bids' });
        }

        // Check if deadline has passed
        if (new Date() > new Date(tender.deadline)) {
            return res.status(400).json({ message: 'The submission deadline has passed' });
        }

        // Validate bid amount (minimum 10% of budget)
        if (amount < tender.budget * 0.1) {
            return res.status(400).json({ message: `Bid must be at least 10% of the tender budget` });
        }

        // Check if vendor already submitted a bid
        const existingBid = await Bid.findOne({ tender: tenderId, vendor: req.user._id });
        if (existingBid) {
            return res.status(400).json({ message: 'You have already submitted a bid for this tender' });
        }

        // Only verified vendors can bid
        if (!req.user.isVerified) {
            return res.status(403).json({ message: 'Your account must be verified before submitting bids' });
        }

        // Process uploaded documents
        const documents = req.files ? req.files.map(file => ({
            fileName: file.originalname,
            fileUrl: `/uploads/bids/${file.filename}`
        })) : [];

        const bid = await Bid.create({
            tender: tenderId,
            vendor: req.user._id,
            amount,
            technicalProposal,
            financialProposal,
            remarks,
            documents,
            status: 'SUBMITTED'
        });

        // Update tender status to OPEN (if it was PUBLISHED)
        if (tender.status === 'PUBLISHED') {
            tender.status = 'OPEN';
            await tender.save();
        }

        const populatedBid = await Bid.findById(bid._id)
            .populate('tender', 'title category deadline')
            .populate('vendor', 'name email profile');

        // Notify admins about new bid
        notifyByRole(['ADMIN', 'MANAGER'], {
            type: 'BID_SUBMITTED',
            title: 'New Bid Received',
            message: `${req.user.name} submitted a bid of ₹${amount.toLocaleString('en-IN')} on "${tender.title}"`,
            link: `/tenders/${tenderId}/bids`,
            metadata: { tenderId, bidId: bid._id }
        });

        res.status(201).json(populatedBid);

        logAction({ action: 'BID_SUBMITTED', performedBy: req.user._id, targetType: 'BID', targetId: bid._id, description: `Submitted bid of ₹${amount.toLocaleString('en-IN')} on "${tender.title}"`, ipAddress: req.ip });
    } catch (error) {
        console.error(error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'You have already submitted a bid for this tender' });
        }
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all bids for a tender (Admin view)
// @route   GET /api/bids/tender/:tenderId
// @access  Admin only
const getBidsForTender = async (req, res) => {
    try {
        const bids = await Bid.find({ tender: req.params.tenderId })
            .populate('vendor', 'name email profile')
            .sort({ amount: 1 }); // Sort by lowest bid first

        res.json(bids);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all bids by the logged-in vendor
// @route   GET /api/bids/my-bids
// @access  Vendor only
const getMyBids = async (req, res) => {
    try {
        const bids = await Bid.find({ vendor: req.user._id })
            .populate('tender', 'title category budget deadline status')
            .sort({ createdAt: -1 });

        res.json(bids);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get a single bid by ID
// @route   GET /api/bids/:id
// @access  Owner (vendor) or Admin
const getBidById = async (req, res) => {
    try {
        const bid = await Bid.findById(req.params.id)
            .populate('tender', 'title category budget deadline status')
            .populate('vendor', 'name email profile');

        if (!bid) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        // Only the bid owner or admin can view
        const isOwner = bid.vendor._id.toString() === req.user._id.toString();
        const isAdmin = ['ADMIN', 'MANAGER', 'DIRECTOR', 'EVALUATOR'].includes(req.user.role);

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(bid);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update bid (only before deadline and if not locked)
// @route   PUT /api/bids/:id
// @access  Vendor only (bid owner)
const updateBid = async (req, res) => {
    try {
        const bid = await Bid.findById(req.params.id).populate('tender', 'deadline');

        if (!bid) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        // Only bid owner can update
        if (bid.vendor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only edit your own bids' });
        }

        // Check if bid is locked
        if (bid.isLocked) {
            return res.status(400).json({ message: 'This bid is locked and cannot be modified' });
        }

        // Check if deadline has passed
        if (new Date() > new Date(bid.tender.deadline)) {
            bid.isLocked = true;
            await bid.save();
            return res.status(400).json({ message: 'The submission deadline has passed. Bid is now locked.' });
        }

        const { amount, technicalProposal, financialProposal, remarks } = req.body;

        if (amount) bid.amount = amount;
        if (technicalProposal) bid.technicalProposal = technicalProposal;
        if (financialProposal !== undefined) bid.financialProposal = financialProposal;
        if (remarks !== undefined) bid.remarks = remarks;

        const updatedBid = await bid.save();
        res.json(updatedBid);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Withdraw a bid
// @route   PUT /api/bids/:id/withdraw
// @access  Vendor only (bid owner)
const withdrawBid = async (req, res) => {
    try {
        const bid = await Bid.findById(req.params.id).populate('tender', 'deadline');

        if (!bid) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        if (bid.vendor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only withdraw your own bids' });
        }

        if (bid.isLocked) {
            return res.status(400).json({ message: 'This bid is locked and cannot be withdrawn' });
        }

        if (new Date() > new Date(bid.tender.deadline)) {
            return res.status(400).json({ message: 'Cannot withdraw after deadline' });
        }

        bid.status = 'WITHDRAWN';
        await bid.save();

        res.json({ message: 'Bid withdrawn successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { submitBid, getBidsForTender, getMyBids, getBidById, updateBid, withdrawBid };
