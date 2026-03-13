const Tender = require('../models/Tender');
const { notifyByRole } = require('./notificationController');
const { logAction } = require('./auditLogController');

// @desc    Create a new tender
// @route   POST /api/tenders
// @access  Admin only
const createTender = async (req, res) => {
    try {
        const { title, description, category, budget, deadline, requirements, eligibilityCriteria } = req.body;

        const tender = await Tender.create({
            title,
            description,
            category,
            budget,
            deadline,
            requirements,
            eligibilityCriteria,
            createdBy: req.user._id,
            status: 'DRAFT'
        });

        res.status(201).json(tender);

        logAction({ action: 'TENDER_CREATED', performedBy: req.user._id, targetType: 'TENDER', targetId: tender._id, description: `Created tender "${title}"`, ipAddress: req.ip });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all tenders
// @route   GET /api/tenders
// @access  All authenticated users
const getTenders = async (req, res) => {
    try {
        const { status, category } = req.query;
        const filter = {};

        // Admins see all tenders; Vendors only see PUBLISHED/OPEN ones
        if (req.user.role === 'VENDOR') {
            filter.status = { $in: ['PUBLISHED', 'OPEN', 'EVALUATION', 'AWARDED'] };
        } else if (status) {
            filter.status = status;
        }

        if (category) {
            filter.category = category;
        }

        const tenders = await Tender.find(filter)
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.json(tenders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get single tender by ID
// @route   GET /api/tenders/:id
// @access  All authenticated users
const getTenderById = async (req, res) => {
    try {
        const tender = await Tender.findById(req.params.id)
            .populate('createdBy', 'name email');

        if (!tender) {
            return res.status(404).json({ message: 'Tender not found' });
        }

        // Vendors can see PUBLISHED, OPEN, EVALUATION, and AWARDED tenders
        if (req.user.role === 'VENDOR' && !['PUBLISHED', 'OPEN', 'EVALUATION', 'AWARDED'].includes(tender.status)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(tender);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update a tender
// @route   PUT /api/tenders/:id
// @access  Admin only
const updateTender = async (req, res) => {
    try {
        const tender = await Tender.findById(req.params.id);

        if (!tender) {
            return res.status(404).json({ message: 'Tender not found' });
        }

        // Only allow editing if tender is still in DRAFT
        if (tender.status !== 'DRAFT') {
            return res.status(400).json({ message: 'Only DRAFT tenders can be edited' });
        }

        const updatedTender = await Tender.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json(updatedTender);

        logAction({ action: 'TENDER_UPDATED', performedBy: req.user._id, targetType: 'TENDER', targetId: tender._id, description: `Updated tender "${tender.title}"`, ipAddress: req.ip });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a tender
// @route   DELETE /api/tenders/:id
// @access  Admin only
const deleteTender = async (req, res) => {
    try {
        const tender = await Tender.findById(req.params.id);

        if (!tender) {
            return res.status(404).json({ message: 'Tender not found' });
        }

        // Only allow deleting DRAFT tenders
        if (tender.status !== 'DRAFT') {
            return res.status(400).json({ message: 'Only DRAFT tenders can be deleted' });
        }

        await Tender.findByIdAndDelete(req.params.id);

        logAction({ action: 'TENDER_DELETED', performedBy: req.user._id, targetType: 'TENDER', targetId: tender._id, description: `Deleted tender "${tender.title}"`, ipAddress: req.ip });

        res.json({ message: 'Tender deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Publish a tender (change status from DRAFT to PUBLISHED)
// @route   PUT /api/tenders/:id/publish
// @access  Admin only
const publishTender = async (req, res) => {
    try {
        const tender = await Tender.findById(req.params.id);

        if (!tender) {
            return res.status(404).json({ message: 'Tender not found' });
        }

        if (tender.status !== 'DRAFT') {
            return res.status(400).json({ message: 'Only DRAFT tenders can be published' });
        }

        tender.status = 'PUBLISHED';
        await tender.save();

        // Notify all vendors about new tender
        notifyByRole(['VENDOR'], {
            type: 'TENDER_PUBLISHED',
            title: 'New Tender Available',
            message: `"${tender.title}" (${tender.category}) — Budget: ₹${tender.budget.toLocaleString('en-IN')}`,
            link: `/tenders/${tender._id}`,
            metadata: { tenderId: tender._id }
        });

        res.json(tender);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Close tender for evaluation (change status to EVALUATION)
// @route   PUT /api/tenders/:id/close
// @access  Admin only
const closeTender = async (req, res) => {
    try {
        const tender = await Tender.findById(req.params.id);

        if (!tender) {
            return res.status(404).json({ message: 'Tender not found' });
        }

        if (!['PUBLISHED', 'OPEN'].includes(tender.status)) {
            return res.status(400).json({ message: 'Only published or open tenders can be closed for evaluation' });
        }

        tender.status = 'EVALUATION';
        await tender.save();

        // Notify evaluators
        notifyByRole(['EVALUATOR', 'ADMIN'], {
            type: 'EVALUATION_NEEDED',
            title: 'Tender Ready for Evaluation',
            message: `"${tender.title}" has been closed for bidding and is now ready for scoring.`,
            link: `/evaluations`,
            metadata: { tenderId: tender._id }
        });

        res.json(tender);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { createTender, getTenders, getTenderById, updateTender, deleteTender, publishTender, closeTender };
