import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import {
    Box, Typography, TextField, Button, Paper, MenuItem, Alert, CircularProgress
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const TenderForm = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // If editing, id will be defined
    const isEditing = Boolean(id);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(isEditing);

    const formik = useFormik({
        initialValues: {
            title: '',
            description: '',
            category: 'OTHER',
            budget: '',
            deadline: '',
            requirements: '',
            eligibilityCriteria: '',
        },
        validationSchema: Yup.object({
            title: Yup.string().required('Title is required'),
            description: Yup.string().required('Description is required'),
            category: Yup.string().required('Category is required'),
            budget: Yup.number().min(0, 'Budget must be positive').required('Budget is required'),
            deadline: Yup.date().min(new Date(), 'Deadline must be in the future').required('Deadline is required'),
        }),
        onSubmit: async (values) => {
            try {
                if (isEditing) {
                    await api.put(`/tenders/${id}`, values);
                } else {
                    await api.post('/tenders', values);
                }
                navigate('/tenders');
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to save tender');
            }
        },
    });

    // Load existing tender data if editing
    useEffect(() => {
        if (isEditing) {
            const fetchTender = async () => {
                try {
                    const { data } = await api.get(`/tenders/${id}`);
                    formik.setValues({
                        title: data.title,
                        description: data.description,
                        category: data.category,
                        budget: data.budget,
                        deadline: data.deadline?.split('T')[0] || '',
                        requirements: data.requirements || '',
                        eligibilityCriteria: data.eligibilityCriteria || '',
                    });
                } catch (err) {
                    setError('Failed to load tender');
                } finally {
                    setLoading(false);
                }
            };
            fetchTender();
        }
    }, [id]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                {isEditing ? 'Edit Tender' : 'Create New Tender'}
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Paper sx={{ p: 4, maxWidth: 700 }} elevation={2}>
                <Box component="form" onSubmit={formik.handleSubmit}>
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Tender Title"
                        name="title"
                        value={formik.values.title}
                        onChange={formik.handleChange}
                        error={formik.touched.title && Boolean(formik.errors.title)}
                        helperText={formik.touched.title && formik.errors.title}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Description"
                        name="description"
                        multiline
                        rows={4}
                        value={formik.values.description}
                        onChange={formik.handleChange}
                        error={formik.touched.description && Boolean(formik.errors.description)}
                        helperText={formik.touched.description && formik.errors.description}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        select
                        label="Category"
                        name="category"
                        value={formik.values.category}
                        onChange={formik.handleChange}
                    >
                        <MenuItem value="IT">IT</MenuItem>
                        <MenuItem value="CONSTRUCTION">Construction</MenuItem>
                        <MenuItem value="SUPPLY">Supply</MenuItem>
                        <MenuItem value="CONSULTING">Consulting</MenuItem>
                        <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                        <MenuItem value="OTHER">Other</MenuItem>
                    </TextField>
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Budget (INR)"
                        name="budget"
                        type="number"
                        value={formik.values.budget}
                        onChange={formik.handleChange}
                        error={formik.touched.budget && Boolean(formik.errors.budget)}
                        helperText={formik.touched.budget && formik.errors.budget}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Submission Deadline"
                        name="deadline"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        value={formik.values.deadline}
                        onChange={formik.handleChange}
                        error={formik.touched.deadline && Boolean(formik.errors.deadline)}
                        helperText={formik.touched.deadline && formik.errors.deadline}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Requirements"
                        name="requirements"
                        multiline
                        rows={3}
                        value={formik.values.requirements}
                        onChange={formik.handleChange}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Eligibility Criteria"
                        name="eligibilityCriteria"
                        multiline
                        rows={3}
                        value={formik.values.eligibilityCriteria}
                        onChange={formik.handleChange}
                    />
                    <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                        <Button type="submit" variant="contained" size="large">
                            {isEditing ? 'Update Tender' : 'Create Tender'}
                        </Button>
                        <Button variant="outlined" size="large" onClick={() => navigate('/tenders')}>
                            Cancel
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};

export default TenderForm;
