import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Box, Typography, TextField, Button, Alert, Paper, MenuItem, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const Register = () => {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const handleClickShowConfirmPassword = () => setShowConfirmPassword((show) => !show);

    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

    const formik = useFormik({
        initialValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            role: 'VENDOR', // Default role
            companyName: '',
        },
        validationSchema: Yup.object({
            name: Yup.string().required('Required'),
            email: Yup.string().email('Invalid email address').required('Required'),
            password: Yup.string().min(6, 'Must be at least 6 characters').required('Required'),
            confirmPassword: Yup.string()
                .oneOf([Yup.ref('password'), null], 'Passwords must match')
                .required('Required'),
            role: Yup.string().required('Required'),
            companyName: Yup.string().when('role', {
                is: 'VENDOR',
                then: () => Yup.string().required('Company Name is required for Vendors'),
                otherwise: () => Yup.string().notRequired(),
            }),
        }),
        onSubmit: async (values) => {
            try {
                const data = await register({
                    name: values.name,
                    email: values.email,
                    password: values.password,
                    role: values.role,
                    companyName: values.companyName
                });

                if (data.token) {
                    navigate('/dashboard');
                } else {
                    setSuccess(true);
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Registration failed');
            }
        },
    });

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                    <Typography component="h1" variant="h5">
                        Sign Up
                    </Typography>

                    {success ? (
                        <Box sx={{ mt: 3, textAlign: 'center' }}>
                            <Alert severity="success" sx={{ mb: 2 }}>
                                Registration successful!
                            </Alert>
                            <Typography variant="body1" gutterBottom>
                                Your account has been created and is currently <strong>pending administrator approval</strong>.
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                You will receive a notification once your account is verified.
                            </Typography>
                            <Button
                                fullWidth
                                variant="contained"
                                component={Link}
                                to="/login"
                            >
                                Back to Login
                            </Button>
                        </Box>
                    ) : (
                        <>
                            {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}
                            <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 1, width: '100%' }}>
                                <TextField
                                    margin="normal"
                                    fullWidth
                                    id="name"
                                    label="Full Name"
                                    name="name"
                                    autoFocus
                                    value={formik.values.name}
                                    onChange={formik.handleChange}
                                    error={formik.touched.name && Boolean(formik.errors.name)}
                                    helperText={formik.touched.name && formik.errors.name}
                                />
                                <TextField
                                    margin="normal"
                                    fullWidth
                                    id="email"
                                    label="Email Address"
                                    name="email"
                                    value={formik.values.email}
                                    onChange={formik.handleChange}
                                    error={formik.touched.email && Boolean(formik.errors.email)}
                                    helperText={formik.touched.email && formik.errors.email}
                                />
                                <TextField
                                    margin="normal"
                                    fullWidth
                                    select
                                    label="Role"
                                    name="role"
                                    value={formik.values.role}
                                    onChange={formik.handleChange}
                                >
                                    <MenuItem value="VENDOR">Vendor</MenuItem>
                                    <MenuItem value="EVALUATOR">Evaluator</MenuItem>
                                    <MenuItem value="MANAGER">Manager</MenuItem>
                                    <MenuItem value="DIRECTOR">Director</MenuItem>
                                </TextField>

                                {formik.values.role === 'VENDOR' && (
                                    <TextField
                                        margin="normal"
                                        fullWidth
                                        id="companyName"
                                        label="Company Name"
                                        name="companyName"
                                        value={formik.values.companyName}
                                        onChange={formik.handleChange}
                                        error={formik.touched.companyName && Boolean(formik.errors.companyName)}
                                        helperText={formik.touched.companyName && formik.errors.companyName}
                                    />
                                )}

                                <TextField
                                    margin="normal"
                                    fullWidth
                                    name="password"
                                    label="Password"
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    value={formik.values.password}
                                    onChange={formik.handleChange}
                                    error={formik.touched.password && Boolean(formik.errors.password)}
                                    helperText={formik.touched.password && formik.errors.password}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    aria-label="toggle password visibility"
                                                    onClick={handleClickShowPassword}
                                                    onMouseDown={handleMouseDownPassword}
                                                    edge="end"
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                <TextField
                                    margin="normal"
                                    fullWidth
                                    name="confirmPassword"
                                    label="Confirm Password"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    id="confirmPassword"
                                    value={formik.values.confirmPassword}
                                    onChange={formik.handleChange}
                                    error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                                    helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    aria-label="toggle confirm password visibility"
                                                    onClick={handleClickShowConfirmPassword}
                                                    onMouseDown={handleMouseDownPassword}
                                                    edge="end"
                                                >
                                                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    sx={{ mt: 3, mb: 2 }}
                                >
                                    Sign Up
                                </Button>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <Link to="/login" style={{ textDecoration: 'none' }}>
                                        <Typography variant="body2" color="primary">
                                            {"Already have an account? Sign In"}
                                        </Typography>
                                    </Link>
                                </Box>
                            </Box>
                        </>
                    )}
                </Paper>
            </Box>
        </Container>
    );
};

export default Register;
