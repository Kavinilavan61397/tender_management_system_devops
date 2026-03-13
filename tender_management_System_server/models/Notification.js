const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: [
            'BID_SUBMITTED',       // Vendor submitted a bid
            'BID_ACCEPTED',        // Vendor's bid was accepted
            'BID_REJECTED',        // Vendor's bid was rejected
            'BID_UNDER_REVIEW',    // Vendor's bid sent for approval
            'TENDER_PUBLISHED',    // New tender published
            'TENDER_AWARDED',      // Tender has been awarded
            'TENDER_REJECTED',     // Tender was rejected in approval
            'APPROVAL_NEEDED',     // Manager/Director needs to approve
            'APPROVAL_APPROVED',   // Approval step completed
            'APPROVAL_REJECTED',   // Approval was rejected
            'VENDOR_VERIFIED',     // Vendor account verified
            'VENDOR_REJECTED',     // Vendor account rejected
            'NEW_VENDOR',          // New vendor registered (for admins)
            'GENERAL'              // General notification
        ],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    read: {
        type: Boolean,
        default: false
    },
    link: {
        type: String,
        default: ''
    },
    metadata: {
        tenderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tender' },
        bidId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bid' },
        approvalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Approval' }
    }
}, { timestamps: true });

// Auto-expire after 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('Notification', notificationSchema);
