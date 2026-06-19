export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatRelativeTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getRiskColor = (level) => {
  switch (level?.toLowerCase()) {
    case 'low':
      return 'text-success bg-success-subtle border-success/20';
    case 'medium':
      return 'text-warning bg-warning-subtle border-warning/20';
    case 'high':
    case 'critical':
      return 'text-danger bg-danger-subtle border-danger/20';
    default:
      return 'text-text-3 bg-surface-2 border-surface-3';
  }
};

export const getRiskTextColor = (level) => {
  switch (level?.toLowerCase()) {
    case 'low': return 'text-success';
    case 'medium': return 'text-warning';
    case 'high':
    case 'critical': return 'text-danger';
    default: return 'text-text-3';
  }
};

export const getRiskBgColor = (level) => {
  switch (level?.toLowerCase()) {
    case 'low': return 'bg-success';
    case 'medium': return 'bg-warning';
    case 'high':
    case 'critical': return 'bg-danger';
    default: return 'bg-text-3';
  }
};

export const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'open':
    case 'pending':
      return 'text-warning bg-warning-subtle';
    case 'reviewing':
    case 'investigating':
      return 'text-info bg-info-subtle';
    case 'resolved':
    case 'approved':
      return 'text-success bg-success-subtle';
    case 'false_positive':
      return 'text-text-3 bg-surface-2';
    case 'rejected':
    case 'suspicious':
      return 'text-danger bg-danger-subtle';
    default:
      return 'text-text-3 bg-surface-2';
  }
};
