import { useState, useEffect } from 'react';
import { Users, Shield, ArrowLeftRight, Bell, FolderOpen, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';
import { getDashboardSummary, getRiskDistribution, getFraudReasons, getLoginTrends } from '../api/dashboardApi';
import StatCard from '../components/StatCard';
import RiskDistributionChart from '../charts/RiskDistributionChart';
import FraudReasonChart from '../charts/FraudReasonChart';
import LoginTrendChart from '../charts/LoginTrendChart';
import Loader from '../components/Loader';

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [riskDist, setRiskDist] = useState(null);
  const [fraudReasons, setFraudReasons] = useState(null);
  const [loginTrends, setLoginTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, riskRes, fraudRes, trendRes] = await Promise.allSettled([
          getDashboardSummary(),
          getRiskDistribution(),
          getFraudReasons(),
          getLoginTrends(),
        ]);

        if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value);
        if (riskRes.status === 'fulfilled') setRiskDist(riskRes.value);
        if (fraudRes.status === 'fulfilled') setFraudReasons(fraudRes.value);
        if (trendRes.status === 'fulfilled') setLoginTrends(trendRes.value);

        const failed = [summaryRes, riskRes, fraudRes, trendRes].filter((r) => r.status === 'rejected');
        if (failed.length > 0) {
          console.error('Dashboard partial load failure:', failed.map((r) => r.reason?.message || r.reason));
        }
        if (summaryRes.status === 'rejected') {
          setError('Failed to load dashboard summary');
        }
      } catch (err) {
        console.error('Dashboard load error:', err.response?.data || err.message);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <Loader text="Loading dashboard..." />;
  if (error) return <div className="text-danger text-center py-16 text-lg">{error}</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-secondary/10 via-secondary/5 to-transparent rounded-xl p-6 sm:p-8 border border-secondary/10">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 size={28} className="text-secondary" />
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Admin Dashboard</h1>
        </div>
        <p className="text-text-secondary text-sm sm:text-base ml-10">System-wide identity trust overview</p>
      </div>

      {/* Stats Row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={summary?.total_users || 0} icon={Users} color="primary" />
        <StatCard title="Total Logins" value={summary?.total_logins || 0} icon={Shield} color="info" />
        <StatCard title="Transactions" value={summary?.total_transactions || 0} icon={ArrowLeftRight} color="success" />
        <StatCard title="Alerts" value={summary?.total_alerts || 0} icon={Bell} color="warning" />
      </div>

      {/* Stats Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="High Risk Logins" value={summary?.high_risk_logins || 0} icon={AlertTriangle} color="danger" />
        <StatCard title="Fraud Cases" value={summary?.total_cases || 0} icon={FolderOpen} color="warning" />
        <StatCard title="Blocked Transactions" value={summary?.blocked_transactions || 0} icon={CheckCircle} color="info" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg-card border border-border rounded-xl p-6 sm:p-7">
          <h3 className="text-text-primary font-semibold mb-5 text-base">Risk Distribution</h3>
          <RiskDistributionChart data={riskDist} />
        </div>
        <div className="bg-bg-card border border-border rounded-xl p-6 sm:p-7">
          <h3 className="text-text-primary font-semibold mb-5 text-base">Top Fraud Reasons</h3>
          <FraudReasonChart data={fraudReasons} />
        </div>
      </div>

      <div className="bg-bg-card border border-border rounded-xl p-6 sm:p-7">
        <h3 className="text-text-primary font-semibold mb-5 text-base">Login Trends (by Hour)</h3>
        <LoginTrendChart data={loginTrends} />
      </div>
    </div>
  );
}
