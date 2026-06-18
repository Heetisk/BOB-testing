import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-dark relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      <div className="text-center relative z-10">
        <div className="w-20 h-20 rounded-2xl bg-bg-card border border-border flex items-center justify-center mx-auto mb-6">
          <Shield size={40} className="text-text-muted" />
        </div>
        <h1 className="text-5xl font-bold text-text-primary mb-3">404</h1>
        <p className="text-text-secondary text-lg mb-8">Page not found</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-light text-bg-dark font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-primary/20"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
