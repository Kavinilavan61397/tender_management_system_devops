const express = require('express');
const router = express.Router();
const { getAuditLogs, getAuditStats } = require('../controllers/auditLogController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect, admin);

router.get('/', getAuditLogs);
router.get('/stats', getAuditStats);

module.exports = router;
