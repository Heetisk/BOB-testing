import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#3B7BF7', '#FBBF24', '#38BDF8', '#34D399', '#F43F5E'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-1 border border-surface-3 rounded-xl px-3 py-2 shadow-lg">
      <p className="text-text-1 text-xs font-medium">{payload[0].payload.label}</p>
      <p className="text-text-3 text-xs font-mono">{payload[0].value} alerts</p>
    </div>
  );
};

export default function FraudReasonChart({ data }) {
  if (!data?.labels?.length) {
    return <div className="text-text-3 text-sm text-center py-8">No data available</div>;
  }

  const chartData = data.labels.map((label, i) => ({
    label,
    value: data.values[i] || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
        <XAxis type="number" tick={{ fill: '#8B95B0', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="label"
          tick={{ fill: '#8B95B0', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={120}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(42, 53, 80, 0.5)' }} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
          {chartData.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
