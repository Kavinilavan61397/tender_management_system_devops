import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import {
    Box, Typography, Paper, Grid, Card, CardContent, CardActions,
    Button, Chip, CircularProgress, Alert, Divider
} from '@mui/material';
import {
    RateReview as EvaluateIcon,
    Assignment as TenderIcon,
    EventNote as DateIcon,
    Category as CategoryIcon
} from '@mui/icons-material';

const EvaluatorDashboard = () => {
    const navigate = useNavigate();
    const [tenders, setTenders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchEvaluationTenders();
    }, []);

    const fetchEvaluationTenders = async () => {
        try {
            setLoading(true);
            // Fetch tenders specifically in EVALUATION status
            const { data } = await api.get('/tenders?status=EVALUATION');
            setTenders(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load evaluation tasks');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
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
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                Evaluator Dashboard
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
                Review and score bids for tenders in the evaluation phase.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {tenders.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#f8f9fa' }}>
                    <EvaluateIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        No Tenders Pending Evaluation
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        When an admin moves a tender to the evaluation phase, it will appear here for you to review.
                    </Typography>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {tenders.map((tender) => (
                        <Grid item xs={12} md={6} lg={4} key={tender._id}>
                            <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderTop: '4px solid #1976d2' }}>
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Chip
                                            icon={<CategoryIcon sx={{ fontSize: '16px !important' }} />}
                                            label={tender.category}
                                            size="small"
                                            variant="outlined"
                                            color="primary"
                                        />
                                        <Chip label="EVALUATION" color="warning" size="small" />
                                    </Box>

                                    <Typography variant="h6" fontWeight="bold" gutterBottom sx={{
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        minHeight: '3.6em'
                                    }}>
                                        {tender.title}
                                    </Typography>

                                    <Divider sx={{ my: 1.5 }} />

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <DateIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                        <Typography variant="body2" color="text.secondary">
                                            Deadline: {formatDate(tender.deadline)}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <TenderIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                        <Typography variant="body2" color="text.secondary">
                                            Budget: <strong>₹{tender.budget.toLocaleString('en-IN')}</strong>
                                        </Typography>
                                    </Box>
                                </CardContent>
                                <CardActions sx={{ p: 2, pt: 0 }}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        startIcon={<EvaluateIcon />}
                                        onClick={() => navigate(`/tenders/${tender._id}/bids`)}
                                    >
                                        Review Bids
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
};

export default EvaluatorDashboard;
