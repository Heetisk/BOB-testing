import { useState, useEffect } from 'react';
import { Lock, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/apiClient';
import Loader from '../components/Loader';

export default function PrivacyPage() {
  const { user } = useAuth();
  const [consents, setConsents] = useState([]);
  const [maskedData, setMaskedData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [consentRes, maskedRes] = await Promise.all([
        apiClient.get(`/privacy/consent/${user.user_id}`),
        apiClient.get(`/privacy/mask/${user.user_id}`),
      ]);
      setConsents(consentRes.data.consents || []);
      setMaskedData(maskedRes.data);
    } catch (err) {
      console.error('Failed to fetch privacy data');
    } finally {
      setLoading(false);
    }
  };

  const recordConsent = async (type, granted) => {
    try {
      await apiClient.post('/privacy/consent', {
        consent_type: type,
        is_granted: granted,
      });
      fetchData();
    } catch (err) {
      console.error('Failed to record consent');
    }
  };

  if (loading) return <Loader text="Loading privacy data..." />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Privacy & Data Protection</h1>
        <p className="text-text-secondary text-sm sm:text-base mt-2">Manage consent and data privacy</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-bg-card border border-border rounded-2xl p-6 sm:p-7">
          <h3 className="text-text-primary font-semibold flex items-center gap-2.5 mb-5 text-base">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Eye size={18} className="text-primary" />
            </div>
            Masked User Data
          </h3>
          {maskedData && (
            <div className="space-y-3">
              <div className="flex justify-between p-4 bg-bg-dark/50 rounded-xl border border-border/50">
                <span className="text-text-secondary text-sm">Name</span>
                <span className="text-text-primary text-sm font-medium">{maskedData.name}</span>
              </div>
              <div className="flex justify-between p-4 bg-bg-dark/50 rounded-xl border border-border/50">
                <span className="text-text-secondary text-sm">Email</span>
                <span className="text-text-primary text-sm font-medium">{maskedData.email}</span>
              </div>
              <div className="flex justify-between p-4 bg-bg-dark/50 rounded-xl border border-border/50">
                <span className="text-text-secondary text-sm">Phone</span>
                <span className="text-text-primary text-sm font-medium">{maskedData.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between p-4 bg-bg-dark/50 rounded-xl border border-border/50">
                <span className="text-text-secondary text-sm">Role</span>
                <span className="text-text-primary text-sm font-medium">{maskedData.role}</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-bg-card border border-border rounded-2xl p-6 sm:p-7">
          <h3 className="text-text-primary font-semibold flex items-center gap-2.5 mb-5 text-base">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lock size={18} className="text-primary" />
            </div>
            Consent Management
          </h3>
          <div className="space-y-3">
            {['data_processing', 'marketing', 'third_party_sharing'].map((type) => {
              const consent = consents.find((c) => c.consent_type === type);
              return (
                <div key={type} className="flex items-center justify-between p-4 bg-bg-dark/50 rounded-xl border border-border/50">
                  <span className="text-text-secondary text-sm">
                    {type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                  <button
                    onClick={() => recordConsent(type, !consent?.is_granted)}
                    className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors cursor-pointer ${
                      consent?.is_granted
                        ? 'bg-success/10 text-success hover:bg-success/20'
                        : 'bg-danger/10 text-danger hover:bg-danger/20'
                    }`}
                  >
                    {consent?.is_granted ? 'Granted' : 'Revoked'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
