import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, ChevronDown, Shield } from 'lucide-react';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/risk-analysis': 'Risk Analysis',
  '/transactions': 'Transactions',
  '/alerts': 'Alerts',
  '/cases': 'Cases',
  '/kyc': 'KYC Verification',
  '/audit': 'Audit Log',
  '/verification': 'Verification',
  '/privacy': 'Privacy',
  '/simulation': 'Simulator',
};

export default function TopBar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const pageTitle = PAGE_TITLES[location.pathname] || 'AccountGuard';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 h-14 bg-surface-1/80 backdrop-blur-xl border-b border-surface-3/50">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left: Mobile menu + page title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            aria-label="Toggle navigation menu"
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl text-text-3 hover:text-text-1 hover:bg-surface-2 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <h1 className="text-base font-semibold text-text-1 font-display tracking-tight">
            {pageTitle}
          </h1>
        </div>

        {/* Right: User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="User menu"
            aria-expanded={menuOpen}
            aria-haspopup="true"
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-surface-2 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Shield size={14} className="text-accent" aria-hidden="true" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-text-1 leading-tight">{user?.name}</p>
              <p className="text-xs text-text-3 leading-tight capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
            <ChevronDown size={14} className={`text-text-3 transition-transform duration-150 ${menuOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-surface-1 border border-surface-3 rounded-xl shadow-lg py-1 animate-slide-down">
              <div className="px-3 py-2 border-b border-surface-3">
                <p className="text-xs text-text-3">Signed in as</p>
                <p className="text-sm text-text-1 font-medium truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { setMenuOpen(false); logout(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-danger hover:bg-danger-subtle transition-colors"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
