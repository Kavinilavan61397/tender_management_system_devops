const express = require('express');
const router = express.Router();
const {
    submitBid,
    getBidsForTender,
    getMyBids,
    getBidById,
    updateBid,
    withdrawBid
} = require('../controllers/bidController');
const upload = require('../middleware/uploadMiddleware');
const { protect, admin, evaluator } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Vendor routes
router.post('/', upload.array('documents', 5), submitBid);
router.get('/my-bids', getMyBids);
router.get('/:id', getBidById);
router.put('/:id', updateBid);
router.put('/:id/withdraw', withdrawBid);

// Admin/Evaluator routes
router.get('/tender/:tenderId', evaluator, getBidsForTender);

module.exports = router;
