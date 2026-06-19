export default function StatCard({ title, value, icon: Icon, color = 'accent', trend, className = '' }) {
  const colorMap = {
    accent: { bg: 'bg-accent/8', icon: 'text-accent', border: 'border-accent/10' },
    success: { bg: 'bg-success/8', icon: 'text-success', border: 'border-success/10' },
    warning: { bg: 'bg-warning/8', icon: 'text-warning', border: 'border-warning/10' },
    danger: { bg: 'bg-danger/8', icon: 'text-danger', border: 'border-danger/10' },
    info: { bg: 'bg-info/8', icon: 'text-info', border: 'border-info/10' },
  };

  const c = colorMap[color] || colorMap.accent;

  return (
    <div className={`bg-surface-1 border border-surface-3/50 rounded-2xl p-5 transition-all duration-150 hover:border-surface-3 hover:shadow-card-hover cursor-default ${className}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-3/70">
            {title}
          </p>
          <p className="text-2xl font-bold text-text-1 font-display tabular-nums">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
            <Icon size={18} className={c.icon} aria-hidden="true" />
          </div>
        )}
      </div>
      {trend !== undefined && trend !== null && (
        <div className="mt-3 flex items-center gap-1">
          <span className={`text-xs font-medium ${trend >= 0 ? 'text-success' : 'text-danger'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
          <span className="text-[10px] text-text-3/60">vs last period</span>
        </div>
      )}
    </div>
  );
}
