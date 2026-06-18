import { getRiskColor } from '../utils/helpers';

export default function RiskBadge({ level, size = 'md' }) {
  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${getRiskColor(level)} ${sizeClasses[size]}`}
    >
      {level}
    </span>
  );
}
