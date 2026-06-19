import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-1 border border-surface-3 rounded-xl px-3 py-2 shadow-lg">
      <p className="text-text-1 text-xs font-medium">Hour {label}:00</p>
      <p className="text-text-3 text-xs font-mono">{payload[0].value} logins</p>
    </div>
  );
};

export default function LoginTrendChart({ data }) {
  if (!data?.labels?.length) {
    return <div className="text-text-3 text-sm text-center py-8">No data available</div>;
  }

  const chartData = data.labels.map((label, i) => ({
    hour: label,
    logins: data.values[i] || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="loginGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B7BF7" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#3B7BF7" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="hour"
          tick={{ fill: '#8B95B0', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}:00`}
        />
        <YAxis tick={{ fill: '#8B95B0', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="logins"
          stroke="#3B7BF7"
          strokeWidth={2}
          fill="url(#loginGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
