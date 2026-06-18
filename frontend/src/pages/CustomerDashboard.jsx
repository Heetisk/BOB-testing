import { useState, useEffect } from 'react';
import {
  Shield, ArrowLeftRight, Bell, Smartphone, AlertTriangle,
  CheckCircle, Lock, Eye, MapPin, ShieldCheck
} from 'lucide-react';
import {
  getCustomerSummary, getCustomerRecentLogins,
  getCustomerRecentTransactions, getCustomerDevices, getCustomerAlerts
} from '../api/dashboardApi';
import RiskScoreCard from '../components/RiskScoreCard';
import RiskBadge from '../components/RiskBadge';
import StatCard from '../components/StatCard';
import AlertCard from '../components/AlertCard';
import { formatDate, formatCurrency } from '../utils/helpers';
import Loader from '../components/Loader';

export default function CustomerDashboard() {
  const [summary, setSummary] = useState(null);
  const [logins, setLogins] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [devices, setDevices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, l, t, d, a] = await Promise.all([
          getCustomerSummary(),
          getCustomerRecentLogins(),
          getCustomerRecentTransactions(),
          getCustomerDevices(),
          getCustomerAlerts(),
        ]);
        setSummary(s);
        setLogins(l.logins || []);
        setTransactions(t.transactions || []);
        setDevices(d.devices || []);
        setAlerts(a.alerts || []);
      } catch (err) {
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Loader text="Loading your dashboard..." />;
  if (error) return <div className="text-danger text-center py-16 text-lg">{error}</div>;

  const recentLogins = logins.slice(0, 5);
  const recentTx = transactions.slice(0, 5);
  const openAlerts = alerts.filter((a) => a.status === 'open');

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-6 sm:p-8 border border-primary/10">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck size={28} className="text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">My Account</h1>
        </div>
        <p className="text-text-secondary text-sm sm:text-base ml-10">Your account security overview and activity</p>
      </div>

      {/* Risk Score */}
      {summary?.avg_risk_score > 0 && (
        <RiskScoreCard
          score={summary.avg_risk_score}
          level={summary.avg_risk_score > 70 ? 'High' : summary.avg_risk_score > 30 ? 'Medium' : 'Low'}
          reasons={[]}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Logins" value={summary?.total_logins || 0} icon={Shield} color="info" />
        <StatCard title="Transactions" value={summary?.total_transactions || 0} icon={ArrowLeftRight} color="success" />
        <StatCard title="Alerts" value={summary?.total_alerts || 0} icon={Bell} color="warning" />
        <StatCard title="High Risk" value={summary?.high_risk_logins || 0} icon={AlertTriangle} color="danger" />
        <StatCard title="Trusted Devices" value={summary?.trusted_devices || 0} icon={Smartphone} color="primary" />
      </div>

      {/* Open Alerts */}
      {openAlerts.length > 0 && (
        <div className="bg-danger/5 border border-danger/20 rounded-2xl p-5 sm:p-6">
          <h3 className="text-danger font-semibold mb-4 flex items-center gap-2 text-base">
            <Bell size={18} />
            Open Alerts ({openAlerts.length})
          </h3>
          <div className="space-y-3">
            {openAlerts.slice(0, 3).map((alert) => (
              <AlertCard key={alert.alert_id} alert={alert} />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Logins */}
        <div className="bg-bg-card border border-border rounded-2xl p-6 sm:p-7">
          <h3 className="text-text-primary font-semibold mb-5 flex items-center gap-2.5 text-base">
            <Eye size={18} className="text-primary" />
            Recent Logins
          </h3>
          <div className="space-y-3">
            {recentLogins.map((login) => (
              <div key={login.login_id} className="flex items-center justify-between p-4 bg-bg-dark/50 rounded-xl border border-border/50 hover:border-border transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-info/10 flex items-center justify-center shrink-0">
                    <MapPin size={16} className="text-info" />
                  </div>
                  <div>
                    <p className="text-text-primary text-sm font-medium">{login.city}</p>
                    <p className="text-text-muted text-xs mt-0.5">{login.browser} on {login.os}</p>
                  </div>
                </div>
                <div className="text-right">
                  <RiskBadge level={login.risk_level} size="sm" />
                  <p className="text-text-muted text-xs mt-1.5">{formatDate(login.login_time)}</p>
                </div>
              </div>
            ))}
            {recentLogins.length === 0 && (
              <p className="text-text-muted text-sm text-center py-6">No login history</p>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-bg-card border border-border rounded-2xl p-6 sm:p-7">
          <h3 className="text-text-primary font-semibold mb-5 flex items-center gap-2.5 text-base">
            <ArrowLeftRight size={18} className="text-primary" />
            Recent Transactions
          </h3>
          <div className="space-y-3">
            {recentTx.map((tx) => (
              <div key={tx.transaction_id} className="flex items-center justify-between p-4 bg-bg-dark/50 rounded-xl border border-border/50 hover:border-border transition-colors">
                <div>
                  <p className="text-text-primary text-sm font-medium">{tx.beneficiary_name}</p>
                  <p className="text-text-muted text-xs mt-0.5">{tx.city}</p>
                </div>
                <div className="text-right">
                  <p className="text-text-primary text-sm font-semibold">{formatCurrency(tx.amount)}</p>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium mt-1 inline-block ${
                    tx.status === 'approved' ? 'bg-success/10 text-success' :
                    tx.status === 'blocked' ? 'bg-danger/10 text-danger' :
                    'bg-warning/10 text-warning'
                  }`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
            {recentTx.length === 0 && (
              <p className="text-text-muted text-sm text-center py-6">No transactions yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Devices */}
      <div className="bg-bg-card border border-border rounded-2xl p-6 sm:p-7">
        <h3 className="text-text-primary font-semibold mb-5 flex items-center gap-2.5 text-base">
          <Smartphone size={18} className="text-primary" />
          My Devices
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device) => (
            <div key={device.device_id} className="flex items-center justify-between p-4 bg-bg-dark/50 rounded-xl border border-border/50 hover:border-border transition-colors">
              <div>
                <p className="text-text-primary text-sm font-medium">{device.device_name}</p>
                <p className="text-text-muted text-xs mt-0.5">{device.browser} on {device.os}</p>
                <p className="text-text-muted text-xs mt-0.5">Last seen: {formatDate(device.last_seen)}</p>
              </div>
              {device.is_trusted ? (
                <span className="flex items-center gap-1.5 text-success text-xs font-medium bg-success/10 px-2.5 py-1 rounded-full">
                  <CheckCircle size={14} /> Trusted
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-warning text-xs font-medium bg-warning/10 px-2.5 py-1 rounded-full">
                  <Lock size={14} /> Unverified
                </span>
              )}
            </div>
          ))}
          {devices.length === 0 && (
            <p className="text-text-muted text-sm text-center py-6 col-span-3">No devices registered</p>
          )}
        </div>
      </div>
    </div>
  );
}
