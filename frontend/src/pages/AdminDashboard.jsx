import { useState, useEffect } from 'react';
import { Users, Shield, ArrowLeftRight, Bell, FolderOpen, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';
import { getDashboardSummary, getRiskDistribution, getFraudReasons, getLoginTrends } from '../api/dashboardApi';
import StatCard from '../components/StatCard';
import Card from '../components/Card';
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

        if (summaryRes.status === 'fulfilled') {
          setSummary(summaryRes.value);
        } else {
          const status = summaryRes.reason?.response?.status;
          if (status === 401) return;
          if (status === 403) setError('Dashboard requires admin access.');
          else if (status) setError(`Failed to load dashboard (HTTP ${status}). Check backend status.`);
          else setError('Failed to connect to backend. The server may be starting up (30-60s on free tier).');
        }

        if (riskRes.status === 'fulfilled') setRiskDist(riskRes.value);
        if (fraudRes.status === 'fulfilled') setFraudReasons(fraudRes.value);
        if (trendRes.status === 'fulfilled') setLoginTrends(trendRes.value);

        const failed = [summaryRes, riskRes, fraudRes, trendRes].filter((r) => r.status === 'rejected');
        if (failed.length > 0 && !error) {
          console.error('Dashboard partial load failure:', failed.map((r) => r.reason?.message || r.reason));
        }
      } catch (err) {
        console.error('Dashboard load error:', err.response?.data || err.message);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <Loader text="Loading dashboard..." />;
  if (error) return <div className="text-danger text-center py-16 text-lg">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up">
        <div className="flex items-center gap-3 mb-1">
          <BarChart3 size={22} className="text-accent" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-text-1 font-display tracking-tight">System Overview</h1>
        </div>
        <p className="text-sm text-text-3 ml-[34px]">Real-time fraud detection metrics</p>
      </div>

      {/* Primary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up stagger-1">
        <StatCard title="Total Users" value={summary?.total_users || 0} icon={Users} color="accent" />
        <StatCard title="Total Logins" value={summary?.total_logins || 0} icon={Shield} color="info" />
        <StatCard title="Transactions" value={summary?.total_transactions || 0} icon={ArrowLeftRight} color="success" />
        <StatCard title="Alerts" value={summary?.total_alerts || 0} icon={Bell} color="warning" />
      </div>

      {/* Critical metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in-up stagger-2">
        <StatCard title="High Risk Logins" value={summary?.high_risk_logins || 0} icon={AlertTriangle} color="danger" />
        <StatCard title="Fraud Cases" value={summary?.total_cases || 0} icon={FolderOpen} color="warning" />
        <StatCard title="Blocked Transactions" value={summary?.blocked_transactions || 0} icon={CheckCircle} color="info" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in-up stagger-3">
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-text-1 font-display mb-5">Risk Distribution</h3>
          <RiskDistributionChart data={riskDist} />
        </Card>
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-text-1 font-display mb-5">Top Fraud Reasons</h3>
          <FraudReasonChart data={fraudReasons} />
        </Card>
      </div>

      {/* Login trends — full width */}
      <Card padding="lg" className="animate-fade-in-up stagger-4">
        <h3 className="text-sm font-semibold text-text-1 font-display mb-5">Login Trends (by Hour)</h3>
        <LoginTrendChart data={loginTrends} />
      </Card>
    </div>
  );
}
