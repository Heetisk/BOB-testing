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
      return 'text-success bg-success/10 border-success/20';
    case 'medium':
      return 'text-warning bg-warning/10 border-warning/20';
    case 'high':
    case 'critical':
      return 'text-danger bg-danger/10 border-danger/20';
    default:
      return 'text-text-secondary bg-bg-card border-border';
  }
};

export const getRiskBgColor = (level) => {
  switch (level?.toLowerCase()) {
    case 'low':
      return 'bg-success';
    case 'medium':
      return 'bg-warning';
    case 'high':
    case 'critical':
      return 'bg-danger';
    default:
      return 'bg-text-muted';
  }
};
