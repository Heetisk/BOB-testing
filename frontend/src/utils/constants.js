export const API_BASE_URL = '/api/v1';

export const RISK_LEVELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

export const ALERT_STATUSES = {
  OPEN: 'open',
  REVIEWING: 'reviewing',
  RESOLVED: 'resolved',
  FALSE_POSITIVE: 'false_positive',
};

export const KYC_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SUSPICIOUS: 'suspicious',
};

export const CASE_STATUSES = {
  OPEN: 'open',
  INVESTIGATING: 'investigating',
  RESOLVED: 'resolved',
  FALSE_POSITIVE: 'false_positive',
};

export const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/risk-analysis', label: 'Risk Analysis', icon: 'Shield' },
  { path: '/transactions', label: 'Transactions', icon: 'ArrowLeftRight' },
  { path: '/alerts', label: 'Alerts', icon: 'Bell' },
  { path: '/cases', label: 'Cases', icon: 'FolderOpen' },
  { path: '/kyc', label: 'KYC', icon: 'FileCheck' },
  { path: '/audit', label: 'Audit', icon: 'ScrollText' },
  { path: '/verification', label: 'Verification', icon: 'KeyRound' },
  { path: '/privacy', label: 'Privacy', icon: 'Lock' },
  { path: '/simulation', label: 'Simulator', icon: 'Activity' },
];

export const CUSTOMER_NAV_ITEMS = [
  { path: '/dashboard', label: 'My Account', icon: 'LayoutDashboard' },
  { path: '/risk-analysis', label: 'Risk Analysis', icon: 'Shield' },
  { path: '/transactions', label: 'Transactions', icon: 'ArrowLeftRight' },
  { path: '/alerts', label: 'Alerts', icon: 'Bell' },
  { path: '/kyc', label: 'KYC', icon: 'FileCheck' },
  { path: '/verification', label: 'Verification', icon: 'KeyRound' },
  { path: '/privacy', label: 'Privacy', icon: 'Lock' },
];
