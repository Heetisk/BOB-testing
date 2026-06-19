export default function RiskBadge({ level, size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };

  const dotSize = {
    sm: 'w-1.5 h-1.5',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2',
  };

  const colorMap = {
    low: 'bg-success',
    medium: 'bg-warning',
    high: 'bg-danger',
    critical: 'bg-danger',
  };

  const textColorMap = {
    low: 'text-success',
    medium: 'text-warning',
    high: 'text-danger',
    critical: 'text-danger',
  };

  const bgColorMap = {
    low: 'bg-success-subtle',
    medium: 'bg-warning-subtle',
    high: 'bg-danger-subtle',
    critical: 'bg-danger-subtle',
  };

  const key = level?.toLowerCase() || 'low';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]} ${bgColorMap[key] || bgColorMap.low} ${textColorMap[key] || textColorMap.low} ${className}`}>
      <span className={`rounded-full ${dotSize[size]} ${colorMap[key] || colorMap.low}`} />
      {level || 'Low'}
    </span>
  );
}
