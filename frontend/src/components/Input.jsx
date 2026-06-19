export default function Input({
  label,
  icon: Icon,
  error,
  className = '',
  containerClassName = '',
  ...props
}) {
  const inputId = props.id || props.name || (label ? label.toLowerCase().replace(/\s/g, '-') : undefined);

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-text-3 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Icon size={15} className="text-text-3/60" aria-hidden="true" />
          </div>
        )}
        <input
          id={inputId}
          className={`
            w-full h-10 px-4 text-sm text-text-1 font-body
            bg-surface-0 border rounded-xl
            placeholder:text-text-3/50
            focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-150
            ${Icon ? 'pl-10' : ''}
            ${error ? 'border-danger focus:border-danger focus:ring-danger/10' : 'border-surface-3 hover:border-surface-3'}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}
    </div>
  );
}

export function Select({
  label,
  icon: Icon,
  error,
  options = [],
  className = '',
  containerClassName = '',
  ...props
}) {
  const selectId = props.id || props.name || (label ? label.toLowerCase().replace(/\s/g, '-') : undefined);

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label htmlFor={selectId} className="block text-xs font-medium text-text-3 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Icon size={15} className="text-text-3/60" aria-hidden="true" />
          </div>
        )}
        <select
          id={selectId}
          className={`
            w-full h-10 px-4 text-sm text-text-1 font-body
            bg-surface-0 border rounded-xl appearance-none
            focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-150
            ${Icon ? 'pl-10' : ''}
            ${error ? 'border-danger focus:border-danger focus:ring-danger/10' : 'border-surface-3 hover:border-surface-3'}
            ${className}
          `}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-3" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>
      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}
    </div>
  );
}

export function Textarea({
  label,
  error,
  className = '',
  containerClassName = '',
  ...props
}) {
  const textareaId = props.id || props.name || (label ? label.toLowerCase().replace(/\s/g, '-') : undefined);

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label htmlFor={textareaId} className="block text-xs font-medium text-text-3 uppercase tracking-wider">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`
          w-full px-4 py-3 text-sm text-text-1 font-body
          bg-surface-0 border rounded-xl resize-none
          placeholder:text-text-3/50
          focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-150
          ${error ? 'border-danger focus:border-danger focus:ring-danger/10' : 'border-surface-3 hover:border-surface-3'}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}
    </div>
  );
}
