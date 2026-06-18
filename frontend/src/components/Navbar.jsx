import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Shield } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-bg-dark/95 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between h-16 px-5 sm:px-6 lg:px-8">
        <Link to="/dashboard" className="flex items-center gap-3 cursor-pointer group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-shadow duration-200">
            <Shield size={18} className="text-bg-dark" />
          </div>
          <span className="text-text-primary font-bold text-lg hidden sm:block tracking-tight">
            AccountGuard
          </span>
          <span className="text-primary font-bold text-lg hidden sm:block">AI</span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-bg-card border border-border">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <User size={16} className="text-primary" />
            </div>
            <div className="hidden sm:block">
              <p className="text-text-primary text-sm font-medium leading-tight">{user?.name}</p>
              <p className="text-text-muted text-xs leading-tight">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 text-text-secondary hover:text-danger hover:bg-danger/10 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut size={16} />
            <span className="hidden sm:block text-sm">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
