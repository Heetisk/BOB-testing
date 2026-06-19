import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { getAlerts } from '../api/alertApi';
import AlertCard from '../components/AlertCard';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;

    const fetchAndSet = () => {
      getAlerts()
        .then((data) => {
          if (!cancelled) setAlerts(data.alerts || []);
        })
        .catch(() => console.error('Failed to fetch alerts'))
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    fetchAndSet();
    const interval = setInterval(fetchAndSet, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'all') return true;
    return alert.status === filter;
  });

  if (loading) return <Loader text="Loading alerts..." />;

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <div className="flex items-center gap-3 mb-1">
          <Bell size={20} className="text-accent" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-text-1 font-display tracking-tight">Alerts</h1>
        </div>
        <p className="text-sm text-text-3 ml-[32px]">Monitor suspicious activity alerts</p>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-1.5 animate-fade-in-up stagger-1">
        {['all', 'open', 'reviewing', 'resolved'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 ${
              filter === f
                ? 'bg-accent text-white shadow-sm'
                : 'bg-surface-1 text-text-3 hover:text-text-2 border border-surface-3/50 hover:border-surface-3'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-2 animate-fade-in-up stagger-2">
        {filteredAlerts.map((alert) => (
          <AlertCard key={alert.alert_id} alert={alert} />
        ))}
        {filteredAlerts.length === 0 && (
          <EmptyState icon={Bell} title="No alerts found" description="All clear for now" />
        )}
      </div>
    </div>
  );
}
