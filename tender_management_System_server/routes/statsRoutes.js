const express = require('express');
const router = express.Router();
const { getDashboardStats, getVendorStats } = require('../controllers/statsController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect);

// Admin dashboard stats
router.get('/', admin, getDashboardStats);

// Vendor stats
router.get('/vendor', getVendorStats);

module.exports = router;
