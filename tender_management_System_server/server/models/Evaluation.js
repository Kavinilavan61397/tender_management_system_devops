const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema({
    bid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bid',
        required: true
    },
    tender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tender',
        required: true
    },
    evaluator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    scores: {
        technicalScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        financialScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        experienceScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        complianceScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        }
    },
    totalScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    comments: {
        type: String,
        default: ''
    },
    recommendation: {
        type: String,
        enum: ['RECOMMENDED', 'NOT_RECOMMENDED', 'NEEDS_REVIEW'],
        default: 'NEEDS_REVIEW'
    }
}, {
    timestamps: true
});

// One evaluation per evaluator per bid
evaluationSchema.index({ bid: 1, evaluator: 1 }, { unique: true });

// Auto-calculate total score (weighted average)
evaluationSchema.pre('save', function (next) {
    const s = this.scores;
    this.totalScore = Math.round(
        (s.technicalScore * 0.35) +
        (s.financialScore * 0.30) +
        (s.experienceScore * 0.20) +
        (s.complianceScore * 0.15)
    );
    next();
});

const Evaluation = mongoose.model('Evaluation', evaluationSchema);

module.exports = Evaluation;
