const mongoose = require('mongoose');

const approvalStepSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['MANAGER', 'DIRECTOR'],
        required: true
    },
    approver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
    },
    comments: {
        type: String,
        default: ''
    },
    actionDate: {
        type: Date,
        default: null
    }
});

const approvalSchema = new mongoose.Schema({
    tender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tender',
        required: true
    },
    bid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bid',
        required: true
    },
    initiatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    currentStep: {
        type: Number,
        default: 0  // 0 = Manager approval, 1 = Director approval
    },
    overallStatus: {
        type: String,
        enum: ['IN_PROGRESS', 'APPROVED', 'REJECTED'],
        default: 'IN_PROGRESS'
    },
    steps: [approvalStepSchema],
    rejectionReason: {
        type: String,
        default: ''
    }
}, { timestamps: true });

// One approval chain per tender
approvalSchema.index({ tender: 1 }, { unique: true });

module.exports = mongoose.model('Approval', approvalSchema);
