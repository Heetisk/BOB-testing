import { useState, useEffect } from 'react';
import { ScrollText } from 'lucide-react';
import { getAuditLogs } from '../api/featuresApi';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import { formatDate } from '../utils/helpers';
import { getRiskTextColor } from '../utils/helpers';
import Loader from '../components/Loader';

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getAuditLogs()
      .then((data) => {
        if (!cancelled) {
          setLogs(data.logs || []);
          setError(null);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch audit logs:', err);
        if (!cancelled) {
          const status = err.response?.status;
          if (status === 401) return;
          if (status === 403) setError('Audit logs require admin or fraud team access.');
          else setError('Failed to load audit logs.');
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <Loader text="Loading audit logs..." />;

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <div className="flex items-center gap-3 mb-1">
          <ScrollText size={20} className="text-accent" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-text-1 font-display tracking-tight">Audit Logs</h1>
        </div>
        <p className="text-sm text-text-3 ml-[32px]">Privileged access monitoring</p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-danger-subtle border border-danger/20 text-danger text-sm animate-fade-in">
          {error}
        </div>
      )}

      <Card padding="none" className="animate-fade-in-up stagger-1">
        {logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-3/50">
                  {['ID', 'User', 'Action', 'Resource', 'Risk', 'IP', 'Time'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-text-3/70 bg-surface-0/50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.log_id} className="border-b border-surface-3/30 hover:bg-surface-2/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-text-2 font-mono">#{log.log_id}</td>
                    <td className="px-4 py-3 text-sm text-text-2 font-mono">#{log.user_id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-text-1">{log.action}</td>
                    <td className="px-4 py-3 text-sm text-text-2">{log.resource_type}</td>
                    <td className={`px-4 py-3 text-sm font-semibold font-mono ${getRiskTextColor(log.risk_score > 70 ? 'high' : log.risk_score > 30 ? 'medium' : 'low')}`}>
                      {log.risk_score || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-3 font-mono">{log.ip_address}</td>
                    <td className="px-4 py-3 text-xs text-text-3">{formatDate(log.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={ScrollText} title={error ? 'Access restricted' : 'No audit logs found'} description={error || 'Audit logs will appear here'} />
        )}
      </Card>
    </div>
  );
}
