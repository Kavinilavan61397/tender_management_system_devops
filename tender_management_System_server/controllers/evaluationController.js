const Evaluation = require('../models/Evaluation');
const Bid = require('../models/Bid');
const Tender = require('../models/Tender');

// @desc    Submit evaluation for a bid
// @route   POST /api/evaluations
// @access  Admin/Evaluator
const submitEvaluation = async (req, res) => {
    try {
        const { bidId, scores, comments, recommendation } = req.body;

        const bid = await Bid.findById(bidId).populate('tender');
        if (!bid) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        // Check if already evaluated by this evaluator
        const existing = await Evaluation.findOne({ bid: bidId, evaluator: req.user._id });
        if (existing) {
            return res.status(400).json({ message: 'You have already evaluated this bid' });
        }

        const evaluation = await Evaluation.create({
            bid: bidId,
            tender: bid.tender._id,
            evaluator: req.user._id,
            scores,
            comments,
            recommendation
        });

        // Update bid status to UNDER_REVIEW
        if (bid.status === 'SUBMITTED') {
            bid.status = 'UNDER_REVIEW';
            await bid.save();
        }

        const populated = await Evaluation.findById(evaluation._id)
            .populate('evaluator', 'name email role')
            .populate('bid', 'amount vendor');

        res.status(201).json(populated);
    } catch (error) {
        console.error(error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'You have already evaluated this bid' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all evaluations for a bid
// @route   GET /api/evaluations/bid/:bidId
// @access  Admin/Evaluator
const getEvaluationsForBid = async (req, res) => {
    try {
        const evaluations = await Evaluation.find({ bid: req.params.bidId })
            .populate('evaluator', 'name email role')
            .sort({ totalScore: -1 });

        res.json(evaluations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all evaluations for a tender (summary view)
// @route   GET /api/evaluations/tender/:tenderId
// @access  Admin/Evaluator
const getEvaluationsForTender = async (req, res) => {
    try {
        const evaluations = await Evaluation.find({ tender: req.params.tenderId })
            .populate('evaluator', '_id name email role')
            .populate({
                path: 'bid',
                select: 'amount technicalProposal status vendor',
                populate: { path: 'vendor', select: 'name email profile' }
            })
            .sort({ totalScore: -1 });

        res.json(evaluations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update an evaluation
// @route   PUT /api/evaluations/:id
// @access  Evaluator (own evaluation only)
const updateEvaluation = async (req, res) => {
    try {
        const evaluation = await Evaluation.findById(req.params.id);

        if (!evaluation) {
            return res.status(404).json({ message: 'Evaluation not found' });
        }

        if (evaluation.evaluator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only edit your own evaluations' });
        }

        const { scores, comments, recommendation } = req.body;
        if (scores) evaluation.scores = scores;
        if (comments !== undefined) evaluation.comments = comments;
        if (recommendation) evaluation.recommendation = recommendation;

        await evaluation.save();
        res.json(evaluation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Award tender to a bid
// @route   PUT /api/evaluations/award/:bidId
// @access  Admin/Director only
const awardTender = async (req, res) => {
    try {
        const bid = await Bid.findById(req.params.bidId);
        if (!bid) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        const tender = await Tender.findById(bid.tender);
        if (!tender) {
            return res.status(404).json({ message: 'Tender not found' });
        }

        // Accept the winning bid
        bid.status = 'ACCEPTED';
        await bid.save();

        // Reject all other bids for this tender
        await Bid.updateMany(
            { tender: tender._id, _id: { $ne: bid._id }, status: { $ne: 'WITHDRAWN' } },
            { status: 'REJECTED' }
        );

        // Update tender status to AWARDED
        tender.status = 'AWARDED';
        await tender.save();

        res.json({ message: `Tender awarded successfully!`, tender, winningBid: bid });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { submitEvaluation, getEvaluationsForBid, getEvaluationsForTender, updateEvaluation, awardTender };
