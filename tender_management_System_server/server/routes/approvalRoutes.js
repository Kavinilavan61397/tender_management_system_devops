const express = require('express');
const router = express.Router();
const {
    initiateApproval, getApprovals, getApprovalById, processApproval
} = require('../controllers/approvalController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect);

// Admin initiates approval
router.post('/', admin, initiateApproval);

// Admin/Manager/Director can view
router.get('/', admin, getApprovals);
router.get('/:id', admin, getApprovalById);

// Manager/Director processes approval
router.put('/:id/action', admin, processApproval);

module.exports = router;
