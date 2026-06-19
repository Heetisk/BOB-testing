export default function Card({ children, variant = 'default', padding = 'md', hover = false, className = '', ...props }) {
  const baseClasses = 'rounded-2xl transition-all duration-150';

  const variantClasses = {
    default: 'bg-surface-1 border border-surface-3/50',
    elevated: 'bg-surface-1 border border-surface-3/50 shadow-card',
    interactive: 'bg-surface-1 border border-surface-3/50 hover:border-accent/30 hover:shadow-glow-accent cursor-pointer',
    flush: 'bg-surface-1',
    ghost: 'bg-transparent',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant] || variantClasses.default} ${paddingClasses[padding] || paddingClasses.md} ${hover ? 'hover:shadow-card-hover hover:border-surface-3' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
