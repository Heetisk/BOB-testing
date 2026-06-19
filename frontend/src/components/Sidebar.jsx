import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Shield, ArrowLeftRight, Bell, FolderOpen,
  FileCheck, ScrollText, KeyRound, Lock, Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NAV_SECTIONS, CUSTOMER_NAV_SECTIONS } from '../utils/constants';

const iconMap = {
  LayoutDashboard, Shield, ArrowLeftRight, Bell, FolderOpen,
  FileCheck, ScrollText, KeyRound, Lock, Activity,
};

export default function Sidebar({ mobileOpen, onClose }) {
  const { user } = useAuth();
  const sections = (user?.role === 'admin' || user?.role === 'fraud_team')
    ? NAV_SECTIONS
    : CUSTOMER_NAV_SECTIONS;

  useEffect(() => {
    if (!mobileOpen) return;
    const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileOpen, onClose]);

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={onClose}
          onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
          role="button"
          tabIndex={-1}
          aria-label="Close navigation menu"
        />
      )}

      {/* Sidebar — fixed overlay on mobile, in-flow flex child on desktop */}
      <aside
        className={`
          fixed top-0 left-0 z-50 w-[260px] h-screen bg-surface-0 border-r border-surface-3/50
          md:static md:z-auto md:h-auto
          flex flex-col overflow-hidden
          transition-transform duration-200 ease-out
          md:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        aria-label="Main navigation"
      >
        {/* Brand */}
        <div className="h-14 flex items-center gap-2.5 px-5 border-b border-surface-3/50 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <Shield size={16} className="text-white" aria-hidden="true" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold text-text-1 font-display tracking-tight">AccountGuard</span>
            <span className="text-xs font-semibold text-accent">AI</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {sections.map((section, sIdx) => (
            <div key={section.label} className={sIdx > 0 ? 'mt-6' : ''}>
              <h3 className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-text-3/60">
                {section.label}
              </h3>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = iconMap[item.icon];
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                          isActive
                            ? 'bg-accent-subtle text-accent border-l-2 border-accent ml-0 pl-[10px]'
                            : 'text-text-3 hover:text-text-2 hover:bg-surface-2 border-l-2 border-transparent ml-0 pl-[10px]'
                        }`
                      }
                    >
                      {Icon && <Icon size={17} className="shrink-0" aria-hidden="true" />}
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User card at bottom */}
        <div className="p-3 border-t border-surface-3/50 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-1">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-accent font-display">
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-1 truncate">{user?.name}</p>
              <p className="text-xs text-text-3 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
