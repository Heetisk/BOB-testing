export default function Loader({ size = 'md', text = 'Loading...' }) {
  const sizeMap = {
    sm: { ring: 'w-5 h-5', border: 'border-2' },
    md: { ring: 'w-8 h-8', border: 'border-[2.5px]' },
    lg: { ring: 'w-12 h-12', border: 'border-[3px]' },
  };

  const s = sizeMap[size] || sizeMap.md;

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12" role="status" aria-live="polite">
      <div className={`${s.ring} relative`}>
        <div className={`absolute inset-0 ${s.border} border-surface-3 rounded-full`} />
        <div className={`absolute inset-0 ${s.border} border-accent border-t-transparent rounded-full animate-spin`} />
      </div>
      {text && (
        <p className="text-xs text-text-3 font-medium">{text}</p>
      )}
    </div>
  );
}
