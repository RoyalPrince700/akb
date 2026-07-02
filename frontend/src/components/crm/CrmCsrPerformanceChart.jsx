import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import CrmChartCard from "./CrmChartCard";

const chartTooltipStyle = {
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
};

const CrmCsrPerformanceChart = ({ title, description, data, emptyMessage }) => {
  const isEmpty =
    !data?.length || !data.some((item) => item.resolved > 0 || item.unresolved > 0);

  return (
    <CrmChartCard title={title} description={description} empty={isEmpty} emptyMessage={emptyMessage}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
          <XAxis
            dataKey="name"
            tick={{ fill: "#64748b", fontSize: 12 }}
            interval={0}
            angle={data.length > 4 ? -18 : 0}
            textAnchor={data.length > 4 ? "end" : "middle"}
            height={data.length > 4 ? 72 : 30}
          />
          <YAxis tick={{ fill: "#64748b", fontSize: 12 }} allowDecimals={false} />
          <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: "rgba(5, 150, 105, 0.08)" }} />
          <Legend verticalAlign="top" height={36} iconType="circle" />
          <Bar dataKey="resolved" name="Resolved" fill="#059669" radius={[8, 8, 0, 0]} maxBarSize={40} />
          <Bar
            dataKey="unresolved"
            name="Unresolved"
            fill="#f59e0b"
            radius={[8, 8, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </CrmChartCard>
  );
};

export default CrmCsrPerformanceChart;
