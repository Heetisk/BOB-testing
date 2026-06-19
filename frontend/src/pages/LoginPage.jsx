import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';
import { CITIES } from '../utils/constants';
import Input, { Select } from '../components/Input';
import Button from '../components/Button';

function ShieldVisual() {
  return (
    <div className="relative w-48 h-48 mx-auto">
      {/* Outer ring - slow pulse */}
      <div className="absolute inset-0 rounded-full border-2 border-accent/20 animate-pulse-ring" />
      {/* Middle ring */}
      <div className="absolute inset-4 rounded-full border-2 border-accent/30" style={{ animation: 'pulseRing 3s ease-in-out infinite 0.5s' }} />
      {/* Inner ring */}
      <div className="absolute inset-8 rounded-full border-2 border-accent/50" style={{ animation: 'pulseRing 3s ease-in-out infinite 1s' }} />
      {/* Center shield */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
          <Shield size={28} className="text-accent" />
        </div>
      </div>
    </div>
  );
}

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
    <div className="min-h-screen flex bg-surface-0">
      {/* Left panel — Brand + Visualization */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-surface-0 via-surface-1 to-surface-0">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }} />

        {/* Gradient orb */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px]" />

        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12">
          <ShieldVisual />

          <h2 className="mt-10 text-3xl font-bold text-text-1 font-display tracking-tight text-center">
            Protect what matters
          </h2>
          <p className="mt-3 text-text-3 text-center max-w-sm leading-relaxed">
            Real-time fraud detection powered by machine learning and behavioral analysis.
          </p>

          {/* Trust signals */}
          <div className="flex items-center gap-6 mt-10">
            {['256-bit Encryption', 'SOC 2 Compliant', 'RBI Approved'].map((label) => (
              <div key={label} className="flex items-center gap-2 text-xs text-text-3/60">
                <CheckCircle size={12} className="text-success/60" aria-hidden="true" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <Shield size={20} className="text-white" aria-hidden="true" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-text-1 font-display">AccountGuard</span>
              <span className="text-sm font-semibold text-accent">AI</span>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-text-1 font-display tracking-tight">Welcome back</h1>
            <p className="text-sm text-text-3 mt-1.5">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-danger-subtle border border-danger/20 text-danger text-sm px-4 py-3 rounded-xl" role="alert">
                {error}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-[34px] text-text-3 hover:text-text-1 transition-colors p-1"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <Select
              label="Login City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              options={CITIES.map((c) => ({ value: c, label: c }))}
            />
            <p className="text-[11px] text-text-3/60 -mt-2">Try a different city than your usual to trigger risk detection</p>

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
              iconRight={!loading ? ArrowRight : undefined}
            >
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-text-3 mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-accent hover:text-accent-hover font-medium transition-colors">
              Create Account
            </Link>
          </p>

          {/* Demo accounts */}
          <div className="mt-8 p-4 bg-surface-1 border border-surface-3/50 rounded-xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-3/60 mb-2">Demo Accounts</p>
            <div className="space-y-1.5 text-xs text-text-3">
              <div className="flex justify-between">
                <span>Customer</span>
                <span className="font-mono text-text-2">user@example.com / password123</span>
              </div>
              <div className="flex justify-between">
                <span>Admin</span>
                <span className="font-mono text-text-2">admin@example.com / admin123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
