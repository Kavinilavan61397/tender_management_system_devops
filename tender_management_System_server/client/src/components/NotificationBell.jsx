import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import {
    Badge, IconButton, Popover, Box, Typography, List, ListItem, ListItemText,
    ListItemIcon, Divider, Button, Chip, CircularProgress
} from '@mui/material';
import {
    Notifications as BellIcon,
    NotificationsNone as EmptyBellIcon,
    Gavel as TenderIcon,
    Description as BidIcon,
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    VerifiedUser as VerifyIcon,
    Campaign as AlertIcon,
    Circle as DotIcon,
    DoneAll as ReadAllIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';

const typeIcons = {
    BID_SUBMITTED: <BidIcon color="primary" />,
    BID_ACCEPTED: <ApproveIcon color="success" />,
    BID_REJECTED: <RejectIcon color="error" />,
    BID_UNDER_REVIEW: <BidIcon color="info" />,
    TENDER_PUBLISHED: <TenderIcon color="primary" />,
    TENDER_AWARDED: <ApproveIcon color="success" />,
    TENDER_REJECTED: <RejectIcon color="error" />,
    APPROVAL_NEEDED: <AlertIcon color="warning" />,
    APPROVAL_APPROVED: <ApproveIcon color="success" />,
    APPROVAL_REJECTED: <RejectIcon color="error" />,
    VENDOR_VERIFIED: <VerifyIcon color="success" />,
    VENDOR_REJECTED: <RejectIcon color="error" />,
    NEW_VENDOR: <VerifyIcon color="info" />,
    GENERAL: <AlertIcon color="action" />
};

const NotificationBell = () => {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = useCallback(async () => {
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds for new notifications
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const handleOpen = (event) => {
        setAnchorEl(event.currentTarget);
        fetchNotifications();
    };

    const handleClose = () => setAnchorEl(null);

    const handleClick = async (notification) => {
        if (!notification.read) {
            try {
                await api.put(`/notifications/${notification._id}/read`);
                setNotifications(prev =>
                    prev.map(n => n._id === notification._id ? { ...n, read: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            } catch (err) {
                console.error(err);
            }
        }
        if (notification.link) {
            navigate(notification.link);
            handleClose();
        }
    };

    const handleMarkAllRead = async () => {
        try {
            setLoading(true);
            await api.put('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n._id !== id));
            setUnreadCount(prev => {
                const deleted = notifications.find(n => n._id === id);
                return deleted && !deleted.read ? Math.max(0, prev - 1) : prev;
            });
        } catch (err) {
            console.error(err);
        }
    };

    const formatTime = (date) => {
        const diff = Date.now() - new Date(date).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        return new Date(date).toLocaleDateString('en-IN');
    };

    const open = Boolean(anchorEl);

    return (
        <>
            <IconButton color="inherit" onClick={handleOpen} sx={{ mr: 1 }}>
                <Badge badgeContent={unreadCount} color="error" max={99}>
                    {unreadCount > 0 ? <BellIcon /> : <EmptyBellIcon />}
                </Badge>
            </IconButton>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{
                    sx: { width: 380, maxHeight: 500, borderRadius: 2 }
                }}
            >
                {/* Header */}
                <Box sx={{
                    p: 2, display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider'
                }}>
                    <Typography variant="h6" fontWeight="bold">
                        Notifications
                    </Typography>
                    {unreadCount > 0 && (
                        <Button
                            size="small"
                            startIcon={loading ? <CircularProgress size={14} /> : <ReadAllIcon />}
                            onClick={handleMarkAllRead}
                            disabled={loading}
                        >
                            Mark all read
                        </Button>
                    )}
                </Box>

                {/* Notification List */}
                {notifications.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <EmptyBellIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                            No notifications yet
                        </Typography>
                    </Box>
                ) : (
                    <List sx={{ p: 0 }}>
                        {notifications.map((n) => (
                            <ListItem
                                key={n._id}
                                button
                                onClick={() => handleClick(n)}
                                sx={{
                                    bgcolor: n.read ? 'transparent' : 'action.hover',
                                    borderLeft: n.read ? 'none' : '3px solid',
                                    borderColor: 'primary.main',
                                    '&:hover': { bgcolor: 'action.selected' },
                                    py: 1.5
                                }}
                                secondaryAction={
                                    <IconButton
                                        edge="end"
                                        size="small"
                                        onClick={(e) => handleDelete(e, n._id)}
                                        sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                }
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    {typeIcons[n.type] || typeIcons.GENERAL}
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <Typography
                                                variant="body2"
                                                fontWeight={n.read ? 'normal' : 'bold'}
                                                noWrap
                                                component="div"
                                                sx={{ maxWidth: 220 }}
                                            >
                                                {n.title}
                                            </Typography>
                                            {!n.read && <DotIcon sx={{ fontSize: 8, color: 'primary.main' }} />}
                                        </Box>
                                    }
                                    secondary={
                                        <Box>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                component="div"
                                                sx={{
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                {n.message}
                                            </Typography>
                                            <Typography variant="caption" color="text.disabled" component="div" sx={{ mt: 0.3, display: 'block' }}>
                                                {formatTime(n.createdAt)}
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </Popover>
        </>
    );
};

export default NotificationBell;
