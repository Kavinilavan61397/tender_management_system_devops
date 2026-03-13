import { useAuth } from '../context/AuthContext';
import AdminDashboard from './admin/AdminDashboard';
import VendorDashboard from './vendor/VendorDashboard';
import EvaluatorDashboard from './evaluation/EvaluatorDashboard';

const DashboardHome = () => {
    const { user } = useAuth();

    if (user?.role === 'ADMIN' || user?.role === 'DIRECTOR' || user?.role === 'MANAGER') {
        return <AdminDashboard />;
    }

    if (user?.role === 'EVALUATOR') {
        return <EvaluatorDashboard />;
    }

    return <VendorDashboard />;
};

export default DashboardHome;
