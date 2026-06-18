import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

export default function AlertCard({ alert, onDismiss }) {
  const getAlertStyles = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'critical':
        return {
          bg: 'bg-danger/5',
          border: 'border-danger/30',
          iconBg: 'bg-danger/10',
          icon: <XCircle className="text-danger" size={18} />,
        };
      case 'high':
        return {
          bg: 'bg-danger/5',
          border: 'border-danger/30',
          iconBg: 'bg-danger/10',
          icon: <AlertTriangle className="text-danger" size={18} />,
        };
      case 'medium':
        return {
          bg: 'bg-warning/5',
          border: 'border-warning/30',
          iconBg: 'bg-warning/10',
          icon: <AlertTriangle className="text-warning" size={18} />,
        };
      default:
        return {
          bg: 'bg-info/5',
          border: 'border-info/30',
          iconBg: 'bg-info/10',
          icon: <Info className="text-info" size={18} />,
        };
    }
  };

  const styles = getAlertStyles(alert.risk_level);

  return (
    <div className={`${styles.bg} border ${styles.border} rounded-xl p-4 sm:p-5 flex items-start gap-4 hover:shadow-md hover:shadow-black/10 transition-shadow duration-200`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${styles.iconBg}`}>
        {styles.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 mb-1.5">
          <span className="font-semibold text-text-primary text-sm">
            {alert.alert_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </span>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
            alert.status === 'open' ? 'bg-warning/15 text-warning' :
            alert.status === 'resolved' ? 'bg-success/15 text-success' :
            'bg-text-muted/15 text-text-muted'
          }`}>
            {alert.status}
          </span>
        </div>
        <p className="text-text-secondary text-sm leading-relaxed">{alert.message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={() => onDismiss(alert.alert_id)}
          className="text-text-muted hover:text-danger p-1 rounded-lg hover:bg-danger/10 transition-colors cursor-pointer shrink-0"
        >
          <XCircle size={16} />
        </button>
      )}
    </div>
  );
}
