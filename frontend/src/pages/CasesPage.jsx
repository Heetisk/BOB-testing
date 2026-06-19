import { useState, useEffect } from 'react';
import { FolderOpen } from 'lucide-react';
import apiClient from '../api/apiClient';
import RiskBadge from '../components/RiskBadge';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import { formatDate } from '../utils/helpers';
import Loader from '../components/Loader';

export default function CasesPage() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchAndSet = () => {
      apiClient.get('/cases/')
        .then((data) => {
          if (!cancelled) {
            setCases(data.data.cases || []);
            setError(null);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch cases:', err);
          if (!cancelled) {
            const status = err.response?.status;
            if (status === 401) return;
            if (status === 403) setError('You do not have permission to view cases.');
            else setError('Failed to load cases.');
          }
        })
        .finally(() => { if (!cancelled) setLoading(false); });
    };

    fetchAndSet();
    const interval = setInterval(fetchAndSet, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'open': return 'text-warning bg-warning-subtle';
      case 'investigating': return 'text-info bg-info-subtle';
      case 'resolved': return 'text-success bg-success-subtle';
      default: return 'text-text-3 bg-surface-2';
    }
  };

  if (loading) return <Loader text="Loading cases..." />;

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <div className="flex items-center gap-3 mb-1">
          <FolderOpen size={20} className="text-accent" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-text-1 font-display tracking-tight">Fraud Cases</h1>
        </div>
        <p className="text-sm text-text-3 ml-[32px]">Manage and investigate fraud cases</p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-danger-subtle border border-danger/20 text-danger text-sm animate-fade-in">
          {error}
        </div>
      )}

      <Card padding="none" className="animate-fade-in-up stagger-1">
        {cases.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-3/50">
                  {['Case ID', 'User', 'Risk', 'Status', 'Notes', 'Created'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-text-3/70 bg-surface-0/50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.case_id} className="border-b border-surface-3/30 hover:bg-surface-2/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-text-2 font-mono">#{c.case_id}</td>
                    <td className="px-4 py-3 text-sm text-text-2 font-mono">#{c.user_id}</td>
                    <td className="px-4 py-3"><RiskBadge level={c.risk_score > 70 ? 'High' : 'Medium'} size="sm" /></td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusStyle(c.case_status)}`}>
                        {c.case_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-3 max-w-[200px] truncate">{c.admin_notes || 'N/A'}</td>
                    <td className="px-4 py-3 text-xs text-text-3">{formatDate(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={FolderOpen} title={error ? 'Unable to load cases' : 'No fraud cases found'} description={error || undefined} />
        )}
      </Card>
    </div>
  );
}
