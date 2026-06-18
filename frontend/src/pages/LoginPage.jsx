import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Eye, EyeOff, ArrowRight } from 'lucide-react';

const CITIES = ['Surat', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Jaipur', 'Lucknow'];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('Surat');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const deviceInfo = {
        device_id: `device_web_${Date.now()}`,
        device_name: 'Web Browser',
        browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Firefox',
        os: navigator.platform,
        city: city,
        ip_address: `${Math.floor(Math.random() * 200) + 10}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      };

      await login(email, password, deviceInfo);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-dark p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-primary/20">
            <Shield size={32} className="text-bg-dark" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">
            AccountGuard <span className="text-primary">AI</span>
          </h1>
          <p className="text-text-secondary mt-2 text-base">Identity Trust Framework</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-bg-card border border-border rounded-2xl p-7 sm:p-8 space-y-5 shadow-2xl shadow-black/20">
          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-text-secondary text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-bg-dark border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-text-secondary text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-bg-dark border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all pr-12"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors cursor-pointer p-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-text-secondary text-sm font-medium mb-2">Login City</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-3 bg-bg-dark border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <p className="text-text-muted text-xs mt-1.5">Try a different city than your usual to trigger risk detection</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-primary to-primary-light hover:from-primary-light hover:to-primary text-bg-dark font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30"
          >
            {loading ? 'Signing in...' : 'Sign In'}
            {!loading && <ArrowRight size={18} />}
          </button>

          <div className="text-center text-text-muted text-sm mt-5 pt-5 border-t border-border">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-primary hover:text-primary-light font-medium transition-colors">
              Create Account
            </Link>
          </div>

          <div className="text-center text-text-muted text-xs mt-3">
            <p className="font-medium mb-2">Demo Accounts</p>
            <div className="space-y-1">
              <p>Customer: <span className="text-text-secondary">jyot@example.com</span> / <span className="text-text-secondary">password123</span></p>
              <p>Admin: <span className="text-text-secondary">admin@example.com</span> / <span className="text-text-secondary">admin123</span></p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
