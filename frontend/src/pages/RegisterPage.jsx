import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Eye, EyeOff, ArrowRight } from 'lucide-react';

const CITIES = ['Surat', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Jaipur', 'Lucknow'];

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
          <p className="text-text-secondary mt-2 text-base">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-bg-card border border-border rounded-xl p-7 sm:p-8 space-y-5 shadow-2xl shadow-black/20">
          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-text-secondary text-sm font-medium mb-2">Full Name</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-bg-dark border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label className="block text-text-secondary text-sm font-medium mb-2">Email</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-bg-dark border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-text-secondary text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-bg-dark border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all pr-12"
                placeholder="Create a password"
                required
                minLength={6}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-text-secondary text-sm font-medium mb-2">Phone (optional)</label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-bg-dark border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                placeholder="+91 98765 43210"
              />
            </div>
            <div>
              <label className="block text-text-secondary text-sm font-medium mb-2">Usual City</label>
              <select
                name="usual_city"
                value={formData.usual_city}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-bg-dark border border-border rounded-xl text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
              >
                {CITIES.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-primary to-primary-light hover:from-primary-light hover:to-primary text-bg-dark font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30"
          >
            {loading ? 'Creating account...' : 'Create Account'}
            {!loading && <ArrowRight size={18} />}
          </button>

          <div className="text-center text-text-muted text-sm mt-5 pt-5 border-t border-border">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:text-primary-light font-medium transition-colors">
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
