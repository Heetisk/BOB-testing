import { useState } from 'react';
import { Shield, Search } from 'lucide-react';
import { analyzeLoginRisk } from '../api/riskApi';
import { useAuth } from '../context/AuthContext';
import RiskScoreCard from '../components/RiskScoreCard';
import RiskBadge from '../components/RiskBadge';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import EmptyState from '../components/EmptyState';

export default function RiskAnalysisPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    device_id: '',
    device_name: '',
    browser: '',
    os: '',
    city: '',
    ip_address: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await analyzeLoginRisk({
        user_id: user.user_id,
        ...formData,
      });
      setResult(response);
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <div className="flex items-center gap-3 mb-1">
          <Shield size={20} className="text-accent" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-text-1 font-display tracking-tight">Risk Analysis</h1>
        </div>
        <p className="text-sm text-text-3 ml-[32px]">Analyze login risk with AI-powered detection</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card padding="lg" className="animate-fade-in-up stagger-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-sm font-semibold text-text-1 font-display flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Shield size={14} className="text-accent" aria-hidden="true" />
              </div>
              Login Parameters
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <Input label="Device ID" name="device_id" value={formData.device_id} onChange={handleChange} placeholder="device_001" required />
              <Input label="Device Name" name="device_name" value={formData.device_name} onChange={handleChange} placeholder="Android Pixel 7" required />
              <Input label="Browser" name="browser" value={formData.browser} onChange={handleChange} placeholder="Chrome" required />
              <Input label="OS" name="os" value={formData.os} onChange={handleChange} placeholder="Android" required />
              <Input label="City" name="city" value={formData.city} onChange={handleChange} placeholder="Surat" required />
              <Input label="IP Address" name="ip_address" value={formData.ip_address} onChange={handleChange} placeholder="192.168.1.100" required />
            </div>

            {error && (
              <div className="bg-danger-subtle border border-danger/20 text-danger text-sm px-4 py-3 rounded-xl" role="alert">
                {error}
              </div>
            )}

            <Button type="submit" fullWidth size="md" loading={loading} icon={Search}>
              Analyze Risk
            </Button>
          </form>
        </Card>

        <div className="space-y-4 animate-fade-in-up stagger-2">
          {result ? (
            <>
              <RiskScoreCard
                score={result.risk_score}
                level={result.risk_level}
                reasons={result.risk_reasons}
              />
              <Card padding="lg">
                <h3 className="text-sm font-semibold text-text-1 font-display mb-4">Analysis Details</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Risk Level', value: <RiskBadge level={result.risk_level} /> },
                    { label: 'New Device', value: <span className={`text-sm font-medium ${result.is_new_device ? 'text-warning' : 'text-success'}`}>{result.is_new_device ? 'Yes' : 'No'}</span> },
                    { label: 'New Location', value: <span className={`text-sm font-medium ${result.is_new_location ? 'text-warning' : 'text-success'}`}>{result.is_new_location ? 'Yes' : 'No'}</span> },
                    { label: 'Action', value: <span className="text-sm font-medium text-text-1">{result.recommended_action}</span> },
                    ...(result.ml_prediction ? [{ label: 'ML Model', value: <span className="text-sm font-medium text-text-1 font-mono">{(result.ml_prediction.fraud_probability * 100).toFixed(1)}%</span> }] : []),
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-surface-3/30 last:border-0">
                      <span className="text-sm text-text-3">{item.label}</span>
                      {item.value}
                    </div>
                  ))}
                </div>
              </Card>
            </>
          ) : (
            <EmptyState
              icon={Shield}
              title="Enter login details"
              description="Results will appear here after analysis"
            />
          )}
        </div>
      </div>
    </div>
  );
}
