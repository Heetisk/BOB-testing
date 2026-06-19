import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#34D399', '#FBBF24', '#F43F5E'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-1 border border-surface-3 rounded-xl px-3 py-2 shadow-lg">
      <p className="text-text-1 text-xs font-medium">{payload[0].name}</p>
      <p className="text-text-3 text-xs font-mono">{payload[0].value} logins</p>
    </div>
  );
};

export default function RiskDistributionChart({ data }) {
  if (!data?.labels?.length) {
    return <div className="text-text-3 text-sm text-center py-8">No data available</div>;
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
          innerRadius={60}
          outerRadius={90}
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
          formatter={(value) => <span className="text-text-3 text-xs">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
