import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, IconButton, TextField,
    MenuItem, CircularProgress, Alert, Snackbar
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Publish as PublishIcon,
    Visibility as ViewIcon,
    RateReview as ReviewIcon
} from '@mui/icons-material';

const statusColors = {
    DRAFT: 'default',
    PUBLISHED: 'primary',
    OPEN: 'success',
    EVALUATION: 'warning',
    REVIEW: 'info',
    AWARDED: 'secondary',
    REJECTED: 'error',
    ARCHIVED: 'default'
};

const TenderList = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tenders, setTenders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null, confirmColor: 'primary' });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const isAdmin = ['ADMIN', 'DIRECTOR', 'MANAGER'].includes(user?.role);

    const fetchTenders = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filterStatus) params.status = filterStatus;
            if (filterCategory) params.category = filterCategory;

            const { data } = await api.get('/tenders', { params });
            setTenders(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch tenders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTenders();
    }, [filterStatus, filterCategory]);

    const handleDelete = (id) => {
        setConfirmDialog({
            open: true,
            title: 'Delete Tender',
            message: 'Are you sure you want to delete this tender? This action cannot be undone.',
            confirmColor: 'error',
            onConfirm: async () => {
                try {
                    await api.delete(`/tenders/${id}`);
                    setSnackbar({ open: true, message: 'Tender deleted successfully!', severity: 'success' });
                    fetchTenders();
                } catch (err) {
                    setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to delete tender', severity: 'error' });
                } finally {
                    setConfirmDialog({ ...confirmDialog, open: false });
                }
            }
        });
    };

    const handlePublish = (id) => {
        setConfirmDialog({
            open: true,
            title: 'Publish Tender',
            message: 'Publish this tender? Once published, vendors will be able to view and bid on it.',
            confirmColor: 'success',
            onConfirm: async () => {
                try {
                    await api.put(`/tenders/${id}/publish`);
                    setSnackbar({ open: true, message: 'Tender published successfully!', severity: 'success' });
                    fetchTenders();
                } catch (err) {
                    setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to publish tender', severity: 'error' });
                } finally {
                    setConfirmDialog({ ...confirmDialog, open: false });
                }
            }
        });
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'short', day: 'numeric'
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

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Tenders</Typography>
                {isAdmin && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/tenders/new')}
                    >
                        Create Tender
                    </Button>
                )}
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                    select
                    label="Filter by Status"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    size="small"
                    sx={{ minWidth: 180 }}
                >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="DRAFT">Draft</MenuItem>
                    <MenuItem value="PUBLISHED">Published</MenuItem>
                    <MenuItem value="OPEN">Open</MenuItem>
                    <MenuItem value="EVALUATION">Evaluation</MenuItem>
                    <MenuItem value="AWARDED">Awarded</MenuItem>
                </TextField>
                <TextField
                    select
                    label="Filter by Category"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    size="small"
                    sx={{ minWidth: 180 }}
                >
                    <MenuItem value="">All Categories</MenuItem>
                    <MenuItem value="IT">IT</MenuItem>
                    <MenuItem value="CONSTRUCTION">Construction</MenuItem>
                    <MenuItem value="SUPPLY">Supply</MenuItem>
                    <MenuItem value="CONSULTING">Consulting</MenuItem>
                    <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                    <MenuItem value="OTHER">Other</MenuItem>
                </TextField>
            </Box>

            {/* Tender Table */}
            <TableContainer component={Paper} elevation={2}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                            <TableCell><strong>Title</strong></TableCell>
                            <TableCell><strong>Category</strong></TableCell>
                            <TableCell><strong>Budget</strong></TableCell>
                            <TableCell><strong>Deadline</strong></TableCell>
                            <TableCell><strong>Status</strong></TableCell>
                            <TableCell align="center"><strong>Actions</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {tenders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <Typography variant="body1" color="text.secondary" sx={{ py: 4 }}>
                                        No tenders found.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            tenders.map((tender) => (
                                <TableRow key={tender._id} hover>
                                    <TableCell>{tender.title}</TableCell>
                                    <TableCell>{tender.category}</TableCell>
                                    <TableCell>{formatBudget(tender.budget)}</TableCell>
                                    <TableCell>{formatDate(tender.deadline)}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={tender.status}
                                            color={statusColors[tender.status] || 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton
                                            size="small"
                                            color="info"
                                            onClick={() => navigate(`/tenders/${tender._id}`)}
                                            title="View Details"
                                        >
                                            <ViewIcon />
                                        </IconButton>
                                        {isAdmin && tender.status === 'DRAFT' && (
                                            <>
                                                <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => navigate(`/tenders/${tender._id}/edit`)}
                                                    title="Edit"
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="success"
                                                    onClick={() => handlePublish(tender._id)}
                                                    title="Publish"
                                                >
                                                    <PublishIcon />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDelete(tender._id)}
                                                    title="Delete"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </>
                                        )}
                                        {isAdmin && ['PUBLISHED', 'OPEN', 'EVALUATION'].includes(tender.status) && (
                                            <IconButton
                                                size="small"
                                                color="warning"
                                                onClick={() => navigate(`/tenders/${tender._id}/bids`)}
                                                title="Review Bids"
                                            >
                                                <ReviewIcon />
                                            </IconButton>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Confirmation Dialog */}
            <ConfirmDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmColor={confirmDialog.confirmColor}
                confirmText={confirmDialog.title?.includes('Delete') ? 'Delete' : 'Publish'}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog({ ...confirmDialog, open: false })}
            />

            {/* Success/Error Snackbar */}
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

export default TenderList;
