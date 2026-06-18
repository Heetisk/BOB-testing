export default function Loader({ size = 'md', text = 'Loading...' }) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="relative">
        <div className={`${sizeClasses[size]} border-2 border-border border-t-primary rounded-full animate-spin`} />
        <div className={`absolute inset-0 ${sizeClasses[size]} border-2 border-transparent border-b-primary/30 rounded-full animate-spin`} style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
      </div>
      <p className="text-text-muted text-sm font-medium">{text}</p>
    </div>
  );
}
