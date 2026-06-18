import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-card border border-border rounded-lg px-3 py-2 text-sm">
      <p className="text-text-primary font-medium">Hour: {label}:00</p>
      <p className="text-text-secondary">{payload[0].value} logins</p>
    </div>
  );
};

export default function LoginTrendChart({ data }) {
  if (!data?.labels?.length) {
    return <div className="text-text-muted text-center py-8">No data available</div>;
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
            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="hour"
          tick={{ fill: '#94A3B8', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}:00`}
        />
        <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="logins"
          stroke="#8B5CF6"
          strokeWidth={2}
          fill="url(#loginGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
