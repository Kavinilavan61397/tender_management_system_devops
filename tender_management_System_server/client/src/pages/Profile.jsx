import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Box,
    Typography,
    Paper,
    Avatar,
    Grid,
    Divider,
    Chip,
    Card,
    CardContent,
    Container
} from '@mui/material';
import {
    Email as EmailIcon,
    Badge as RoleIcon,
    Business as CompanyIcon,
    VerifiedUser as VerifiedIcon
} from '@mui/icons-material';

const Profile = () => {
    const { user, refreshUser } = useAuth();

    useEffect(() => {
        refreshUser();
    }, []);

    if (!user) {
        return <Typography>Loading profile...</Typography>;
    }

    return (
        <Container maxWidth="md">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    User Profile
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
                    Manage and view your account details
                </Typography>

                <Grid container spacing={4}>
                    {/* Profile Header Card */}
                    <Grid item xs={12} md={4}>
                        <Paper elevation={3} sx={{ p: 4, textAlign: 'center', height: '100%' }}>
                            <Avatar
                                sx={{
                                    width: 120,
                                    height: 120,
                                    bgcolor: '#1976d2',
                                    fontSize: '3rem',
                                    margin: '0 auto 20px'
                                }}
                            >
                                {user.name?.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="h5" fontWeight="bold">
                                {user.name}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" gutterBottom>
                                {user.role}
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                                <Chip
                                    icon={<VerifiedIcon />}
                                    label={user.isVerified ? "Verified Account" : "Pending Verification"}
                                    color={user.isVerified ? "success" : "warning"}
                                    variant="outlined"
                                />
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Details Card */}
                    <Grid item xs={12} md={8}>
                        <Card elevation={2}>
                            <CardContent sx={{ p: 4 }}>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    Account Information
                                </Typography>
                                <Divider sx={{ mb: 3 }} />

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <EmailIcon color="primary" />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Email Address
                                            </Typography>
                                            <Typography variant="body1" fontWeight="medium">
                                                {user.email}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <RoleIcon color="primary" />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                System Role
                                            </Typography>
                                            <Typography variant="body1" fontWeight="medium">
                                                {user.role}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {user.role === 'VENDOR' && user.profile?.companyName && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <CompanyIcon color="primary" />
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    Company Name
                                                </Typography>
                                                <Typography variant="body1" fontWeight="medium">
                                                    {user.profile.companyName}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    )}

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <VerifiedIcon color="primary" />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Account Status
                                            </Typography>
                                            <Typography variant="body1" fontWeight="medium">
                                                {user.isVerified ? 'Active & Verified' : 'Awaiting Administrative Approval'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
};

export default Profile;
