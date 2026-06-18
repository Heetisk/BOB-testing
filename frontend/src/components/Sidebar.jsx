import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Shield, ArrowLeftRight, Bell, FolderOpen,
  FileCheck, ScrollText, KeyRound, Lock, Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NAV_ITEMS, CUSTOMER_NAV_ITEMS } from '../utils/constants';

const iconMap = {
  LayoutDashboard, Shield, ArrowLeftRight, Bell, FolderOpen,
  FileCheck, ScrollText, KeyRound, Lock, Activity,
};

export default function Sidebar() {
  const { user } = useAuth();
  const items = (user?.role === 'admin' || user?.role === 'fraud_team')
    ? NAV_ITEMS
    : CUSTOMER_NAV_ITEMS;

  return (
    <aside className="w-64 shrink-0 bg-bg-dark border-r border-border overflow-y-auto h-[calc(100vh-4rem)] sticky top-16 hidden md:block">
      <nav className="p-3 space-y-1">
        {items.map((item) => {
          const Icon = iconMap[item.icon];
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm shadow-primary/5'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-card border border-transparent'
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
