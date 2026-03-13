import { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, CircularProgress, Alert, Chip, TextField,
    MenuItem, Pagination, Card, CardContent, Grid, InputAdornment
} from '@mui/material';
import {
    Search as SearchIcon,
    Gavel as TenderIcon,
    Description as BidIcon,
    Person as UserIcon,
    CheckCircle as ApproveIcon,
    RateReview as EvalIcon,
    Login as AuthIcon,
    History as HistoryIcon
} from '@mui/icons-material';

const targetIcons = {
    TENDER: <TenderIcon fontSize="small" sx={{ color: '#1976d2' }} />,
    BID: <BidIcon fontSize="small" sx={{ color: '#ed6c02' }} />,
    USER: <UserIcon fontSize="small" sx={{ color: '#9c27b0' }} />,
    APPROVAL: <ApproveIcon fontSize="small" sx={{ color: '#2e7d32' }} />,
    EVALUATION: <EvalIcon fontSize="small" sx={{ color: '#0288d1' }} />,
    AUTH: <AuthIcon fontSize="small" sx={{ color: '#616161' }} />
};

const actionColors = {
    TENDER_CREATED: 'primary', TENDER_UPDATED: 'info', TENDER_PUBLISHED: 'success',
    TENDER_DELETED: 'error', TENDER_AWARDED: 'success', TENDER_REJECTED: 'error',
    BID_SUBMITTED: 'primary', BID_UPDATED: 'info', BID_WITHDRAWN: 'warning',
    BID_EVALUATED: 'info',
    APPROVAL_INITIATED: 'warning', APPROVAL_APPROVED: 'success', APPROVAL_REJECTED: 'error',
    USER_REGISTERED: 'primary', USER_VERIFIED: 'success', USER_REJECTED: 'error',
    USER_DELETED: 'error', USER_UPDATED: 'info', EMPLOYEE_CREATED: 'primary',
    USER_LOGIN: 'default', USER_LOGOUT: 'default'
};

const AuditLogViewer = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [filters, setFilters] = useState({ targetType: '', action: '' });
    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetchLogs();
        fetchStats();
    }, [pagination.page, filters]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ page: pagination.page, limit: 20 });
            if (filters.targetType) params.set('targetType', filters.targetType);
            if (filters.action) params.set('action', filters.action);

            const { data } = await api.get(`/audit-logs?${params}`);
            setLogs(data.logs);
            setPagination(data.pagination);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const { data } = await api.get('/audit-logs/stats');
            setStats(data);
        } catch (err) {
            console.error(err);
        }
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <HistoryIcon color="primary" sx={{ fontSize: 32 }} />
                <Typography variant="h4" fontWeight="bold">Audit Logs</Typography>
            </Box>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
                Track all actions performed across the system
            </Typography>

            {/* Quick Stats */}
            {stats && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={4}>
                        <Card elevation={1} sx={{ bgcolor: '#e3f2fd' }}>
                            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                                <Typography variant="h4" fontWeight="bold" color="primary">
                                    {stats.recentCount}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Actions (last 24h)
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Card elevation={1} sx={{ bgcolor: '#e8f5e9' }}>
                            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                                <Typography variant="h4" fontWeight="bold" color="success.main">
                                    {stats.byTargetType?.length || 0}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Active Categories
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Card elevation={1} sx={{ bgcolor: '#fff3e0' }}>
                            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                                <Typography variant="h4" fontWeight="bold" color="warning.main">
                                    {pagination.total}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Total Log Entries
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                    select
                    label="Category"
                    value={filters.targetType}
                    onChange={(e) => handleFilterChange('targetType', e.target.value)}
                    size="small"
                    sx={{ minWidth: 160 }}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                    }}
                >
                    <MenuItem value="">All Categories</MenuItem>
                    <MenuItem value="TENDER">Tenders</MenuItem>
                    <MenuItem value="BID">Bids</MenuItem>
                    <MenuItem value="USER">Users</MenuItem>
                    <MenuItem value="APPROVAL">Approvals</MenuItem>
                    <MenuItem value="EVALUATION">Evaluations</MenuItem>
                    <MenuItem value="AUTH">Authentication</MenuItem>
                </TextField>

                <TextField
                    select
                    label="Action"
                    value={filters.action}
                    onChange={(e) => handleFilterChange('action', e.target.value)}
                    size="small"
                    sx={{ minWidth: 200 }}
                >
                    <MenuItem value="">All Actions</MenuItem>
                    <MenuItem value="TENDER_CREATED">Tender Created</MenuItem>
                    <MenuItem value="TENDER_PUBLISHED">Tender Published</MenuItem>
                    <MenuItem value="TENDER_DELETED">Tender Deleted</MenuItem>
                    <MenuItem value="BID_SUBMITTED">Bid Submitted</MenuItem>
                    <MenuItem value="APPROVAL_INITIATED">Approval Initiated</MenuItem>
                    <MenuItem value="APPROVAL_APPROVED">Approval Approved</MenuItem>
                    <MenuItem value="APPROVAL_REJECTED">Approval Rejected</MenuItem>
                    <MenuItem value="USER_VERIFIED">User Verified</MenuItem>
                    <MenuItem value="USER_REJECTED">User Rejected</MenuItem>
                    <MenuItem value="USER_DELETED">User Deleted</MenuItem>
                </TextField>
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Log Table */}
            <TableContainer component={Paper} elevation={2}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>Timestamp</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Performed By</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                    <Typography color="text.secondary">No audit logs found</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log) => (
                                <TableRow key={log._id} hover>
                                    <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                                        {formatTime(log.createdAt)}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={log.action.replace(/_/g, ' ')}
                                            size="small"
                                            color={actionColors[log.action] || 'default'}
                                            variant="outlined"
                                            sx={{ fontSize: '0.7rem' }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            {targetIcons[log.targetType]}
                                            <Typography variant="caption">{log.targetType}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="medium">
                                            {log.performedBy?.name || 'System'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {log.performedBy?.role}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ maxWidth: 300 }}>
                                            {log.description}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Pagination */}
            {pagination.pages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                        count={pagination.pages}
                        page={pagination.page}
                        onChange={(_, p) => setPagination(prev => ({ ...prev, page: p }))}
                        color="primary"
                        showFirstButton
                        showLastButton
                    />
                </Box>
            )}
        </Box>
    );
};

export default AuditLogViewer;
