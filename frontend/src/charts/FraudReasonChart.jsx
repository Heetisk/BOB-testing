import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#8B5CF6', '#F59E0B', '#3B82F6', '#10B981', '#EF4444'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-card border border-border rounded-lg px-3 py-2 text-sm">
      <p className="text-text-primary font-medium">{payload[0].payload.label}</p>
      <p className="text-text-secondary">{payload[0].value} alerts</p>
    </div>
  );
};

export default function FraudReasonChart({ data }) {
  if (!data?.labels?.length) {
    return <div className="text-text-muted text-center py-8">No data available</div>;
  }

  const chartData = data.labels.map((label, i) => ({
    label,
    value: data.values[i] || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
        <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fill: '#94A3B8', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={120}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(51,65,85,0.3)' }} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
          {chartData.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
