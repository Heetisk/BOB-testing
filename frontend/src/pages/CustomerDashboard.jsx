import { useState, useEffect } from 'react';
import {
  Shield, ArrowLeftRight, Bell, Smartphone, AlertTriangle,
  CheckCircle, Eye, MapPin, ShieldCheck
} from 'lucide-react';
import {
  getCustomerSummary, getCustomerRecentLogins,
  getCustomerRecentTransactions, getCustomerDevices, getCustomerAlerts
} from '../api/dashboardApi';
import RiskScoreCard from '../components/RiskScoreCard';
import RiskBadge from '../components/RiskBadge';
import StatCard from '../components/StatCard';
import AlertCard from '../components/AlertCard';
import Card from '../components/Card';
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
        const [summaryRes, loginsRes, txRes, devicesRes, alertsRes] = await Promise.allSettled([
          getCustomerSummary(),
          getCustomerRecentLogins(),
          getCustomerRecentTransactions(),
          getCustomerDevices(),
          getCustomerAlerts(),
        ]);

        if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value);
        if (loginsRes.status === 'fulfilled') setLogins(loginsRes.value?.logins || []);
        if (txRes.status === 'fulfilled') setTransactions(txRes.value?.transactions || []);
        if (devicesRes.status === 'fulfilled') setDevices(devicesRes.value?.devices || []);
        if (alertsRes.status === 'fulfilled') setAlerts(alertsRes.value?.alerts || []);

        const failed = [summaryRes, loginsRes, txRes, devicesRes, alertsRes]
          .filter((r) => r.status === 'rejected');
        if (failed.length > 0) {
          console.error('Dashboard partial load failure:', failed.map((r) => r.reason?.message || r.reason));
        }
        if (summaryRes.status === 'rejected') {
          setError('Failed to load dashboard summary');
        }
      } catch (err) {
        console.error('Dashboard load error:', err.response?.data || err.message);
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <Loader text="Loading your dashboard..." />;
  if (error) return <div className="text-danger text-center py-16 text-lg">{error}</div>;

  const recentLogins = logins.slice(0, 5);
  const recentTx = transactions.slice(0, 5);
  const openAlerts = alerts.filter((a) => a.status === 'open');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up">
        <div className="flex items-center gap-3 mb-1">
          <ShieldCheck size={22} className="text-accent" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-text-1 font-display tracking-tight">My Account</h1>
        </div>
        <p className="text-sm text-text-3 ml-[34px]">Your security overview and recent activity</p>
      </div>

      {/* Risk Score — Hero element */}
      {summary?.avg_risk_score > 0 && (
        <div className="animate-fade-in-up stagger-1">
          <RiskScoreCard
            score={summary.avg_risk_score}
            level={summary.avg_risk_score > 70 ? 'High' : summary.avg_risk_score > 30 ? 'Medium' : 'Low'}
            reasons={[]}
          />
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-3 lg:grid-cols-5 gap-4 animate-fade-in-up stagger-2">
        <StatCard title="Logins" value={summary?.total_logins || 0} icon={Shield} color="info" />
        <StatCard title="Transactions" value={summary?.total_transactions || 0} icon={ArrowLeftRight} color="success" />
        <StatCard title="Alerts" value={summary?.total_alerts || 0} icon={Bell} color="warning" />
        <StatCard title="High Risk" value={summary?.high_risk_logins || 0} icon={AlertTriangle} color="danger" />
        <StatCard title="Trusted Devices" value={summary?.trusted_devices || 0} icon={Smartphone} color="accent" />
      </div>

      {/* Open Alerts */}
      {openAlerts.length > 0 && (
        <Card padding="md" className="border-danger/20 bg-danger-subtle/30 animate-fade-in-up stagger-3">
          <h3 className="text-sm font-semibold text-danger font-display mb-3 flex items-center gap-2">
            <Bell size={16} aria-hidden="true" />
            Open Alerts ({openAlerts.length})
          </h3>
          <div className="space-y-2">
            {openAlerts.slice(0, 3).map((alert) => (
              <AlertCard key={alert.alert_id} alert={alert} />
            ))}
          </div>
        </Card>
      )}

      {/* Two-column: Logins + Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in-up stagger-4">
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-text-1 font-display mb-4 flex items-center gap-2">
            <Eye size={16} className="text-accent" aria-hidden="true" />
            Recent Logins
          </h3>
          <div className="space-y-2">
            {recentLogins.map((login) => (
              <div key={login.login_id} className="flex items-center justify-between p-3 bg-surface-0 rounded-xl border border-surface-3/30 hover:border-surface-3 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center shrink-0">
                    <MapPin size={14} className="text-info" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-1">{login.city}</p>
                    <p className="text-xs text-text-3">{login.browser} on {login.os}</p>
                  </div>
                </div>
                <div className="text-right">
                  <RiskBadge level={login.risk_level} size="sm" />
                  <p className="text-[10px] text-text-3/60 mt-1">{formatDate(login.login_time)}</p>
                </div>
              </div>
            ))}
            {recentLogins.length === 0 && (
              <p className="text-sm text-text-3 text-center py-6">No login history</p>
            )}
          </div>
        </Card>

        <Card padding="lg">
          <h3 className="text-sm font-semibold text-text-1 font-display mb-4 flex items-center gap-2">
            <ArrowLeftRight size={16} className="text-accent" aria-hidden="true" />
            Recent Transactions
          </h3>
          <div className="space-y-2">
            {recentTx.map((tx) => (
              <div key={tx.transaction_id} className="flex items-center justify-between p-3 bg-surface-0 rounded-xl border border-surface-3/30 hover:border-surface-3 transition-colors">
                <div>
                  <p className="text-sm font-medium text-text-1">{tx.beneficiary_name}</p>
                  <p className="text-xs text-text-3">{tx.city}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-text-1 font-mono">{formatCurrency(tx.amount)}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium inline-block mt-0.5 ${
                    tx.status === 'approved' ? 'text-success bg-success-subtle' :
                    tx.status === 'blocked' ? 'text-danger bg-danger-subtle' :
                    'text-warning bg-warning-subtle'
                  }`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
            {recentTx.length === 0 && (
              <p className="text-sm text-text-3 text-center py-6">No transactions yet</p>
            )}
          </div>
        </Card>
      </div>

      {/* Devices */}
      <Card padding="lg" className="animate-fade-in-up stagger-5">
        <h3 className="text-sm font-semibold text-text-1 font-display mb-4 flex items-center gap-2">
          <Smartphone size={16} className="text-accent" aria-hidden="true" />
          My Devices
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {devices.map((device) => (
            <div key={device.device_id} className="flex items-center justify-between p-3 bg-surface-0 rounded-xl border border-surface-3/30 hover:border-surface-3 transition-colors">
              <div>
                <p className="text-sm font-medium text-text-1">{device.device_name}</p>
                <p className="text-xs text-text-3">{device.browser} on {device.os}</p>
                <p className="text-[10px] text-text-3/60 mt-0.5">Last seen: {formatDate(device.last_seen)}</p>
              </div>
              {device.is_trusted ? (
                <span className="flex items-center gap-1 text-[10px] font-medium text-success bg-success-subtle px-2 py-0.5 rounded-full">
                  <CheckCircle size={10} aria-hidden="true" /> Trusted
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-medium text-warning bg-warning-subtle px-2 py-0.5 rounded-full">
                  Unverified
                </span>
              )}
            </div>
          ))}
          {devices.length === 0 && (
            <p className="text-sm text-text-3 text-center py-6 col-span-3">No devices registered</p>
          )}
        </div>
      </Card>
    </div>
  );
}
