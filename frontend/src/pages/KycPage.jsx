import { useState, useEffect } from 'react';
import { FileCheck, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getKycStatus, submitKyc } from '../api/featuresApi';
import RiskBadge from '../components/RiskBadge';
import Card from '../components/Card';
import Button from '../components/Button';
import Input, { Select } from '../components/Input';
import EmptyState from '../components/EmptyState';
import { formatDate } from '../utils/helpers';
import Loader from '../components/Loader';

export default function KycPage() {
  const { user } = useAuth();
  const [kyc, setKyc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    document_type: 'Aadhaar',
    document_number: '',
    submission_city: '',
  });

  useEffect(() => {
    let cancelled = false;
    getKycStatus(user.user_id)
      .then((data) => { if (!cancelled) setKyc(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user.user_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await submitKyc({ user_id: user.user_id, ...formData, submission_ip: '192.168.1.100' });
      setShowForm(false);
      getKycStatus(user.user_id)
        .then((data) => setKyc(data))
        .catch(() => {});
    } catch { console.error('Failed to submit KYC'); }
  };

  if (loading) return <Loader text="Loading KYC status..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <FileCheck size={20} className="text-accent" aria-hidden="true" />
            <h1 className="text-2xl font-bold text-text-1 font-display tracking-tight">KYC Verification</h1>
          </div>
          <p className="text-sm text-text-3 ml-[32px]">Identity verification and fraud detection</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'primary'} icon={FileCheck} aria-expanded={showForm}>
          {showForm ? 'Cancel' : 'Submit KYC'}
        </Button>
      </div>

      {showForm && (
        <Card padding="lg" className="animate-slide-down">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-sm font-semibold text-text-1 font-display">Submit KYC Document</h3>
            <div className="grid grid-cols-3 gap-3">
              <Select
                label="Document Type"
                value={formData.document_type}
                onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                options={[
                  { value: 'Aadhaar', label: 'Aadhaar' },
                  { value: 'PAN', label: 'PAN Card' },
                  { value: 'Passport', label: 'Passport' },
                ]}
              />
              <Input label="Document Number" value={formData.document_number} onChange={(e) => setFormData({ ...formData, document_number: e.target.value })} required />
              <Input label="City" value={formData.submission_city} onChange={(e) => setFormData({ ...formData, submission_city: e.target.value })} placeholder="Surat" required />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="md">Submit</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {kyc ? (
        <Card padding="lg" className="animate-fade-in-up stagger-1">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Shield size={18} className="text-accent" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-1 font-display">KYC Status</h3>
              <p className="text-xs text-text-3">Document verification</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Document Type', value: kyc.document_type },
              { label: 'Status', value: <RiskBadge level={kyc.status} /> },
              { label: 'Risk Score', value: <span className="font-mono">{kyc.risk_score || 'N/A'}</span> },
              { label: 'Submitted', value: formatDate(kyc.created_at) },
            ].map((item) => (
              <div key={item.label} className="p-3 bg-surface-0 rounded-xl border border-surface-3/30 transition-colors hover:bg-surface-1/50">
                <p className="text-[10px] font-medium uppercase tracking-wider text-text-3/60 mb-1">{item.label}</p>
                <p className="text-sm font-medium text-text-1">{item.value}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <EmptyState icon={FileCheck} title="No KYC verification found" description="Submit your documents for verification" />
      )}
    </div>
  );
}
