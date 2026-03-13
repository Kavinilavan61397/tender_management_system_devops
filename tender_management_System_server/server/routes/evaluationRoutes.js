const express = require('express');
const router = express.Router();
const {
    submitEvaluation,
    getEvaluationsForBid,
    getEvaluationsForTender,
    updateEvaluation,
    awardTender
} = require('../controllers/evaluationController');
const { protect, admin, evaluator } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Routes for Evaluators and Admins
router.post('/', evaluator, submitEvaluation);
router.get('/bid/:bidId', evaluator, getEvaluationsForBid);
router.get('/tender/:tenderId', evaluator, getEvaluationsForTender);
router.put('/:id', evaluator, updateEvaluation);

// Routes for Admins/Managers only
router.put('/award/:bidId', admin, awardTender);

module.exports = router;
