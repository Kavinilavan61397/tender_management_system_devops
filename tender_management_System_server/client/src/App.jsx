import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import ProtectedRoute from './components/ProtectedRoute';
import TenderList from './pages/tenders/TenderList';
import TenderForm from './pages/tenders/TenderForm';
import TenderDetail from './pages/tenders/TenderDetail';
import UserList from './pages/admin/UserList';
import MyBids from './pages/bids/MyBids';
import BidReview from './pages/evaluation/BidReview';
import ApprovalList from './pages/approval/ApprovalList';
import EvaluatorDashboard from './pages/evaluation/EvaluatorDashboard';
import AuditLogViewer from './pages/admin/AuditLogViewer';
import Profile from './pages/Profile';
import { Container, Typography, Box, Button } from '@mui/material';

// Temporary Home Component (Landing Page)
const Home = () => (
    <Container maxWidth="lg">
        <Box sx={{ my: 30, textAlign: 'center' }}>
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                Tender Management System
            </Typography>
            <Typography variant="h6" color="text.secondary" paragraph>
                Secure, Transparent, and Efficient Tendering Process.
            </Typography>
            <Box sx={{ mt: 4 }}>
                <Link to="/login" style={{ textDecoration: 'none', marginRight: '20px' }}>
                    <Button variant="outlined" size="large">Proceed to Homepage</Button>
                </Link>
                {/* <Link to="/register" style={{ textDecoration: 'none' }}>
                    <Button variant="outlined" size="large">Register</Button>
                </Link> */}
            </Box>
        </Box>
    </Container>
);

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Protected Dashboard Routes */}
                    <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                        <Route path="dashboard" element={<DashboardHome />} />
                        <Route path="tenders" element={<TenderList />} />
                        <Route path="tenders/new" element={<TenderForm />} />
                        <Route path="tenders/:id" element={<TenderDetail />} />
                        <Route path="tenders/:id/edit" element={<TenderForm />} />
                        <Route path="users" element={<UserList />} />
                        <Route path="my-bids" element={<MyBids />} />
                        <Route path="tenders/:tenderId/bids" element={<BidReview />} />
                        <Route path="evaluations" element={<EvaluatorDashboard />} />
                        <Route path="approvals" element={<ApprovalList />} />
                        <Route path="audit-logs" element={<AuditLogViewer />} />
                        <Route path="profile" element={<Profile />} />
                    </Route>
                </Routes>
            </Router>
        </AuthProvider>
    )
}

export default App;
