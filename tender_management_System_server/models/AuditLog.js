const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        enum: [
            // Tender actions
            'TENDER_CREATED',
            'TENDER_UPDATED',
            'TENDER_PUBLISHED',
            'TENDER_DELETED',
            'TENDER_AWARDED',
            'TENDER_REJECTED',
            // Bid actions
            'BID_SUBMITTED',
            'BID_UPDATED',
            'BID_WITHDRAWN',
            // Evaluation actions
            'BID_EVALUATED',
            // Approval actions
            'APPROVAL_INITIATED',
            'APPROVAL_APPROVED',
            'APPROVAL_REJECTED',
            // User actions
            'USER_REGISTERED',
            'USER_VERIFIED',
            'USER_REJECTED',
            'USER_DELETED',
            'USER_UPDATED',
            'EMPLOYEE_CREATED',
            // Auth actions
            'USER_LOGIN',
            'USER_LOGOUT'
        ],
        required: true
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    targetType: {
        type: String,
        enum: ['TENDER', 'BID', 'USER', 'APPROVAL', 'EVALUATION', 'AUTH'],
        required: true
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId
    },
    description: {
        type: String,
        required: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    ipAddress: {
        type: String,
        default: ''
    }
}, { timestamps: true });

// Index for fast queries
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ performedBy: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
