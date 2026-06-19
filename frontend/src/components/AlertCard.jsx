import { formatRelativeTime } from '../utils/helpers';

export default function AlertCard({ alert, onDismiss }) {
  const levelMap = {
    high: { border: 'border-l-danger', icon: 'text-danger', iconBg: 'bg-danger/10' },
    critical: { border: 'border-l-danger', icon: 'text-danger', iconBg: 'bg-danger/10' },
    medium: { border: 'border-l-warning', icon: 'text-warning', iconBg: 'bg-warning/10' },
    low: { border: 'border-l-info', icon: 'text-info', iconBg: 'bg-info/10' },
  };

  const statusMap = {
    open: { label: 'Open', cls: 'text-warning bg-warning-subtle' },
    reviewing: { label: 'Reviewing', cls: 'text-info bg-info-subtle' },
    resolved: { label: 'Resolved', cls: 'text-success bg-success-subtle' },
    false_positive: { label: 'False Positive', cls: 'text-text-3 bg-surface-2' },
  };

  const key = alert.risk_level?.toLowerCase() || 'medium';
  const colors = levelMap[key] || levelMap.medium;
  const status = statusMap[alert.status] || statusMap.open;

  return (
    <div className={`flex items-start gap-3 p-4 bg-surface-1 border border-surface-3/30 border-l-[3px] ${colors.border} rounded-xl transition-colors hover:bg-surface-2/30`}>
      <div className={`w-8 h-8 rounded-lg ${colors.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={colors.icon}>
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-text-1">{alert.alert_type?.replace(/_/g, ' ')}</p>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.cls}`}>
            {status.label}
          </span>
        </div>
        <p className="text-sm text-text-3 mt-1 line-clamp-2">{alert.message}</p>
        {alert.created_at && (
          <p className="text-[10px] text-text-3/60 mt-1.5">{formatRelativeTime(alert.created_at)}</p>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={() => onDismiss(alert.alert_id)}
          aria-label="Dismiss alert"
          className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md cursor-pointer text-text-3 hover:text-danger hover:bg-danger-subtle transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
