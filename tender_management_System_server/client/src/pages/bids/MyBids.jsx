import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, CircularProgress, Alert, Button
} from '@mui/material';
import { Visibility as ViewIcon } from '@mui/icons-material';

const statusColors = {
    SUBMITTED: 'primary',
    UNDER_REVIEW: 'warning',
    ACCEPTED: 'success',
    REJECTED: 'error',
    WITHDRAWN: 'default'
};

const MyBids = () => {
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBids = async () => {
            try {
                const { data } = await api.get('/bids/my-bids');
                setBids(data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch bids');
            } finally {
                setLoading(false);
            }
        };
        fetchBids();
    }, []);

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    const formatBudget = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency', currency: 'INR', maximumFractionDigits: 0
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
            <Typography variant="h4" sx={{ mb: 3 }}>My Bids</Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TableContainer component={Paper} elevation={2}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                            <TableCell><strong>Tender</strong></TableCell>
                            <TableCell><strong>Category</strong></TableCell>
                            <TableCell><strong>Tender Budget</strong></TableCell>
                            <TableCell><strong>My Bid</strong></TableCell>
                            <TableCell><strong>Tender Deadline</strong></TableCell>
                            <TableCell><strong>Bid Status</strong></TableCell>
                            <TableCell><strong>Submitted</strong></TableCell>
                            <TableCell align="center"><strong>Actions</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {bids.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    <Typography variant="body1" color="text.secondary" sx={{ py: 4 }}>
                                        You haven't submitted any bids yet.
                                    </Typography>
                                    <Button variant="contained" onClick={() => navigate('/tenders')} sx={{ mb: 2 }}>
                                        Browse Tenders
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ) : (
                            bids.map((bid) => (
                                <TableRow key={bid._id} hover>
                                    <TableCell sx={{ fontWeight: 'bold' }}>
                                        {bid.tender?.title || 'N/A'}
                                    </TableCell>
                                    <TableCell>{bid.tender?.category || '—'}</TableCell>
                                    <TableCell>{bid.tender?.budget ? formatBudget(bid.tender.budget) : '—'}</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                        {formatBudget(bid.amount)}
                                    </TableCell>
                                    <TableCell>{bid.tender?.deadline ? formatDate(bid.tender.deadline) : '—'}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={bid.status.replace('_', ' ')}
                                            color={statusColors[bid.status] || 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{formatDate(bid.submittedAt)}</TableCell>
                                    <TableCell align="center">
                                        <Button
                                            size="small"
                                            startIcon={<ViewIcon />}
                                            onClick={() => navigate(`/tenders/${bid.tender?._id}`)}
                                        >
                                            View Tender
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default MyBids;
