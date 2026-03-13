import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, Button, CircularProgress, Alert, Snackbar,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Slider,
    MenuItem, Divider, Tooltip, IconButton, Grid
} from '@mui/material';
import {
    ArrowBack as BackIcon,
    EmojiEvents as AwardIcon,
    RateReview as EvaluateIcon,
    CheckCircle as CheckIcon,
    Send as SendIcon,
    Visibility as ViewIcon,
    AttachFile as FileIcon,
    Download as DownloadIcon
} from '@mui/icons-material';

const BidReview = () => {
    const { tenderId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [tender, setTender] = useState(null);
    const [bids, setBids] = useState([]);
    const [evaluations, setEvaluations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null, confirmColor: 'primary' });

    // Evaluation form state
    const [evalDialogOpen, setEvalDialogOpen] = useState(false);
    const [selectedBid, setSelectedBid] = useState(null);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [viewingBid, setViewingBid] = useState(null);
    const [evalForm, setEvalForm] = useState({
        technicalScore: 50,
        financialScore: 50,
        experienceScore: 50,
        complianceScore: 50,
        comments: '',
        recommendation: 'NEEDS_REVIEW'
    });

    useEffect(() => {
        fetchData();
    }, [tenderId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [tenderRes, bidsRes, evalsRes] = await Promise.all([
                api.get(`/tenders/${tenderId}`),
                api.get(`/bids/tender/${tenderId}`),
                api.get(`/evaluations/tender/${tenderId}`)
            ]);
            setTender(tenderRes.data);
            setBids(bidsRes.data);
            setEvaluations(evalsRes.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const formatBudget = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency', currency: 'INR', maximumFractionDigits: 0
        }).format(amount);
    };

    const openEvalDialog = (bid) => {
        setSelectedBid(bid);
        setEvalForm({
            technicalScore: 50,
            financialScore: 50,
            experienceScore: 50,
            complianceScore: 50,
            comments: '',
            recommendation: 'NEEDS_REVIEW'
        });
        setEvalDialogOpen(true);
    };

    const handleSubmitEvaluation = async () => {
        try {
            await api.post('/evaluations', {
                bidId: selectedBid._id,
                scores: {
                    technicalScore: evalForm.technicalScore,
                    financialScore: evalForm.financialScore,
                    experienceScore: evalForm.experienceScore,
                    complianceScore: evalForm.complianceScore
                },
                comments: evalForm.comments,
                recommendation: evalForm.recommendation
            });
            setEvalDialogOpen(false);
            setSnackbar({ open: true, message: 'Evaluation submitted successfully!', severity: 'success' });
            fetchData();
        } catch (err) {
            setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to submit evaluation', severity: 'error' });
        }
    };

    const handleSendForApproval = (bid) => {
        setConfirmDialog({
            open: true,
            title: 'Send for Approval',
            message: `Send this bid from "${bid.vendor?.name}" (${formatBudget(bid.amount)}) for Manager → Director approval?`,
            confirmColor: 'primary',
            onConfirm: async () => {
                try {
                    await api.post('/approvals', { tenderId: tender._id, bidId: bid._id });
                    setSnackbar({ open: true, message: 'Sent for approval! Manager will review first.', severity: 'success' });
                    setTimeout(() => {
                        navigate('/approvals');
                    }, 1500);
                } catch (err) {
                    setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to initiate approval', severity: 'error' });
                } finally {
                    setConfirmDialog({ ...confirmDialog, open: false });
                }
            }
        });
    };

    const getEvalForBid = (bidId) => {
        return evaluations.filter(e => e.bid?._id === bidId);
    };

    const getAvgScore = (bidId) => {
        const evals = getEvalForBid(bidId);
        if (evals.length === 0) return null;
        const avg = evals.reduce((sum, e) => sum + e.totalScore, 0) / evals.length;
        return Math.round(avg);
    };

    const hasUserEvaluated = (bidId) => {
        return evaluations.some(e => e.bid?._id === bidId && e.evaluator?._id === user?._id);
    };

    const calcTotalPreview = () => {
        return Math.round(
            (evalForm.technicalScore * 0.35) +
            (evalForm.financialScore * 0.30) +
            (evalForm.experienceScore * 0.20) +
            (evalForm.complianceScore * 0.15)
        );
    };

    const statusColors = {
        SUBMITTED: 'primary',
        UNDER_REVIEW: 'warning',
        ACCEPTED: 'success',
        REJECTED: 'error',
        WITHDRAWN: 'default'
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Button startIcon={<BackIcon />} onClick={() => navigate('/tenders')} sx={{ mb: 2 }}>
                Back to Tenders
            </Button>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Tender Info */}
            <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
                <Typography variant="h5" fontWeight="bold">{tender?.title}</Typography>
                <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        Budget: <strong>{formatBudget(tender?.budget)}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Category: <strong>{tender?.category}</strong>
                    </Typography>
                    <Chip label={tender?.status} color="primary" size="small" />
                </Box>
            </Paper>

            <Typography variant="h5" sx={{ mb: 2 }}>
                Bids Received ({bids.length})
            </Typography>

            {/* Bids Table */}
            <TableContainer component={Paper} elevation={2}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                            <TableCell><strong>#</strong></TableCell>
                            <TableCell><strong>Vendor</strong></TableCell>
                            <TableCell><strong>Company</strong></TableCell>
                            <TableCell><strong>Bid Amount</strong></TableCell>
                            <TableCell><strong>Status</strong></TableCell>
                            <TableCell><strong>Avg Score</strong></TableCell>
                            <TableCell><strong>Evaluations</strong></TableCell>
                            <TableCell align="center"><strong>Actions</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {bids.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    <Typography variant="body1" color="text.secondary" sx={{ py: 4 }}>
                                        No bids received yet.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            bids.map((bid, index) => {
                                const avgScore = getAvgScore(bid._id);
                                const evalCount = getEvalForBid(bid._id).length;
                                return (
                                    <TableRow key={bid._id} hover sx={bid.status === 'ACCEPTED' ? { bgcolor: '#e8f5e9' } : {}}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>{bid.vendor?.name}</TableCell>
                                        <TableCell>{bid.vendor?.profile?.companyName || '—'}</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>{formatBudget(bid.amount)}</TableCell>
                                        <TableCell>
                                            <Chip label={bid.status.replace('_', ' ')} color={statusColors[bid.status] || 'default'} size="small" />
                                        </TableCell>
                                        <TableCell>
                                            {avgScore !== null ? (
                                                <Chip
                                                    label={`${avgScore}/100`}
                                                    color={avgScore >= 70 ? 'success' : avgScore >= 40 ? 'warning' : 'error'}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            ) : '—'}
                                        </TableCell>
                                        <TableCell>{evalCount} review{evalCount !== 1 ? 's' : ''}</TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                                <Tooltip title="View Full Proposal & Documents">
                                                    <IconButton
                                                        size="small"
                                                        color="info"
                                                        onClick={() => {
                                                            setViewingBid(bid);
                                                            setDetailsDialogOpen(true);
                                                        }}
                                                    >
                                                        <ViewIcon />
                                                    </IconButton>
                                                </Tooltip>

                                                {bid.status !== 'WITHDRAWN' && bid.status !== 'REJECTED' && bid.status !== 'ACCEPTED' && (
                                                    <>
                                                        {!hasUserEvaluated(bid._id) ? (
                                                            <Tooltip title="Evaluate this bid">
                                                                <IconButton
                                                                    size="small"
                                                                    color="primary"
                                                                    onClick={() => openEvalDialog(bid)}
                                                                >
                                                                    <EvaluateIcon />
                                                                </IconButton>
                                                            </Tooltip>
                                                        ) : (
                                                            <Tooltip title="Evaluated">
                                                                <CheckIcon color="success" fontSize="small" sx={{ mt: 1 }} />
                                                            </Tooltip>
                                                        )}
                                                        {evalCount > 0 && (
                                                            <Tooltip title="Send for Approval">
                                                                <IconButton
                                                                    size="small"
                                                                    color="success"
                                                                    onClick={() => handleSendForApproval(bid)}
                                                                >
                                                                    <AwardIcon />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </>
                                                )}
                                                {bid.status === 'ACCEPTED' && (
                                                    <Chip label="WINNER" color="success" size="small" />
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Evaluation Dialog */}
            <Dialog open={evalDialogOpen} onClose={() => setEvalDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold' }}>
                    Evaluate Bid — {selectedBid?.vendor?.name}
                    <Typography variant="body2" color="text.secondary" component="div">
                        Bid Amount: {formatBudget(selectedBid?.amount)}
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>Technical Score (35% weight)</Typography>
                        <Slider
                            value={evalForm.technicalScore}
                            onChange={(e, v) => setEvalForm({ ...evalForm, technicalScore: v })}
                            valueLabelDisplay="on"
                            min={0} max={100}
                            sx={{ mb: 2 }}
                        />

                        <Typography variant="subtitle2" gutterBottom>Financial Score (30% weight)</Typography>
                        <Slider
                            value={evalForm.financialScore}
                            onChange={(e, v) => setEvalForm({ ...evalForm, financialScore: v })}
                            valueLabelDisplay="on"
                            min={0} max={100}
                            sx={{ mb: 2 }}
                        />

                        <Typography variant="subtitle2" gutterBottom>Experience Score (20% weight)</Typography>
                        <Slider
                            value={evalForm.experienceScore}
                            onChange={(e, v) => setEvalForm({ ...evalForm, experienceScore: v })}
                            valueLabelDisplay="on"
                            min={0} max={100}
                            sx={{ mb: 2 }}
                        />

                        <Typography variant="subtitle2" gutterBottom>Compliance Score (15% weight)</Typography>
                        <Slider
                            value={evalForm.complianceScore}
                            onChange={(e, v) => setEvalForm({ ...evalForm, complianceScore: v })}
                            valueLabelDisplay="on"
                            min={0} max={100}
                            sx={{ mb: 2 }}
                        />

                        <Divider sx={{ my: 2 }} />

                        <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
                            Weighted Total: <strong>{calcTotalPreview()}/100</strong>
                        </Typography>

                        <TextField
                            select
                            fullWidth
                            label="Recommendation"
                            value={evalForm.recommendation}
                            onChange={(e) => setEvalForm({ ...evalForm, recommendation: e.target.value })}
                            sx={{ mb: 2 }}
                        >
                            <MenuItem value="RECOMMENDED">✅ Recommended</MenuItem>
                            <MenuItem value="NOT_RECOMMENDED">❌ Not Recommended</MenuItem>
                            <MenuItem value="NEEDS_REVIEW">🔍 Needs Review</MenuItem>
                        </TextField>

                        <TextField
                            fullWidth
                            label="Comments"
                            multiline
                            rows={3}
                            value={evalForm.comments}
                            onChange={(e) => setEvalForm({ ...evalForm, comments: e.target.value })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setEvalDialogOpen(false)} variant="outlined">Cancel</Button>
                    <Button onClick={handleSubmitEvaluation} variant="contained" color="primary">
                        Submit Evaluation
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Bid Details Dialog */}
            <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>
                    Bid Details — {viewingBid?.vendor?.name}
                    <Typography variant="body2" color="text.secondary" component="div">
                        Submitted on: {new Date(viewingBid?.submittedAt).toLocaleString()}
                    </Typography>
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" color="text.secondary">Bid Amount</Typography>
                            <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                                {formatBudget(viewingBid?.amount)}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" color="text.secondary">Company Name</Typography>
                            <Typography variant="h6">
                                {viewingBid?.vendor?.profile?.companyName || 'N/A'}
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Technical Proposal</Typography>
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa', whiteSpace: 'pre-line' }}>
                                {viewingBid?.technicalProposal}
                            </Paper>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Financial Proposal</Typography>
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa', whiteSpace: 'pre-line' }}>
                                {viewingBid?.financialProposal || 'No financial proposal provided.'}
                            </Paper>
                        </Grid>

                        {viewingBid?.remarks && (
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Remarks</Typography>
                                <Typography variant="body2">{viewingBid.remarks}</Typography>
                            </Grid>
                        )}

                        <Grid item xs={12}>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Attached Documents ({viewingBid?.documents?.length || 0})
                            </Typography>
                            {viewingBid?.documents?.length > 0 ? (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                    {viewingBid.documents.map((doc, idx) => (
                                        <Paper
                                            key={idx}
                                            variant="outlined"
                                            sx={{
                                                p: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                                bgcolor: '#f0f4f8',
                                                '&:hover': { bgcolor: '#e1e8f0' }
                                            }}
                                        >
                                            <FileIcon color="primary" />
                                            <Box>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {doc.fileName}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                                                </Typography>
                                            </Box>
                                            <Button
                                                size="small"
                                                startIcon={<DownloadIcon />}
                                                href={`${api.defaults.baseURL.replace('/api', '')}${doc.fileUrl}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                View
                                            </Button>
                                        </Paper>
                                    ))}
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary">No documents attached.</Typography>
                            )}
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailsDialogOpen(false)} variant="contained">Close</Button>
                </DialogActions>
            </Dialog>

            {/* Confirm Dialog */}
            <ConfirmDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmColor={confirmDialog.confirmColor}
                confirmText="Send"
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog({ ...confirmDialog, open: false })}
            />

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

export default BidReview;
