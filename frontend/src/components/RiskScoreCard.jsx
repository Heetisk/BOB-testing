export default function RiskScoreCard({ score = 0, level, reasons = [] }) {
  const normalizedScore = Math.min(Math.max(score, 0), 100);

  const getLevel = (s) => {
    if (s <= 30) return 'Low';
    if (s <= 70) return 'Medium';
    return 'High';
  };

  const riskLevel = level || getLevel(normalizedScore);

  const colorMap = {
    Low: { stroke: '#34D399', text: 'text-success', bg: 'bg-success-subtle', ring: 'text-success' },
    Medium: { stroke: '#FBBF24', text: 'text-warning', bg: 'bg-warning-subtle', ring: 'text-warning' },
    High: { stroke: '#F43F5E', text: 'text-danger', bg: 'bg-danger-subtle', ring: 'text-danger' },
  };

  const colors = colorMap[riskLevel] || colorMap.Low;

  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div className="bg-surface-1 border border-surface-3/50 rounded-2xl p-6 transition-all duration-150 hover:border-surface-3">
      <div className="flex flex-col items-center">
        {/* Risk Ring */}
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120" role="img" aria-label={`Risk score: ${normalizedScore}, level ${riskLevel}`}>
            {/* Background ring */}
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-surface-3/30"
            />
            {/* Score ring */}
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke={colors.stroke}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-1000 ease-out"
              style={{ filter: `drop-shadow(0 0 6px ${colors.stroke}40)` }}
            />
          </svg>
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold font-display tabular-nums ${colors.text}`}>
              {normalizedScore}
            </span>
            <span className="text-[10px] font-medium text-text-3 uppercase tracking-wider mt-0.5">
              {riskLevel}
            </span>
          </div>
        </div>

        {/* Risk factors */}
        {reasons.length > 0 && (
          <div className="w-full mt-5 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-3/70">
              Risk Factors
            </p>
            <div className="space-y-1.5">
              {reasons.map((reason, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-text-2">
                  <span className={`w-1 h-1 rounded-full mt-2 shrink-0 ${colors.text === 'text-success' ? 'bg-success' : colors.text === 'text-warning' ? 'bg-warning' : 'bg-danger'}`} />
                  {reason}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
