export const API_BASE_URL = '/api/v1';

export const CITIES = [
  'Surat', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai',
  'Kolkata', 'Hyderabad', 'Pune', 'Jaipur', 'Lucknow',
];

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

export const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    ],
  },
  {
    label: 'Monitoring',
    items: [
      { path: '/risk-analysis', label: 'Risk Analysis', icon: 'Shield' },
      { path: '/transactions', label: 'Transactions', icon: 'ArrowLeftRight' },
      { path: '/alerts', label: 'Alerts', icon: 'Bell' },
      { path: '/cases', label: 'Cases', icon: 'FolderOpen' },
    ],
  },
  {
    label: 'Compliance',
    items: [
      { path: '/kyc', label: 'KYC', icon: 'FileCheck' },
      { path: '/audit', label: 'Audit', icon: 'ScrollText' },
      { path: '/verification', label: 'Verification', icon: 'KeyRound' },
      { path: '/privacy', label: 'Privacy', icon: 'Lock' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { path: '/simulation', label: 'Simulator', icon: 'Activity' },
    ],
  },
];

export const CUSTOMER_NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { path: '/dashboard', label: 'My Account', icon: 'LayoutDashboard' },
    ],
  },
  {
    label: 'Security',
    items: [
      { path: '/risk-analysis', label: 'Risk Analysis', icon: 'Shield' },
      { path: '/transactions', label: 'Transactions', icon: 'ArrowLeftRight' },
      { path: '/alerts', label: 'Alerts', icon: 'Bell' },
    ],
  },
  {
    label: 'Verification',
    items: [
      { path: '/kyc', label: 'KYC', icon: 'FileCheck' },
      { path: '/verification', label: 'Verification', icon: 'KeyRound' },
      { path: '/privacy', label: 'Privacy', icon: 'Lock' },
    ],
  },
];
