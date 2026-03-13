import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, IconButton, TextField, MenuItem,
    CircularProgress, Alert, Snackbar, Tabs, Tab, Tooltip
} from '@mui/material';
import {
    CheckCircle as VerifyIcon,
    Cancel as RejectIcon,
    Delete as DeleteIcon,
    VerifiedUser as VerifiedBadge
} from '@mui/icons-material';

const roleColors = {
    ADMIN: 'error',
    VENDOR: 'primary',
    EVALUATOR: 'warning',
    MANAGER: 'info',
    DIRECTOR: 'secondary'
};

const UserList = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [tabValue, setTabValue] = useState(0); // 0=All, 1=Pending Vendors
    const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null, confirmColor: 'primary' });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filterRole) params.role = filterRole;
            if (tabValue === 1) {
                params.role = 'VENDOR';
                params.isVerified = 'false';
            }

            const { data } = await api.get('/users', { params });
            setUsers(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [filterRole, tabValue]);

    const handleVerify = (id, name) => {
        setConfirmDialog({
            open: true,
            title: 'Verify Vendor',
            message: `Approve "${name}" as a verified vendor? They will be able to view and bid on tenders.`,
            confirmColor: 'success',
            onConfirm: async () => {
                try {
                    await api.put(`/users/${id}/verify`);
                    setSnackbar({ open: true, message: `${name} verified successfully!`, severity: 'success' });
                    fetchUsers();
                } catch (err) {
                    setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to verify', severity: 'error' });
                } finally {
                    setConfirmDialog({ ...confirmDialog, open: false });
                }
            }
        });
    };

    const handleReject = (id, name) => {
        setConfirmDialog({
            open: true,
            title: 'Reject Vendor',
            message: `Reject "${name}"? Their access will be revoked.`,
            confirmColor: 'error',
            onConfirm: async () => {
                try {
                    await api.put(`/users/${id}/reject`);
                    setSnackbar({ open: true, message: `${name} has been rejected`, severity: 'warning' });
                    fetchUsers();
                } catch (err) {
                    setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to reject', severity: 'error' });
                } finally {
                    setConfirmDialog({ ...confirmDialog, open: false });
                }
            }
        });
    };

    const handleDelete = (id, name) => {
        setConfirmDialog({
            open: true,
            title: 'Delete User',
            message: `Permanently delete "${name}"? This action cannot be undone.`,
            confirmColor: 'error',
            onConfirm: async () => {
                try {
                    await api.delete(`/users/${id}`);
                    setSnackbar({ open: true, message: `${name} deleted successfully`, severity: 'success' });
                    fetchUsers();
                } catch (err) {
                    setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to delete', severity: 'error' });
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

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 3 }}>User Management</Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {/* Tabs */}
            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
                <Tab label="All Users" />
                <Tab label="Pending Vendors" />
            </Tabs>

            {/* Filters (only for All Users tab) */}
            {tabValue === 0 && (
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <TextField
                        select
                        label="Filter by Role"
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        size="small"
                        sx={{ minWidth: 180 }}
                    >
                        <MenuItem value="">All Roles</MenuItem>
                        <MenuItem value="ADMIN">Admin</MenuItem>
                        <MenuItem value="VENDOR">Vendor</MenuItem>
                        <MenuItem value="EVALUATOR">Evaluator</MenuItem>
                        <MenuItem value="MANAGER">Manager</MenuItem>
                        <MenuItem value="DIRECTOR">Director</MenuItem>
                    </TextField>
                </Box>
            )}

            {/* Users Table */}
            <TableContainer component={Paper} elevation={2}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                            <TableCell><strong>Name</strong></TableCell>
                            <TableCell><strong>Email</strong></TableCell>
                            <TableCell><strong>Role</strong></TableCell>
                            <TableCell><strong>Status</strong></TableCell>
                            <TableCell><strong>Company</strong></TableCell>
                            <TableCell><strong>Registered</strong></TableCell>
                            <TableCell align="center"><strong>Actions</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    <Typography variant="body1" color="text.secondary" sx={{ py: 4 }}>
                                        {tabValue === 1 ? 'No pending vendor approvals.' : 'No users found.'}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((u) => (
                                <TableRow key={u._id} hover>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            {u.name}
                                            {u.isVerified && (
                                                <Tooltip title="Verified">
                                                    <VerifiedBadge sx={{ fontSize: 16, color: 'success.main' }} />
                                                </Tooltip>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>{u.email}</TableCell>
                                    <TableCell>
                                        <Chip label={u.role} color={roleColors[u.role] || 'default'} size="small" />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={u.isVerified ? 'Verified' : 'Pending'}
                                            color={u.isVerified ? 'success' : 'warning'}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>{u.profile?.companyName || '—'}</TableCell>
                                    <TableCell>{formatDate(u.createdAt)}</TableCell>
                                    <TableCell align="center">
                                        {/* Don't show actions for the current user */}
                                        {u._id !== currentUser?._id && (
                                            <>
                                                {!u.isVerified && (
                                                    <Tooltip title="Verify">
                                                        <IconButton size="small" color="success" onClick={() => handleVerify(u._id, u.name)}>
                                                            <VerifyIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {u.isVerified && u.role === 'VENDOR' && (
                                                    <Tooltip title="Reject">
                                                        <IconButton size="small" color="warning" onClick={() => handleReject(u._id, u.name)}>
                                                            <RejectIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                <Tooltip title="Delete">
                                                    <IconButton size="small" color="error" onClick={() => handleDelete(u._id, u.name)}>
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </>
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
                confirmText={confirmDialog.title?.includes('Delete') ? 'Delete' : confirmDialog.title?.includes('Reject') ? 'Reject' : 'Verify'}
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

export default UserList;
