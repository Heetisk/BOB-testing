import { useState, useEffect } from 'react';
import { FileCheck, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getKycStatus, submitKyc } from '../api/featuresApi';
import RiskBadge from '../components/RiskBadge';
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
    fetchKyc();
  }, []);

  const fetchKyc = async () => {
    try {
      const data = await getKycStatus(user.user_id);
      setKyc(data);
    } catch (err) {
      // No KYC found
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await submitKyc({
        user_id: user.user_id,
        ...formData,
        submission_ip: '192.168.1.100',
      });
      setShowForm(false);
      fetchKyc();
    } catch (err) {
      console.error('Failed to submit KYC');
    }
  };

  if (loading) return <Loader text="Loading KYC status..." />;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">KYC Verification</h1>
          <p className="text-text-secondary text-sm sm:text-base mt-2">Identity verification and fraud detection</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-light hover:from-primary-light hover:to-primary text-bg-dark font-semibold rounded-xl transition-all duration-200 cursor-pointer shadow-lg shadow-primary/20"
        >
          <FileCheck size={18} />
          Submit KYC
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-bg-card border border-border rounded-2xl p-6 sm:p-7 space-y-5">
          <h3 className="text-text-primary font-semibold text-base">Submit KYC Document</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-text-secondary text-sm font-medium mb-2">Document Type</label>
              <select
                value={formData.document_type}
                onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                className="w-full px-4 py-2.5 bg-bg-dark border border-border rounded-xl text-text-primary text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
              >
                <option value="Aadhaar">Aadhaar</option>
                <option value="PAN">PAN Card</option>
                <option value="Passport">Passport</option>
              </select>
            </div>
            <div>
              <label className="block text-text-secondary text-sm font-medium mb-2">Document Number</label>
              <input
                value={formData.document_number}
                onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                className="w-full px-4 py-2.5 bg-bg-dark border border-border rounded-xl text-text-primary text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-text-secondary text-sm font-medium mb-2">City</label>
              <input
                value={formData.submission_city}
                onChange={(e) => setFormData({ ...formData, submission_city: e.target.value })}
                className="w-full px-4 py-2.5 bg-bg-dark border border-border rounded-xl text-text-primary text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                placeholder="Surat"
                required
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-light hover:from-primary-light hover:to-primary text-bg-dark font-semibold rounded-xl transition-all duration-200 cursor-pointer shadow-lg shadow-primary/20">
              Submit
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 bg-bg-dark hover:bg-bg-card-hover text-text-secondary rounded-xl transition-colors cursor-pointer border border-border">
              Cancel
            </button>
          </div>
        </form>
      )}

      {kyc ? (
        <div className="bg-bg-card border border-border rounded-2xl p-6 sm:p-7">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield size={24} className="text-primary" />
            </div>
            <div>
              <h3 className="text-text-primary font-semibold text-base">KYC Status</h3>
              <p className="text-text-secondary text-sm">Document verification</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-bg-dark/50 rounded-xl border border-border/50">
              <p className="text-text-muted text-xs font-medium uppercase tracking-wide mb-1">Document Type</p>
              <p className="text-text-primary font-medium">{kyc.document_type}</p>
            </div>
            <div className="p-4 bg-bg-dark/50 rounded-xl border border-border/50">
              <p className="text-text-muted text-xs font-medium uppercase tracking-wide mb-1">Status</p>
              <RiskBadge level={kyc.status} />
            </div>
            <div className="p-4 bg-bg-dark/50 rounded-xl border border-border/50">
              <p className="text-text-muted text-xs font-medium uppercase tracking-wide mb-1">Risk Score</p>
              <p className="text-text-primary font-medium">{kyc.risk_score || 'N/A'}</p>
            </div>
            <div className="p-4 bg-bg-dark/50 rounded-xl border border-border/50">
              <p className="text-text-muted text-xs font-medium uppercase tracking-wide mb-1">Submitted</p>
              <p className="text-text-primary font-medium">{formatDate(kyc.created_at)}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-bg-card border border-border rounded-2xl p-12 sm:p-16 text-center">
          <FileCheck size={48} className="text-text-muted mx-auto mb-4 opacity-50" />
          <p className="text-text-muted text-base">No KYC verification found</p>
          <p className="text-text-muted text-sm mt-1">Submit your documents for verification</p>
        </div>
      )}
    </div>
  );
}
