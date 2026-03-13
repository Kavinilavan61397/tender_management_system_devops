import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
    Box, Typography, Paper, TextField, Button, Alert, CircularProgress, IconButton
} from '@mui/material';
import { ArrowBack as BackIcon, Send as SendIcon, CloudUpload as UploadIcon, Delete as DeleteIcon, InsertDriveFile as FileIcon } from '@mui/icons-material';

const BidForm = ({ tenderId, tenderTitle, tenderBudget, onSuccess, onCancel }) => {
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        // Limit to 5 files
        if (selectedFiles.length + files.length > 5) {
            setError('Maximum 5 files allowed');
            return;
        }
        setSelectedFiles(prev => [...prev, ...files]);
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const formik = useFormik({
        initialValues: {
            amount: '',
            technicalProposal: '',
            financialProposal: '',
            remarks: ''
        },
        validationSchema: Yup.object({
            amount: Yup.number()
                .required('Bid amount is required')
                .positive('Amount must be positive')
                .min(tenderBudget * 0.1, `Minimum bid is 10% of budget (\u20B9${Math.round(tenderBudget * 0.1)?.toLocaleString('en-IN')})`),
            technicalProposal: Yup.string()
                .required('Technical proposal is required')
                .min(50, 'Provide at least 50 characters explaining your approach'),
            financialProposal: Yup.string(),
            remarks: Yup.string()
        }),
        onSubmit: async (values) => {
            try {
                setSubmitting(true);
                setError('');

                const formData = new FormData();
                formData.append('tenderId', tenderId);
                formData.append('amount', values.amount);
                formData.append('technicalProposal', values.technicalProposal);
                formData.append('financialProposal', values.financialProposal);
                formData.append('remarks', values.remarks);

                selectedFiles.forEach(file => {
                    formData.append('documents', file);
                });

                await api.post('/bids', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                if (onSuccess) onSuccess();
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to submit bid');
            } finally {
                setSubmitting(false);
            }
        }
    });

    return (
        <Paper sx={{ p: 4, mt: 3 }} elevation={3}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
                Submit Your Bid
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                For: <strong>{tenderTitle}</strong> | Budget: <strong>₹{tenderBudget?.toLocaleString('en-IN')}</strong>
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <form onSubmit={formik.handleSubmit}>
                <TextField
                    fullWidth
                    label="Bid Amount (INR)"
                    name="amount"
                    type="number"
                    value={formik.values.amount}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.amount && Boolean(formik.errors.amount)}
                    helperText={formik.touched.amount && formik.errors.amount}
                    sx={{ mb: 3 }}
                />

                <TextField
                    fullWidth
                    label="Technical Proposal"
                    name="technicalProposal"
                    multiline
                    rows={5}
                    placeholder="Describe your technical approach, methodology, timeline, and team..."
                    value={formik.values.technicalProposal}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.technicalProposal && Boolean(formik.errors.technicalProposal)}
                    helperText={formik.touched.technicalProposal && formik.errors.technicalProposal}
                    sx={{ mb: 3 }}
                />

                <TextField
                    fullWidth
                    label="Financial Proposal (Optional)"
                    name="financialProposal"
                    multiline
                    rows={3}
                    placeholder="Detailed cost breakdown, payment milestones, etc."
                    value={formik.values.financialProposal}
                    onChange={formik.handleChange}
                    sx={{ mb: 3 }}
                />

                <TextField
                    fullWidth
                    label="Additional Remarks (Optional)"
                    name="remarks"
                    multiline
                    rows={2}
                    value={formik.values.remarks}
                    onChange={formik.handleChange}
                    sx={{ mb: 3 }}
                />

                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                        Supporting Documents (Images/PDFs)
                    </Typography>
                    <Button
                        component="label"
                        variant="outlined"
                        startIcon={<UploadIcon />}
                        sx={{ mb: 1 }}
                    >
                        Upload Files
                        <input
                            type="file"
                            hidden
                            multiple
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        />
                    </Button>
                    <Typography variant="caption" color="text.secondary" display="block">
                        Allowed: PDF, DOCX, JPG, PNG (Max 5MB each, up to 5 files)
                    </Typography>

                    {selectedFiles.length > 0 && (
                        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {selectedFiles.map((file, index) => (
                                <Paper
                                    key={index}
                                    variant="outlined"
                                    sx={{
                                        p: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        bgcolor: '#f8f9fa'
                                    }}
                                >
                                    <FileIcon fontSize="small" color="primary" />
                                    <Typography variant="body2" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {file.name}
                                    </Typography>
                                    <IconButton size="small" onClick={() => removeFile(index)} color="error">
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Paper>
                            ))}
                        </Box>
                    )}
                </Box>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button variant="outlined" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="success"
                        startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                        disabled={submitting}
                    >
                        {submitting ? 'Submitting...' : 'Submit Bid'}
                    </Button>
                </Box>
            </form>
        </Paper>
    );
};

export default BidForm;
