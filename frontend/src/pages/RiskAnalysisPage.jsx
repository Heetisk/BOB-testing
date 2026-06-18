import { useState } from 'react';
import { Shield, Search, ChevronRight } from 'lucide-react';
import { analyzeLoginRisk } from '../api/riskApi';
import { useAuth } from '../context/AuthContext';
import RiskScoreCard from '../components/RiskScoreCard';
import RiskBadge from '../components/RiskBadge';
import Loader from '../components/Loader';

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
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Risk Analysis</h1>
        <p className="text-text-secondary text-sm sm:text-base mt-2">Analyze login risk with AI-powered detection</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit} className="bg-bg-card border border-border rounded-2xl p-6 sm:p-7 space-y-5">
          <h3 className="text-text-primary font-semibold flex items-center gap-2.5 text-base">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield size={18} className="text-primary" />
            </div>
            Login Risk Analysis
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-text-secondary text-sm font-medium mb-2">Device ID</label>
              <input
                name="device_id"
                value={formData.device_id}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-bg-dark border border-border rounded-xl text-text-primary text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                placeholder="device_001"
                required
              />
            </div>
            <div>
              <label className="block text-text-secondary text-sm font-medium mb-2">Device Name</label>
              <input
                name="device_name"
                value={formData.device_name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-bg-dark border border-border rounded-xl text-text-primary text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                placeholder="Android Pixel 7"
                required
              />
            </div>
            <div>
              <label className="block text-text-secondary text-sm font-medium mb-2">Browser</label>
              <input
                name="browser"
                value={formData.browser}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-bg-dark border border-border rounded-xl text-text-primary text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                placeholder="Chrome"
                required
              />
            </div>
            <div>
              <label className="block text-text-secondary text-sm font-medium mb-2">OS</label>
              <input
                name="os"
                value={formData.os}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-bg-dark border border-border rounded-xl text-text-primary text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                placeholder="Android"
                required
              />
            </div>
            <div>
              <label className="block text-text-secondary text-sm font-medium mb-2">City</label>
              <input
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-bg-dark border border-border rounded-xl text-text-primary text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                placeholder="Surat"
                required
              />
            </div>
            <div>
              <label className="block text-text-secondary text-sm font-medium mb-2">IP Address</label>
              <input
                name="ip_address"
                value={formData.ip_address}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-bg-dark border border-border rounded-xl text-text-primary text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                placeholder="192.168.1.100"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-primary to-primary-light hover:from-primary-light hover:to-primary text-bg-dark font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-primary/20 hover:shadow-primary/30"
          >
            <Search size={18} />
            {loading ? 'Analyzing...' : 'Analyze Risk'}
          </button>

          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}
        </form>

        <div className="space-y-5">
          {result && (
            <>
              <RiskScoreCard
                score={result.risk_score}
                level={result.risk_level}
                reasons={result.risk_reasons}
              />
              <div className="bg-bg-card border border-border rounded-2xl p-6 sm:p-7">
                <h3 className="text-text-primary font-semibold mb-5 text-base">Analysis Details</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-text-secondary text-sm">Risk Level</span>
                    <RiskBadge level={result.risk_level} />
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-text-secondary text-sm">New Device</span>
                    <span className={`text-sm font-medium ${result.is_new_device ? 'text-warning' : 'text-success'}`}>
                      {result.is_new_device ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-text-secondary text-sm">New Location</span>
                    <span className={`text-sm font-medium ${result.is_new_location ? 'text-warning' : 'text-success'}`}>
                      {result.is_new_location ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-text-secondary text-sm">Recommended Action</span>
                    <span className="text-text-primary text-sm font-medium flex items-center gap-1">
                      {result.recommended_action}
                      <ChevronRight size={14} className="text-text-muted" />
                    </span>
                  </div>
                  {result.ml_prediction && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-text-secondary text-sm">ML Model</span>
                      <span className="text-text-primary text-sm font-medium">
                        {(result.ml_prediction.fraud_probability * 100).toFixed(1)}% fraud probability
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {!result && !loading && (
            <div className="bg-bg-card border border-border rounded-2xl p-12 sm:p-16 text-center">
              <Shield size={48} className="text-text-muted mx-auto mb-4 opacity-50" />
              <p className="text-text-muted text-base">Enter login details to analyze risk</p>
              <p className="text-text-muted text-sm mt-1">Results will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
