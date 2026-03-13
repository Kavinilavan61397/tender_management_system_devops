import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import {
    Typography, Grid, Paper, Box, CircularProgress, Alert, Chip, Table,
    TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import {
    Assignment as TenderIcon,
    Gavel as BidIcon,
    People as UsersIcon,
    PendingActions as PendingIcon,
    CheckCircle as VerifiedIcon,
    TrendingUp as TrendIcon,
    AttachMoney as MoneyIcon,
    RateReview as EvalIcon
} from '@mui/icons-material';
import {
    BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';

const COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#d32f2f', '#0288d1', '#7b1fa2'];

const statusColors = {
    DRAFT: 'default', PUBLISHED: 'primary', OPEN: 'success',
    EVALUATION: 'warning', AWARDED: 'secondary', ARCHIVED: 'error'
};

const AdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/stats');
                setStats(data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const formatBudget = (amount) => {
        if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
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

    const tenderStatusData = stats?.tenders?.byStatus?.map(s => ({
        name: s._id, value: s.count
    })) || [];

    const tenderCategoryData = stats?.tenders?.byCategory?.map(s => ({
        name: s._id, count: s.count
    })) || [];

    const monthlyData = stats?.monthly?.map(m => ({
        month: m._id,
        tenders: m.count,
        budget: m.totalBudget
    })) || [];

    const bidStatusData = stats?.bids?.byStatus?.map(s => ({
        name: s._id.replace('_', ' '), value: s.count
    })) || [];

    const kpiCards = [
        { title: 'Total Tenders', value: stats?.tenders?.total || 0, icon: <TenderIcon />, color: '#1976d2', bg: '#e3f2fd' },
        { title: 'Total Bids', value: stats?.bids?.total || 0, icon: <BidIcon />, color: '#2e7d32', bg: '#e8f5e9' },
        { title: 'Pending Vendors', value: stats?.users?.pendingVendors || 0, icon: <PendingIcon />, color: '#ed6c02', bg: '#fff3e0' },
        { title: 'Total Users', value: stats?.users?.total || 0, icon: <UsersIcon />, color: '#9c27b0', bg: '#f3e5f5' },
        { title: 'Total Budget', value: formatBudget(stats?.tenders?.totalBudget || 0), icon: <MoneyIcon />, color: '#00897b', bg: '#e0f2f1' },
        { title: 'Verified Vendors', value: stats?.users?.verifiedVendors || 0, icon: <VerifiedIcon />, color: '#388e3c', bg: '#e8f5e9' },
        { title: 'Avg Bid Amount', value: formatBudget(stats?.bids?.avgAmount || 0), icon: <TrendIcon />, color: '#1565c0', bg: '#e3f2fd' },
        { title: 'Avg Eval Score', value: `${stats?.evaluations?.avgScore || 0}/100`, icon: <EvalIcon />, color: '#7b1fa2', bg: '#f3e5f5' },
    ];

    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                Dashboard
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
                Welcome back, {user?.name}! Here's your system overview.
            </Typography>

            {/* KPI Cards */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
                {kpiCards.map((card, index) => (
                    <Grid item xs={6} sm={4} md={3} key={index}>
                        <Paper
                            sx={{
                                p: 2.5, display: 'flex', alignItems: 'center', gap: 2,
                                bgcolor: card.bg, borderLeft: `4px solid ${card.color}`,
                                transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' }
                            }}
                            elevation={1}
                        >
                            <Box sx={{ color: card.color, fontSize: 40 }}>{card.icon}</Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary">{card.title}</Typography>
                                <Typography variant="h5" fontWeight="bold">{card.value}</Typography>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Charts Row */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Tender Status Pie */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3 }} elevation={2}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>Tenders by Status</Typography>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={tenderStatusData} cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`} dataKey="value">
                                    {tenderStatusData.map((entry, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Tender by Category Bar */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3 }} elevation={2}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>Tenders by Category</Typography>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={tenderCategoryData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#1976d2" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Bid Status Pie */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3 }} elevation={2}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>Bids by Status</Typography>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={bidStatusData} cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`} dataKey="value">
                                    {bidStatusData.map((entry, i) => (
                                        <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>

            {/* Monthly Trends */}
            {monthlyData.length > 0 && (
                <Paper sx={{ p: 3, mb: 4 }} elevation={2}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>Monthly Tender Trends</Typography>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis yAxisId="left" allowDecimals={false} />
                            <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => formatBudget(v)} />
                            <Tooltip formatter={(value, name) => name === 'budget' ? formatBudget(value) : value} />
                            <Legend />
                            <Area yAxisId="left" type="monotone" dataKey="tenders" stroke="#1976d2" fill="#bbdefb" name="Tenders Created" />
                            <Area yAxisId="right" type="monotone" dataKey="budget" stroke="#2e7d32" fill="#c8e6c9" name="Total Budget" />
                        </AreaChart>
                    </ResponsiveContainer>
                </Paper>
            )}

            {/* Recent Activity */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }} elevation={2}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>Recent Tenders</Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>Title</strong></TableCell>
                                        <TableCell><strong>Status</strong></TableCell>
                                        <TableCell><strong>Budget</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {stats?.recent?.tenders?.map(t => (
                                        <TableRow key={t._id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/tenders/${t._id}`)}>
                                            <TableCell>{t.title}</TableCell>
                                            <TableCell><Chip label={t.status} color={statusColors[t.status] || 'default'} size="small" /></TableCell>
                                            <TableCell>{formatBudget(t.budget)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }} elevation={2}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>Recent Bids</Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>Vendor</strong></TableCell>
                                        <TableCell><strong>Tender</strong></TableCell>
                                        <TableCell><strong>Amount</strong></TableCell>
                                        <TableCell><strong>Status</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {stats?.recent?.bids?.map(b => (
                                        <TableRow key={b._id} hover>
                                            <TableCell>{b.vendor?.name || '—'}</TableCell>
                                            <TableCell>{b.tender?.title || '—'}</TableCell>
                                            <TableCell>{formatBudget(b.amount)}</TableCell>
                                            <TableCell><Chip label={b.status.replace('_', ' ')} size="small" /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AdminDashboard;
