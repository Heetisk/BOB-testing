import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-card border border-border rounded-lg px-3 py-2 text-sm">
      <p className="text-text-primary font-medium">{payload[0].name}</p>
      <p className="text-text-secondary">{payload[0].value} logins</p>
    </div>
  );
};

export default function RiskDistributionChart({ data }) {
  if (!data?.labels?.length) {
    return <div className="text-text-muted text-center py-8">No data available</div>;
  }

  const chartData = data.labels.map((label, i) => ({
    name: label,
    value: data.values[i] || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
          stroke="none"
        >
          {chartData.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value) => <span className="text-text-secondary text-xs">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
