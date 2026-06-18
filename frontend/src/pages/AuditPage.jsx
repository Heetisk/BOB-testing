import { useState, useEffect } from 'react';
import { ScrollText } from 'lucide-react';
import { getAuditLogs } from '../api/featuresApi';
import { formatDate } from '../utils/helpers';
import Loader from '../components/Loader';

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const data = await getAuditLogs();
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score) => {
    if (!score) return 'text-text-muted';
    if (score <= 30) return 'text-success';
    if (score <= 70) return 'text-warning';
    return 'text-danger';
  };

  if (loading) return <Loader text="Loading audit logs..." />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Audit Logs</h1>
        <p className="text-text-secondary text-sm sm:text-base mt-2">Privileged access monitoring</p>
      </div>

      <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-dark/50">
                <th className="text-left text-text-muted text-xs font-semibold uppercase tracking-wider px-6 py-4">ID</th>
                <th className="text-left text-text-muted text-xs font-semibold uppercase tracking-wider px-6 py-4">User</th>
                <th className="text-left text-text-muted text-xs font-semibold uppercase tracking-wider px-6 py-4">Action</th>
                <th className="text-left text-text-muted text-xs font-semibold uppercase tracking-wider px-6 py-4">Resource</th>
                <th className="text-left text-text-muted text-xs font-semibold uppercase tracking-wider px-6 py-4">Risk</th>
                <th className="text-left text-text-muted text-xs font-semibold uppercase tracking-wider px-6 py-4">IP</th>
                <th className="text-left text-text-muted text-xs font-semibold uppercase tracking-wider px-6 py-4">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr key={log.log_id} className={`border-b border-border/50 hover:bg-bg-card-hover/50 transition-colors ${idx % 2 === 0 ? 'bg-bg-dark/20' : ''}`}>
                  <td className="px-6 py-4 text-text-primary text-sm font-medium">#{log.log_id}</td>
                  <td className="px-6 py-4 text-text-secondary text-sm">#{log.user_id}</td>
                  <td className="px-6 py-4 text-text-primary text-sm font-medium">{log.action}</td>
                  <td className="px-6 py-4 text-text-secondary text-sm">{log.resource_type}</td>
                  <td className={`px-6 py-4 text-sm font-semibold ${getRiskColor(log.risk_score)}`}>
                    {log.risk_score || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-text-muted text-sm">{log.ip_address}</td>
                  <td className="px-6 py-4 text-text-muted text-sm">{formatDate(log.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {logs.length === 0 && (
          <div className="text-center py-16 text-text-muted">
            <ScrollText size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-base">No audit logs found</p>
          </div>
        )}
      </div>
    </div>
  );
}
