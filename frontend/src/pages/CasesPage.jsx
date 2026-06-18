import { useState, useEffect } from 'react';
import { FolderOpen } from 'lucide-react';
import apiClient from '../api/apiClient';
import RiskBadge from '../components/RiskBadge';
import { formatDate } from '../utils/helpers';
import Loader from '../components/Loader';

export default function CasesPage() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const data = await apiClient.get('/cases/');
      setCases(data.data.cases || []);
    } catch (err) {
      console.error('Failed to fetch cases');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-warning/10 text-warning';
      case 'investigating': return 'bg-info/10 text-info';
      case 'resolved': return 'bg-success/10 text-success';
      default: return 'bg-text-muted/10 text-text-muted';
    }
  };

  if (loading) return <Loader text="Loading cases..." />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Fraud Cases</h1>
        <p className="text-text-secondary text-sm sm:text-base mt-2">Manage and investigate fraud cases</p>
      </div>

      <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border bg-bg-dark/50">
                <th className="text-left text-text-muted text-xs font-semibold uppercase tracking-wider px-6 py-4">Case ID</th>
                <th className="text-left text-text-muted text-xs font-semibold uppercase tracking-wider px-6 py-4">User ID</th>
                <th className="text-left text-text-muted text-xs font-semibold uppercase tracking-wider px-6 py-4">Risk Score</th>
                <th className="text-left text-text-muted text-xs font-semibold uppercase tracking-wider px-6 py-4">Status</th>
                <th className="text-left text-text-muted text-xs font-semibold uppercase tracking-wider px-6 py-4">Notes</th>
                <th className="text-left text-text-muted text-xs font-semibold uppercase tracking-wider px-6 py-4">Created</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c, idx) => (
                <tr key={c.case_id} className={`border-b border-border/50 hover:bg-bg-card-hover/50 transition-colors ${idx % 2 === 0 ? 'bg-bg-dark/20' : ''}`}>
                  <td className="px-6 py-4 text-text-primary text-sm font-medium">#{c.case_id}</td>
                  <td className="px-6 py-4 text-text-secondary text-sm">#{c.user_id}</td>
                  <td className="px-6 py-4"><RiskBadge level={c.risk_score > 70 ? 'High' : 'Medium'} size="sm" /></td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(c.case_status)}`}>
                      {c.case_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-text-muted text-sm max-w-xs truncate">{c.admin_notes || 'N/A'}</td>
                  <td className="px-6 py-4 text-text-muted text-sm">{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {cases.length === 0 && (
          <div className="text-center py-16 text-text-muted">
            <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-base">No fraud cases found</p>
          </div>
        )}
      </div>
    </div>
  );
}
