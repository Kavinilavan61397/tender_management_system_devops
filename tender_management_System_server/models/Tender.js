const mongoose = require('mongoose');

const tenderSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Tender title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Tender description is required']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['IT', 'CONSTRUCTION', 'SUPPLY', 'CONSULTING', 'MAINTENANCE', 'OTHER'],
        default: 'OTHER'
    },
    budget: {
        type: Number,
        required: [true, 'Budget is required'],
        min: [0, 'Budget cannot be negative']
    },
    deadline: {
        type: Date,
        required: [true, 'Submission deadline is required']
    },
    status: {
        type: String,
        enum: ['DRAFT', 'PUBLISHED', 'OPEN', 'EVALUATION', 'REVIEW', 'AWARDED', 'REJECTED', 'ARCHIVED'],
        default: 'DRAFT'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    documents: [{
        fileName: String,
        fileUrl: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    requirements: {
        type: String,
        default: ''
    },
    eligibilityCriteria: {
        type: String,
        default: ''
    }
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

const Tender = mongoose.model('Tender', tenderSchema);

module.exports = Tender;
