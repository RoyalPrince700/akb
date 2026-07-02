import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import CrmChartCard from "./CrmChartCard";
import { CHART_COLORS } from "../../utils/crmChartData";

const chartTooltipStyle = {
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
};

const CrmBarChartCard = ({
  title,
  description,
  data,
  dataKey = "value",
  color = CHART_COLORS[0],
  emptyMessage,
  layout = "horizontal",
  heightClassName,
}) => {
  const isEmpty = !data?.length || !data.some((item) => item[dataKey] > 0);
  const isVertical = layout === "vertical";

  return (
    <CrmChartCard
      title={title}
      description={description}
      empty={isEmpty}
      emptyMessage={emptyMessage}
      heightClassName={heightClassName}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={isVertical ? "vertical" : "horizontal"}
          margin={{ top: 8, right: 8, left: isVertical ? 8 : -12, bottom: 0 }}
        >
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={!isVertical} horizontal={isVertical} />
          {isVertical ? (
            <>
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tick={{ fill: "#64748b", fontSize: 12 }}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey="name"
                tick={{ fill: "#64748b", fontSize: 12 }}
                interval={0}
                angle={data.length > 4 ? -20 : 0}
                textAnchor={data.length > 4 ? "end" : "middle"}
                height={data.length > 4 ? 70 : 30}
              />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} allowDecimals={false} />
            </>
          )}
          <Tooltip
            contentStyle={chartTooltipStyle}
            cursor={{ fill: "rgba(5, 150, 105, 0.08)" }}
          />
          <Bar dataKey={dataKey} fill={color} radius={[8, 8, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </CrmChartCard>
  );
};

export default CrmBarChartCard;
