export default function StatCard({ title, value, icon: Icon, color = 'primary', trend }) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-danger/10 text-danger',
    info: 'bg-info/10 text-info',
  };

  const iconBgClasses = {
    primary: 'bg-primary/15',
    success: 'bg-success/15',
    warning: 'bg-warning/15',
    danger: 'bg-danger/15',
    info: 'bg-info/15',
  };

  return (
    <div className="group bg-bg-card border border-border rounded-xl p-5 sm:p-6 hover:border-border-light hover:shadow-lg hover:shadow-black/20 transition-all duration-200 cursor-default">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-text-muted text-xs sm:text-sm font-medium uppercase tracking-wide">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-text-primary mt-2 tabular-nums">{value}</p>
          {trend !== undefined && trend !== null && (
            <p className={`text-xs mt-2 font-medium ${trend >= 0 ? 'text-success' : 'text-danger'}`}>
              {trend >= 0 ? '+' : ''}{trend}% from last month
            </p>
          )}
        </div>
        <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBgClasses[color]} group-hover:scale-105 transition-transform duration-200`}>
          <Icon size={22} className={colorClasses[color].split(' ')[1]} />
        </div>
      </div>
    </div>
  );
}
