import { useState, useEffect } from 'react';
import { Lock, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import Card from '../components/Card';
import Loader from '../components/Loader';

export default function PrivacyPage() {
  const { user } = useAuth();
  const [consents, setConsents] = useState([]);
  const [maskedData, setMaskedData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiClient.get(`/privacy/consent/${user.user_id}`),
      apiClient.get(`/privacy/mask/${user.user_id}`),
    ])
      .then(([consentRes, maskedRes]) => {
        if (!cancelled) {
          setConsents(consentRes.data.consents || []);
          setMaskedData(maskedRes.data);
        }
      })
      .catch(() => console.error('Failed to fetch privacy data'))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user.user_id]);

  const recordConsent = async (type, granted) => {
    try {
      await apiClient.post('/privacy/consent', { consent_type: type, is_granted: granted });
      Promise.all([
        apiClient.get(`/privacy/consent/${user.user_id}`),
        apiClient.get(`/privacy/mask/${user.user_id}`),
      ])
        .then(([consentRes, maskedRes]) => {
          setConsents(consentRes.data.consents || []);
          setMaskedData(maskedRes.data);
        })
        .catch(() => {});
    } catch { console.error('Failed to record consent'); }
  };

  if (loading) return <Loader text="Loading privacy data..." />;

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <div className="flex items-center gap-3 mb-1">
          <Lock size={20} className="text-accent" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-text-1 font-display tracking-tight">Privacy & Data</h1>
        </div>
        <p className="text-sm text-text-3 ml-[32px]">Manage consent and data privacy</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card padding="lg" className="animate-fade-in-up stagger-1">
          <h3 className="text-sm font-semibold text-text-1 font-display mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Eye size={14} className="text-accent" />
            </div>
            Masked User Data
          </h3>
          {maskedData && (
            <div className="space-y-2">
              {[
                { label: 'Name', value: maskedData.name },
                { label: 'Email', value: maskedData.email },
                { label: 'Phone', value: maskedData.phone || 'N/A' },
                { label: 'Role', value: maskedData.role },
              ].map((item) => (
                <div key={item.label} className="flex justify-between p-3 bg-surface-0 rounded-xl border border-surface-3/30">
                  <span className="text-sm text-text-3">{item.label}</span>
                  <span className="text-sm font-medium text-text-1 font-mono">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card padding="lg" className="animate-fade-in-up stagger-2">
          <h3 className="text-sm font-semibold text-text-1 font-display mb-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Lock size={14} className="text-accent" />
            </div>
            Consent Management
          </h3>
          <div className="space-y-2">
            {['data_processing', 'marketing', 'third_party_sharing'].map((type) => {
              const consent = consents.find((c) => c.consent_type === type);
              return (
                <div key={type} className="flex items-center justify-between p-3 bg-surface-0 rounded-xl border border-surface-3/30">
                  <span className="text-sm text-text-2">
                    {type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                  <button
                    onClick={() => recordConsent(type, !consent?.is_granted)}
                    aria-label={consent?.is_granted ? `Revoke ${type.replace(/_/g, ' ')}` : `Grant ${type.replace(/_/g, ' ')}`}
                    className={`px-3 py-1 text-[10px] font-medium rounded-full transition-all duration-150 active:scale-95 ${
                      consent?.is_granted
                        ? 'text-success bg-success-subtle hover:bg-success/15'
                        : 'text-danger bg-danger-subtle hover:bg-danger/15'
                    }`}
                  >
                    {consent?.is_granted ? 'Granted' : 'Revoked'}
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
