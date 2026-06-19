export default function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center animate-fade-in ${className}`}>
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center mb-4">
          <Icon size={24} className="text-text-3/40" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-base font-semibold text-text-1 font-display mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-text-3 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
