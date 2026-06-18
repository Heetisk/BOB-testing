import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { getAlerts } from '../api/alertApi';
import AlertCard from '../components/AlertCard';
import Loader from '../components/Loader';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const data = await getAlerts();
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error('Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'all') return true;
    return alert.status === filter;
  });

  if (loading) return <Loader text="Loading alerts..." />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Alerts</h1>
        <p className="text-text-secondary text-sm sm:text-base mt-2">Monitor suspicious activity alerts</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {['all', 'open', 'reviewing', 'resolved'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-150 cursor-pointer ${
              filter === f
                ? 'bg-primary text-bg-dark shadow-lg shadow-primary/20'
                : 'bg-bg-card text-text-secondary hover:text-text-primary border border-border hover:border-border-light'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredAlerts.map((alert) => (
          <AlertCard key={alert.alert_id} alert={alert} />
        ))}
        {filteredAlerts.length === 0 && (
          <div className="bg-bg-card border border-border rounded-2xl p-12 sm:p-16 text-center">
            <Bell size={48} className="mx-auto mb-4 text-text-muted opacity-50" />
            <p className="text-text-muted text-base">No alerts found</p>
            <p className="text-text-muted text-sm mt-1">All clear for now</p>
          </div>
        )}
      </div>
    </div>
  );
}
