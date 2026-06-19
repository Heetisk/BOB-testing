import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';
import { CITIES } from '../utils/constants';
import Input, { Select } from '../components/Input';
import Button from '../components/Button';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    usual_city: 'Surat',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData.name, formData.email, formData.password, formData.phone, formData.usual_city);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-surface-0">
      {/* Left panel — Brand */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-surface-0 via-surface-1 to-surface-0">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px]" />

        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12">
          <div className="relative w-48 h-48 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-accent/20 animate-pulse-ring" />
            <div className="absolute inset-4 rounded-full border-2 border-accent/30" style={{ animation: 'pulseRing 3s ease-in-out infinite 0.5s' }} />
            <div className="absolute inset-8 rounded-full border-2 border-accent/50" style={{ animation: 'pulseRing 3s ease-in-out infinite 1s' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
                <Shield size={28} className="text-accent" />
              </div>
            </div>
          </div>

          <h2 className="mt-10 text-3xl font-bold text-text-1 font-display tracking-tight text-center">
            Join AccountGuard AI
          </h2>
          <p className="mt-3 text-text-3 text-center max-w-sm leading-relaxed">
            Create your account and experience AI-powered fraud detection in real time.
          </p>

          <div className="flex items-center gap-6 mt-10">
            {['Instant Risk Analysis', 'Real-time Alerts', 'ML-Powered'].map((label) => (
              <div key={label} className="flex items-center gap-2 text-xs text-text-3/60">
                <CheckCircle size={12} className="text-success/60" aria-hidden="true" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — Register Form */}
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
            <h1 className="text-2xl font-bold text-text-1 font-display tracking-tight">Create your account</h1>
            <p className="text-sm text-text-3 mt-1.5">Get started with AccountGuard AI</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-danger-subtle border border-danger/20 text-danger text-sm px-4 py-3 rounded-xl" role="alert">
                {error}
              </div>
            )}

            <Input
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />

            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />

            <div className="relative">
              <Input
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password (min 6 characters)"
                required
                minLength={6}
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

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
              />
              <Select
                label="City"
                name="usual_city"
                value={formData.usual_city}
                onChange={handleChange}
                options={CITIES.map((c) => ({ value: c, label: c }))}
              />
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
              iconRight={!loading ? ArrowRight : undefined}
            >
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-text-3 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:text-accent-hover font-medium transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
