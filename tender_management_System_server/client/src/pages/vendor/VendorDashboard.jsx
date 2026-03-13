import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import {
    Typography, Grid, Paper, Box, CircularProgress, Alert, Chip, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import {
    Gavel as BidIcon,
    CheckCircle as AcceptedIcon,
    PendingActions as PendingIcon,
    Cancel as RejectedIcon,
    TrendingUp as SuccessIcon,
    AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#1976d2', '#ed6c02', '#2e7d32', '#d32f2f', '#757575'];

const VendorDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [recentBids, setRecentBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, bidsRes] = await Promise.all([
                    api.get('/stats/vendor'),
                    api.get('/bids/my-bids')
                ]);
                setStats(statsRes.data);
                setRecentBids(bidsRes.data.slice(0, 5));
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const formatBudget = (amount) => {
        if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    const bidStatusData = stats?.bidsByStatus?.map(s => ({
        name: s._id.replace('_', ' '), value: s.count
    })) || [];

    const kpiCards = [
        { title: 'Total Bids', value: stats?.totalBids || 0, icon: <BidIcon />, color: '#1976d2', bg: '#e3f2fd' },
        { title: 'Accepted', value: stats?.acceptedBids || 0, icon: <AcceptedIcon />, color: '#2e7d32', bg: '#e8f5e9' },
        { title: 'Pending', value: stats?.pendingBids || 0, icon: <PendingIcon />, color: '#ed6c02', bg: '#fff3e0' },
        { title: 'Rejected', value: stats?.rejectedBids || 0, icon: <RejectedIcon />, color: '#d32f2f', bg: '#ffebee' },
        { title: 'Success Rate', value: `${stats?.successRate || 0}%`, icon: <SuccessIcon />, color: '#00897b', bg: '#e0f2f1' },
        { title: 'Total Bid Value', value: formatBudget(stats?.totalBidValue || 0), icon: <MoneyIcon />, color: '#7b1fa2', bg: '#f3e5f5' },
    ];

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Vendor Portal
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Welcome, {user?.profile?.companyName || user?.name}!
                        {user?.isVerified ? (
                            <Chip label="Verified ✓" color="success" size="small" sx={{ ml: 1 }} />
                        ) : (
                            <Chip label="Pending Verification" color="warning" size="small" sx={{ ml: 1 }} />
                        )}
                    </Typography>
                </Box>
                <Button variant="contained" onClick={() => navigate('/tenders')}>
                    Browse Tenders
                </Button>
            </Box>

            {/* KPI Cards */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
                {kpiCards.map((card, index) => (
                    <Grid item xs={6} sm={4} md={2} key={index}>
                        <Paper
                            sx={{
                                p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center',
                                bgcolor: card.bg, borderTop: `3px solid ${card.color}`,
                                transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' }
                            }}
                            elevation={1}
                        >
                            <Box sx={{ color: card.color, mb: 1 }}>{card.icon}</Box>
                            <Typography variant="h4" fontWeight="bold">{card.value}</Typography>
                            <Typography variant="caption" color="text.secondary" align="center">{card.title}</Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={3}>
                {/* Bid Status Chart */}
                <Grid item xs={12} md={5}>
                    <Paper sx={{ p: 3 }} elevation={2}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>My Bids Overview</Typography>
                        {bidStatusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={bidStatusData} cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`} dataKey="value">
                                        {bidStatusData.map((entry, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Typography color="text.secondary">No bids yet. Start bidding!</Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* Recent Bids */}
                <Grid item xs={12} md={7}>
                    <Paper sx={{ p: 3 }} elevation={2}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" fontWeight="bold">Recent Bids</Typography>
                            <Button size="small" onClick={() => navigate('/my-bids')}>View All</Button>
                        </Box>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>Tender</strong></TableCell>
                                        <TableCell><strong>Amount</strong></TableCell>
                                        <TableCell><strong>Status</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {recentBids.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} align="center">
                                                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                                    No bids submitted yet
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        recentBids.map(b => (
                                            <TableRow key={b._id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/tenders/${b.tender?._id}`)}>
                                                <TableCell>{b.tender?.title || '—'}</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>{formatBudget(b.amount)}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={b.status.replace('_', ' ')}
                                                        color={b.status === 'ACCEPTED' ? 'success' : b.status === 'REJECTED' ? 'error' : 'primary'}
                                                        size="small"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default VendorDashboard;
