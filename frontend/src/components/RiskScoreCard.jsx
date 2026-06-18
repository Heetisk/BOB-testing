export default function RiskScoreCard({ score, level, reasons = [] }) {
  const getScoreColor = (score) => {
    if (score <= 30) return 'text-success';
    if (score <= 70) return 'text-warning';
    return 'text-danger';
  };

  const getProgressColor = (score) => {
    if (score <= 30) return 'bg-success';
    if (score <= 70) return 'bg-warning';
    return 'bg-danger';
  };

  const getLevelLabel = (score) => {
    if (score <= 30) return 'Low Risk';
    if (score <= 70) return 'Medium Risk';
    return 'High Risk';
  };

  return (
    <div className="bg-bg-card border border-border rounded-xl p-6 sm:p-7">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-text-muted text-xs font-medium uppercase tracking-wide">Risk Score</p>
          <p className={`text-3xl sm:text-4xl font-bold mt-1 tabular-nums ${getScoreColor(score)}`}>
            {score}
          </p>
          <p className="text-text-secondary text-sm mt-1">{getLevelLabel(score)}</p>
        </div>
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
          score <= 30 ? 'bg-success/10' : score <= 70 ? 'bg-warning/10' : 'bg-danger/10'
        }`}>
          <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</span>
        </div>
      </div>

      <div className="w-full h-2.5 bg-border/50 rounded-full overflow-hidden mb-5">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${getProgressColor(score)}`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>

      {reasons.length > 0 && (
        <div className="border-t border-border pt-4">
          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-3">
            Risk Factors
          </p>
          <ul className="space-y-2">
            {reasons.map((reason, index) => (
              <li key={index} className="text-text-secondary text-sm flex items-start gap-2.5">
                <span className="text-warning mt-0.5 shrink-0">&#9679;</span>
                <span className="leading-relaxed">{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
