const Tender = require('../models/Tender');
const Bid = require('../models/Bid');
const User = require('../models/User');
const Evaluation = require('../models/Evaluation');

// @desc    Get dashboard statistics
// @route   GET /api/stats
// @access  Admin/Manager/Director
const getDashboardStats = async (req, res) => {
    try {
        // Tender stats
        const totalTenders = await Tender.countDocuments();
        const tendersByStatus = await Tender.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const tendersByCategory = await Tender.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);
        const totalBudget = await Tender.aggregate([
            { $group: { _id: null, total: { $sum: '$budget' } } }
        ]);

        // Bid stats
        const totalBids = await Bid.countDocuments();
        const bidsByStatus = await Bid.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const avgBidAmount = await Bid.aggregate([
            { $group: { _id: null, avg: { $avg: '$amount' } } }
        ]);

        // User stats
        const totalUsers = await User.countDocuments();
        const usersByRole = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);
        const pendingVendors = await User.countDocuments({ role: 'VENDOR', isVerified: false });
        const verifiedVendors = await User.countDocuments({ role: 'VENDOR', isVerified: true });

        // Evaluation stats
        const totalEvaluations = await Evaluation.countDocuments();
        const avgScore = await Evaluation.aggregate([
            { $group: { _id: null, avg: { $avg: '$totalScore' } } }
        ]);

        // Recent tenders (last 5)
        const recentTenders = await Tender.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('title status budget category createdAt');

        // Recent bids (last 5)
        const recentBids = await Bid.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('tender', 'title')
            .populate('vendor', 'name')
            .select('amount status submittedAt');

        // Monthly tender creation (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const monthlyTenders = await Tender.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    count: { $sum: 1 },
                    totalBudget: { $sum: '$budget' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            tenders: {
                total: totalTenders,
                byStatus: tendersByStatus,
                byCategory: tendersByCategory,
                totalBudget: totalBudget[0]?.total || 0
            },
            bids: {
                total: totalBids,
                byStatus: bidsByStatus,
                avgAmount: Math.round(avgBidAmount[0]?.avg || 0)
            },
            users: {
                total: totalUsers,
                byRole: usersByRole,
                pendingVendors,
                verifiedVendors
            },
            evaluations: {
                total: totalEvaluations,
                avgScore: Math.round(avgScore[0]?.avg || 0)
            },
            recent: {
                tenders: recentTenders,
                bids: recentBids
            },
            monthly: monthlyTenders
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get vendor-specific stats
// @route   GET /api/stats/vendor
// @access  Vendor
const getVendorStats = async (req, res) => {
    try {
        const vendorId = req.user._id;

        const totalBids = await Bid.countDocuments({ vendor: vendorId });
        const acceptedBids = await Bid.countDocuments({ vendor: vendorId, status: 'ACCEPTED' });
        const pendingBids = await Bid.countDocuments({ vendor: vendorId, status: { $in: ['SUBMITTED', 'UNDER_REVIEW'] } });
        const rejectedBids = await Bid.countDocuments({ vendor: vendorId, status: 'REJECTED' });

        const totalBidValue = await Bid.aggregate([
            { $match: { vendor: vendorId } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const bidsByStatus = await Bid.aggregate([
            { $match: { vendor: vendorId } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        res.json({
            totalBids,
            acceptedBids,
            pendingBids,
            rejectedBids,
            totalBidValue: totalBidValue[0]?.total || 0,
            bidsByStatus,
            successRate: totalBids > 0 ? Math.round((acceptedBids / totalBids) * 100) : 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getDashboardStats, getVendorStats };
