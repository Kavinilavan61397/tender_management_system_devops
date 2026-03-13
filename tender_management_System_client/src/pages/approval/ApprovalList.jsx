import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import {
    Box, Typography, Paper, CircularProgress, Alert, Snackbar, Chip, Button,
    Stepper, Step, StepLabel, StepContent, TextField, Dialog, DialogTitle,
    DialogContent, DialogActions, Grid, Divider, Card, CardContent
} from '@mui/material';
import {
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    HourglassTop as PendingIcon,
    EmojiEvents as AwardIcon,
    RateReview as ReviewIcon
} from '@mui/icons-material';

const ApprovalList = () => {
    const { user } = useAuth();
    const [approvals, setApprovals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [evaluations, setEvaluations] = useState({}); // { bidId: [evals] }
    const [error, setError] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Action dialog
    const [actionDialog, setActionDialog] = useState({ open: false, approvalId: null, action: '' });
    const [actionComments, setActionComments] = useState('');

    useEffect(() => {
        fetchApprovals();
    }, []);

    const fetchApprovals = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/approvals');
            setApprovals(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load approvals');
        } finally {
            setLoading(false);
        }
    };

    const formatBudget = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency', currency: 'INR', maximumFractionDigits: 0
        }).format(amount);
    };

    const openActionDialog = (approvalId, action) => {
        setActionDialog({ open: true, approvalId, action });
        setActionComments('');
    };

    const handleAction = async () => {
        try {
            await api.put(`/approvals/${actionDialog.approvalId}/action`, {
                action: actionDialog.action,
                comments: actionComments
            });
            setActionDialog({ open: false, approvalId: null, action: '' });
            setSnackbar({
                open: true,
                message: actionDialog.action === 'APPROVED'
                    ? 'Approval granted! ✅'
                    : 'Approval rejected ❌',
                severity: actionDialog.action === 'APPROVED' ? 'success' : 'warning'
            });
            fetchApprovals();
        } catch (err) {
            setSnackbar({ open: true, message: err.response?.data?.message || 'Action failed', severity: 'error' });
        }
    };

    const canUserApprove = (approval) => {
        if (approval.overallStatus !== 'IN_PROGRESS') return false;
        const currentStep = approval.steps[approval.currentStep];
        if (!currentStep) return false;
        // Director can approve Manager steps (senior override)
        return user?.role === currentStep.role
            || user?.role === 'ADMIN'
            || (user?.role === 'DIRECTOR' && currentStep.role === 'MANAGER');
    };

    const getStatusColor = (status) => {
        if (status === 'APPROVED') return 'success';
        if (status === 'REJECTED') return 'error';
        return 'warning';
    };

    const getStepIcon = (step) => {
        if (step.status === 'APPROVED') return <ApproveIcon color="success" />;
        if (step.status === 'REJECTED') return <RejectIcon color="error" />;
        return <PendingIcon color="warning" />;
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
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                Approval Workflow
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
                Multi-stage approval chain for tender awards (Manager → Director)
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {approvals.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary">
                        No pending approvals
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        When an admin sends a bid for approval, it will appear here.
                    </Typography>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {approvals.map((approval) => (
                        <Grid item xs={12} key={approval._id}>
                            <Card elevation={2} sx={{
                                borderLeft: `4px solid ${approval.overallStatus === 'APPROVED' ? '#2e7d32' :
                                    approval.overallStatus === 'REJECTED' ? '#d32f2f' : '#ed6c02'
                                    }`
                            }}>
                                <CardContent>
                                    {/* Header */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Box>
                                            <Typography variant="h6" fontWeight="bold">
                                                {approval.tender?.title}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Vendor: <strong>{approval.bid?.vendor?.name}</strong> —
                                                Bid: <strong>{formatBudget(approval.bid?.amount)}</strong> —
                                                Budget: {formatBudget(approval.tender?.budget)}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Initiated by {approval.initiatedBy?.name} on {new Date(approval.createdAt).toLocaleDateString('en-IN')}
                                            </Typography>

                                            {/* Quick Scores Summary */}
                                            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                                {approval.bid?.status === 'UNDER_REVIEW' && (
                                                    <Chip
                                                        icon={<ReviewIcon sx={{ fontSize: '16px !important' }} />}
                                                        label="Technical Score pending"
                                                        size="small"
                                                        color="info"
                                                        variant="outlined"
                                                    />
                                                )}
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                            <Chip
                                                label={approval.overallStatus.replace('_', ' ')}
                                                color={getStatusColor(approval.overallStatus)}
                                                variant={approval.overallStatus === 'IN_PROGRESS' ? 'outlined' : 'filled'}
                                            />
                                            {approval.overallStatus === 'APPROVED' && (
                                                <AwardIcon color="success" sx={{ fontSize: 28 }} />
                                            )}
                                        </Box>
                                    </Box>

                                    <Divider sx={{ mb: 2 }} />

                                    {/* Approval Steps */}
                                    <Stepper
                                        activeStep={
                                            approval.overallStatus === 'APPROVED' ? approval.steps.length :
                                                approval.overallStatus === 'REJECTED' ? approval.currentStep :
                                                    approval.currentStep
                                        }
                                        orientation="vertical"
                                    >
                                        {approval.steps.map((step, index) => (
                                            <Step key={index} completed={step.status === 'APPROVED'}>
                                                <StepLabel
                                                    icon={getStepIcon(step)}
                                                    error={step.status === 'REJECTED'}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <strong>{step.role} Approval</strong>
                                                        <Chip label={step.status} size="small" color={getStatusColor(step.status)} variant="outlined" />
                                                    </Box>
                                                </StepLabel>
                                                <StepContent>
                                                    {step.approver && (
                                                        <Typography variant="body2">
                                                            {step.status !== 'PENDING' ? 'Actioned' : 'Assigned'} by: <strong>{step.approver.name}</strong>
                                                        </Typography>
                                                    )}
                                                    {step.comments && (
                                                        <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                                                            "{step.comments}"
                                                        </Typography>
                                                    )}
                                                    {step.actionDate && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            {new Date(step.actionDate).toLocaleString('en-IN')}
                                                        </Typography>
                                                    )}
                                                </StepContent>
                                            </Step>
                                        ))}
                                    </Stepper>

                                    {/* Rejection reason */}
                                    {approval.overallStatus === 'REJECTED' && approval.rejectionReason && (
                                        <Alert severity="error" sx={{ mt: 2 }}>
                                            <strong>Rejected:</strong> {approval.rejectionReason}
                                        </Alert>
                                    )}

                                    {/* Action buttons for current approver */}
                                    {canUserApprove(approval) && (
                                        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                                            <Button
                                                variant="contained"
                                                color="success"
                                                startIcon={<ApproveIcon />}
                                                onClick={() => openActionDialog(approval._id, 'APPROVED')}
                                            >
                                                Approve
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                startIcon={<RejectIcon />}
                                                onClick={() => openActionDialog(approval._id, 'REJECTED')}
                                            >
                                                Reject
                                            </Button>
                                        </Box>
                                    )}
                                    {!canUserApprove(approval) && approval.overallStatus === 'IN_PROGRESS' && (
                                        <Alert severity="info" sx={{ mt: 2 }}>
                                            Waiting for <strong>{approval.steps[approval.currentStep]?.role}</strong> to take action on this approval.
                                        </Alert>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Action Dialog */}
            <Dialog open={actionDialog.open} onClose={() => setActionDialog({ open: false, approvalId: null, action: '' })} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold' }}>
                    {actionDialog.action === 'APPROVED' ? '✅ Approve' : '❌ Reject'} this step?
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        fullWidth
                        label="Comments (optional)"
                        multiline
                        rows={3}
                        value={actionComments}
                        onChange={(e) => setActionComments(e.target.value)}
                        sx={{ mt: 1 }}
                        placeholder={actionDialog.action === 'REJECTED' ? 'Please provide a reason for rejection...' : 'Any comments...'}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setActionDialog({ open: false, approvalId: null, action: '' })} variant="outlined">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAction}
                        variant="contained"
                        color={actionDialog.action === 'APPROVED' ? 'success' : 'error'}
                    >
                        Confirm {actionDialog.action === 'APPROVED' ? 'Approval' : 'Rejection'}
                    </Button>
                </DialogActions>
            </Dialog>

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

export default ApprovalList;
