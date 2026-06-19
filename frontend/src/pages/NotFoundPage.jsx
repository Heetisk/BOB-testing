import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-0">
      <div className="text-center animate-scale-in">
        <div className="w-16 h-16 rounded-2xl bg-surface-1 border border-surface-3/50 flex items-center justify-center mx-auto mb-5">
          <Shield size={32} className="text-text-3/40" aria-hidden="true" />
        </div>
        <h1 className="text-5xl font-bold text-text-1 font-display mb-2">404</h1>
        <p className="text-text-3 text-base mb-6">Page not found</p>
        <Link to="/dashboard">
          <Button size="lg">Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
