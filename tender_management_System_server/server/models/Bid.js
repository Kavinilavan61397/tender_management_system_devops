const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
    tender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tender',
        required: [true, 'Tender reference is required']
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Vendor reference is required']
    },
    amount: {
        type: Number,
        required: [true, 'Bid amount is required'],
        min: [0, 'Bid amount cannot be negative']
    },
    technicalProposal: {
        type: String,
        required: [true, 'Technical proposal is required']
    },
    financialProposal: {
        type: String,
        default: ''
    },
    documents: [{
        fileName: String,
        fileUrl: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    status: {
        type: String,
        enum: ['SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'],
        default: 'SUBMITTED'
    },
    isLocked: {
        type: Boolean,
        default: false
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    remarks: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// A vendor can only submit one bid per tender
bidSchema.index({ tender: 1, vendor: 1 }, { unique: true });

const Bid = mongoose.model('Bid', bidSchema);

module.exports = Bid;
