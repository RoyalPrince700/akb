import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import CrmChartCard from "./CrmChartCard";
import { CHART_COLORS } from "../../utils/crmChartData";

const chartTooltipStyle = {
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
};

const CrmPieChartCard = ({
  title,
  description,
  data,
  emptyMessage,
  heightClassName,
  innerRadius = 56,
  outerRadius = 96,
}) => {
  const isEmpty = !data?.length || !data.some((item) => item.value > 0);

  return (
    <CrmChartCard
      title={title}
      description={description}
      empty={isEmpty}
      emptyMessage={emptyMessage}
      heightClassName={heightClassName}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={3}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={chartTooltipStyle} />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </CrmChartCard>
  );
};

export default CrmPieChartCard;
