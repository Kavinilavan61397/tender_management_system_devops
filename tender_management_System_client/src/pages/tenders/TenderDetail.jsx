import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import BidForm from '../bids/BidForm';
import {
    Box, Typography, Paper, Chip, Button, Divider, CircularProgress, Alert, Grid, Snackbar
} from '@mui/material';
import {
    ArrowBack as BackIcon,
    Edit as EditIcon,
    Publish as PublishIcon,
    CalendarToday as CalendarIcon,
    AttachMoney as BudgetIcon,
    Category as CategoryIcon,
    Person as PersonIcon,
    Gavel as BidIcon,
    RateReview as EvaluateIcon
} from '@mui/icons-material';

const statusColors = {
    DRAFT: 'default',
    PUBLISHED: 'primary',
    OPEN: 'success',
    EVALUATION: 'warning',
    REVIEW: 'info',
    AWARDED: 'secondary',
    ARCHIVED: 'error'
};

const TenderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [tender, setTender] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showBidForm, setShowBidForm] = useState(false);
    const [existingBid, setExistingBid] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const isAdmin = ['ADMIN', 'MANAGER', 'DIRECTOR'].includes(user?.role);
    const isVendor = user?.role === 'VENDOR';
    const canBid = isVendor && ['PUBLISHED', 'OPEN'].includes(tender?.status) && new Date() < new Date(tender?.deadline);

    useEffect(() => {
        const fetchTender = async () => {
            try {
                const { data } = await api.get(`/tenders/${id}`);
                setTender(data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load tender');
            } finally {
                setLoading(false);
            }
        };
        fetchTender();
    }, [id]);

    // Check if vendor already has a bid
    useEffect(() => {
        const checkExistingBid = async () => {
            if (isVendor && tender) {
                try {
                    const { data } = await api.get('/bids/my-bids');
                    const found = data.find(b => b.tender?._id === id);
                    if (found) setExistingBid(found);
                } catch (err) {
                    // Silently fail
                }
            }
        };
        checkExistingBid();
    }, [tender, isVendor, id]);

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    const formatBudget = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
                <Button startIcon={<BackIcon />} onClick={() => navigate('/tenders')} sx={{ mt: 2 }}>
                    Back to Tenders
                </Button>
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Button startIcon={<BackIcon />} onClick={() => navigate('/tenders')}>
                    Back to Tenders
                </Button>
                {isAdmin && tender.status === 'DRAFT' && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() => navigate(`/tenders/${id}/edit`)}
                        >
                            Edit
                        </Button>
                        <Button
                            variant="contained"
                            color="success"
                            startIcon={<PublishIcon />}
                            onClick={async () => {
                                try {
                                    await api.put(`/tenders/${id}/publish`);
                                    const { data } = await api.get(`/tenders/${id}`);
                                    setTender(data);
                                    setSnackbar({ open: true, message: 'Tender published! 🚀', severity: 'success' });
                                } catch (err) {
                                    setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to publish', severity: 'error' });
                                }
                            }}
                        >
                            Publish
                        </Button>
                    </Box>
                )}
                {isAdmin && ['OPEN', 'EVALUATION', 'REVIEW', 'AWARDED'].includes(tender.status) && (
                    <Button
                        variant="contained"
                        color="info"
                        startIcon={<BidIcon />}
                        onClick={() => navigate(`/tenders/${id}/bids`)}
                    >
                        View Bids
                    </Button>
                )}
            </Box>

            {/* Main Content */}
            <Paper sx={{ p: 4 }} elevation={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h4" fontWeight="bold">
                        {tender.title}
                    </Typography>
                    <Chip
                        label={tender.status}
                        color={statusColors[tender.status] || 'default'}
                        size="medium"
                        sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}
                    />
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Info Cards */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CategoryIcon color="primary" />
                            <Box>
                                <Typography variant="caption" color="text.secondary">Category</Typography>
                                <Typography variant="body1" fontWeight="bold">{tender.category}</Typography>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <BudgetIcon color="success" />
                            <Box>
                                <Typography variant="caption" color="text.secondary">Budget</Typography>
                                <Typography variant="body1" fontWeight="bold">{formatBudget(tender.budget)}</Typography>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarIcon color="error" />
                            <Box>
                                <Typography variant="caption" color="text.secondary">Deadline</Typography>
                                <Typography variant="body1" fontWeight="bold">{formatDate(tender.deadline)}</Typography>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon color="info" />
                            <Box>
                                <Typography variant="caption" color="text.secondary">Created By</Typography>
                                <Typography variant="body1" fontWeight="bold">{tender.createdBy?.name || 'N/A'}</Typography>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* Description */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom fontWeight="bold">Description</Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                        {tender.description}
                    </Typography>
                </Box>

                {/* Requirements */}
                {tender.requirements && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">Requirements</Typography>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                            {tender.requirements}
                        </Typography>
                    </Box>
                )}

                {/* Eligibility */}
                {tender.eligibilityCriteria && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" gutterBottom fontWeight="bold">Eligibility Criteria</Typography>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                            {tender.eligibilityCriteria}
                        </Typography>
                    </Box>
                )}

                <Divider sx={{ my: 2 }} />

                {/* Timestamps */}
                <Box sx={{ display: 'flex', gap: 4 }}>
                    <Typography variant="caption" color="text.secondary">
                        Created: {formatDate(tender.createdAt)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Last Updated: {formatDate(tender.updatedAt)}
                    </Typography>
                </Box>
            </Paper>

            {/* Vendor Bid Section */}
            {canBid && !existingBid && !showBidForm && (
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Button
                        variant="contained"
                        color="success"
                        size="large"
                        startIcon={<BidIcon />}
                        onClick={() => setShowBidForm(true)}
                        sx={{ px: 5, py: 1.5, borderRadius: 2, fontSize: '1rem' }}
                    >
                        Submit a Bid
                    </Button>
                </Box>
            )}

            {existingBid && (
                <Alert severity="info" sx={{ mt: 3 }}>
                    You have already submitted a bid of <strong>{'\u20B9'}{existingBid.amount?.toLocaleString('en-IN')}</strong> for this tender.
                    Status: <Chip label={existingBid.status.replace('_', ' ')} size="small" color="primary" sx={{ ml: 1 }} />
                </Alert>
            )}

            {showBidForm && (
                <BidForm
                    tenderId={id}
                    tenderTitle={tender.title}
                    tenderBudget={tender.budget}
                    onSuccess={() => {
                        setShowBidForm(false);
                        setSnackbar({ open: true, message: 'Bid submitted successfully! \ud83c\udf89', severity: 'success' });
                        api.get('/bids/my-bids').then(({ data }) => {
                            const found = data.find(b => b.tender?._id === id);
                            if (found) setExistingBid(found);
                        });
                    }}
                    onCancel={() => setShowBidForm(false)}
                />
            )}

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default TenderDetail;
