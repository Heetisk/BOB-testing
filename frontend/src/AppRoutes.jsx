import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import RiskAnalysisPage from './pages/RiskAnalysisPage';
import TransactionsPage from './pages/TransactionsPage';
import AlertsPage from './pages/AlertsPage';
import CasesPage from './pages/CasesPage';
import KycPage from './pages/KycPage';
import AuditPage from './pages/AuditPage';
import VerificationPage from './pages/VerificationPage';
import PrivacyPage from './pages/PrivacyPage';
import NotFoundPage from './pages/NotFoundPage';
import SimulationPage from './pages/SimulationPage';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Loader from './components/Loader';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <Loader text="Loading..." />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-bg-dark">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-w-0 px-5 py-5 sm:px-8 sm:py-6 lg:px-10 lg:py-8 max-w-[1600px]">{children}</main>
      </div>
    </div>
  );
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <Loader text="Loading..." />;
  if (user) return <Navigate to="/dashboard" replace />;

  return children;
}

function DashboardRouter() {
  const { user } = useAuth();
  if (user?.role === 'admin' || user?.role === 'fraud_team') {
    return <AdminDashboard />;
  }
  return <CustomerDashboard />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
      <Route path="/risk-analysis" element={<ProtectedRoute><RiskAnalysisPage /></ProtectedRoute>} />
      <Route path="/transactions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
      <Route path="/alerts" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
      <Route path="/cases" element={<ProtectedRoute><CasesPage /></ProtectedRoute>} />
      <Route path="/kyc" element={<ProtectedRoute><KycPage /></ProtectedRoute>} />
      <Route path="/audit" element={<ProtectedRoute><AuditPage /></ProtectedRoute>} />
      <Route path="/verification" element={<ProtectedRoute><VerificationPage /></ProtectedRoute>} />
      <Route path="/privacy" element={<ProtectedRoute><PrivacyPage /></ProtectedRoute>} />
      <Route path="/simulation" element={<ProtectedRoute><SimulationPage /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
