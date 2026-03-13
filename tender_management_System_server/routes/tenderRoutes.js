const express = require('express');
const router = express.Router();
const {
    createTender,
    getTenders,
    getTenderById,
    updateTender,
    deleteTender,
    publishTender,
    closeTender
} = require('../controllers/tenderController');
const { protect, admin } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Public (authenticated) routes
router.get('/', getTenders);
router.get('/:id', getTenderById);

// Admin-only routes
router.post('/', admin, createTender);
router.put('/:id', admin, updateTender);
router.delete('/:id', admin, deleteTender);
router.put('/:id/publish', admin, publishTender);
router.put('/:id/close', admin, closeTender);

module.exports = router;
