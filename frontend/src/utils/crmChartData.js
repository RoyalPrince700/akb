export const CHART_COLORS = [
  "#059669",
  "#0284c7",
  "#f59e0b",
  "#8b5cf6",
  "#f43f5e",
  "#14b8a6",
  "#6366f1",
  "#84cc16",
];

export const mapBreakdownRows = (rows, formatLabel, { labelKey = "name", limit } = {}) => {
  const mapped = (rows || []).map((row) => ({
    name: row[labelKey] || formatLabel?.(row._id) || row._id || "Unknown",
    value: row.count ?? 0,
  }));

  if (typeof limit === "number") {
    return mapped.slice(0, limit);
  }

  return mapped;
};

export const hasChartData = (data) => Array.isArray(data) && data.some((item) => item.value > 0);

export const mapCsrPerformanceChart = (rows, limit = 8) =>
  [...(rows || [])]
    .sort((a, b) => (b.totalTickets ?? 0) - (a.totalTickets ?? 0))
    .slice(0, limit)
    .map((row) => ({
      name: row.name || row.staffId || "Unknown",
      resolved: row.resolved ?? 0,
      unresolved: row.unresolved ?? 0,
      totalTickets: row.totalTickets ?? 0,
    }));

export const mapOverviewDirectionData = (overview) => [
  { name: "Inbound", value: overview.inbound ?? 0 },
  { name: "Outbound", value: overview.outbound ?? 0 },
];

export const mapOverviewResolutionData = (overview) => [
  { name: "Resolved", value: overview.resolved ?? 0 },
  { name: "Unresolved", value: overview.unresolved ?? 0 },
];

export const mapDashboardDirectionData = (summary) => [
  { name: "Inbound", value: summary.inboundCount ?? 0 },
  { name: "Outbound", value: summary.outboundCount ?? 0 },
];

export const mapDashboardResolutionData = (summary) => {
  const total = summary.totalContacts ?? 0;
  const unresolved = summary.unresolvedCount ?? 0;

  return [
    { name: "Resolved", value: Math.max(0, total - unresolved) },
    { name: "Unresolved", value: unresolved },
  ];
};
