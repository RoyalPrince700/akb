import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import { formatCrmCategory } from "../constants/crm";

const formatLabel = (value) => {
  if (!value) {
    return "Unknown";
  }

  if (value === "inbound") return "Inbound";
  if (value === "outbound") return "Outbound";
  if (value === "resolved") return "Resolved";
  if (value === "unresolved") return "Unresolved";

  return formatCrmCategory(value) || value;
};

const formatPeriodLabel = (period) => {
  if (!period || period.type === "all") {
    return "All time";
  }

  if (period.type === "week") {
    return `This week (${period.startDate} to ${period.endDate})`;
  }

  if (period.type === "month") {
    return `This month (${period.startDate} to ${period.endDate})`;
  }

  if (period.type === "year") {
    return `This year (${period.startDate} to ${period.endDate})`;
  }

  return `${period.startDate} to ${period.endDate}`;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatPercent = (value) => `${value ?? 0}%`;

const formatRating = (value) => (value === null || value === undefined ? "—" : `${value}/5`);

const CSR_PERFORMANCE_HEADERS = [
  "CSR",
  "Staff ID",
  "Tickets",
  "Resolved",
  "Unresolved",
  "Resolution %",
  "Inbound",
  "Outbound",
  "Enquiries",
  "Complaints",
  "Requests",
  "Surveys sent",
  "Survey responses",
  "Survey response %",
  "Avg CSR rating",
  "Avg resolution rating",
  "Sales records",
  "Books sold",
  "Sales value",
];

const mapCsrPerformanceRow = (row) => [
  row.name,
  row.staffId || "—",
  row.totalTickets ?? 0,
  row.resolved ?? 0,
  row.unresolved ?? 0,
  formatPercent(row.resolutionRate),
  row.inbound ?? 0,
  row.outbound ?? 0,
  row.enquiries ?? 0,
  row.complaints ?? 0,
  row.requests ?? 0,
  row.surveysSent ?? 0,
  row.surveysResponded ?? 0,
  formatPercent(row.surveyResponseRate),
  formatRating(row.avgCsrRating),
  formatRating(row.avgResolutionRating),
  row.salesRecords ?? 0,
  row.booksSold ?? 0,
  formatCurrency(row.salesValue ?? 0),
];

const buildReportMetadataRows = (period, csrFilterLabel) => [
  ["CRM Performance Report"],
  ["Report period", formatPeriodLabel(period)],
  ["CSR filter", csrFilterLabel || "All CSRs"],
  ["Generated on", new Date().toLocaleString()],
];

const buildOverviewRows = (overview) => [
  ["Overview"],
  ["Metric", "Value"],
  ["Total tickets", overview.totalTickets ?? 0],
  ["Resolved tickets", overview.resolved ?? 0],
  ["Unresolved tickets", overview.unresolved ?? 0],
  ["Resolution rate", formatPercent(overview.resolutionRate)],
  ["Pending requests", overview.pendingRequests ?? 0],
  ["Inbound tickets", overview.inbound ?? 0],
  ["Outbound tickets", overview.outbound ?? 0],
  ["Surveys sent", overview.surveySent ?? 0],
  ["Surveys responded", overview.surveyResponded ?? 0],
  ["Survey response rate", formatPercent(overview.surveyResponseRate)],
  ["Sales records", overview.salesRecords ?? 0],
  ["Books sold", overview.booksSold ?? 0],
  ["Sales value", formatCurrency(overview.salesValue ?? 0)],
];

const buildCsrPerformanceRows = (csrPerformance) => {
  if (!csrPerformance.length) {
    return [["CSR Performance"], ["No CSR performance data available."]];
  }

  return [
    ["CSR Performance"],
    CSR_PERFORMANCE_HEADERS,
    ...csrPerformance.map(mapCsrPerformanceRow),
  ];
};

const formatBreakdownRowLabel = (row) => row.name || formatLabel(row._id);

const buildBreakdownRows = (title, rows) => {
  const section = [[title]];

  if (!rows.length) {
    return [...section, ["No data available."]];
  }

  return [
    ...section,
    ["Label", "Count"],
    ...rows.map((row) => [formatBreakdownRowLabel(row), row.count ?? 0]),
  ];
};

const BREAKDOWN_SECTIONS = [
  { title: "Tickets by direction", key: "byDirection" },
  { title: "Tickets by category", key: "byCategory" },
  { title: "Tickets by state", key: "byState" },
  { title: "Tickets by resolution status", key: "byStatus" },
  { title: "Tickets by CSR", key: "byOwner" },
  { title: "Tickets by sales rep", key: "bySalesRep" },
  { title: "Surveys triggered by CSR", key: "surveyBySender" },
  { title: "Surveys by ticket owner", key: "surveyByTicketOwner" },
];

const buildFullReportRows = ({ period, reports, csrFilterLabel }) => {
  const overview = reports.overview || {};
  const csrPerformance = reports.csrPerformance || [];
  const rows = [
    ...buildReportMetadataRows(period, csrFilterLabel),
    [],
    ...buildOverviewRows(overview),
    [],
    ...buildCsrPerformanceRows(csrPerformance),
  ];

  BREAKDOWN_SECTIONS.forEach(({ title, key }) => {
    rows.push([], ...buildBreakdownRows(title, reports[key] || []));
  });

  return rows;
};

const buildSectionSheetRows = (sectionTitle, period, csrFilterLabel, tableRows) => [
  ...buildReportMetadataRows(period, csrFilterLabel),
  [],
  ...tableRows,
];

const setWorksheetFormatting = (worksheet, columnWidths = []) => {
  if (columnWidths.length) {
    worksheet["!cols"] = columnWidths.map((width) => ({ wch: width }));
  }
};

const addSheet = (workbook, name, rows, columnWidths = []) => {
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  setWorksheetFormatting(worksheet, columnWidths);
  XLSX.utils.book_append_sheet(workbook, worksheet, name.slice(0, 31));
};

export const downloadCrmReportXlsx = ({ period, reports, csrFilterLabel }) => {
  const overview = reports.overview || {};
  const csrPerformance = reports.csrPerformance || [];
  const workbook = XLSX.utils.book_new();

  addSheet(
    workbook,
    "Full Report",
    buildFullReportRows({ period, reports, csrFilterLabel }),
    [34, 22, 18, 16, 16, 14, 12, 12, 12, 12, 12, 14, 16, 18, 16, 20, 14, 12, 18]
  );

  addSheet(
    workbook,
    "Overview",
    buildSectionSheetRows("Overview", period, csrFilterLabel, buildOverviewRows(overview)),
    [28, 24]
  );

  addSheet(
    workbook,
    "CSR Performance",
    buildSectionSheetRows(
      "CSR Performance",
      period,
      csrFilterLabel,
      buildCsrPerformanceRows(csrPerformance)
    ),
    [24, 14, 10, 10, 12, 14, 10, 10, 12, 12, 10, 14, 16, 18, 16, 20, 14, 12, 18]
  );

  BREAKDOWN_SECTIONS.forEach(({ title, key }) => {
    addSheet(
      workbook,
      title,
      buildSectionSheetRows(
        title,
        period,
        csrFilterLabel,
        buildBreakdownRows(title, reports[key] || [])
      ),
      [32, 12]
    );
  });

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const stamp = new Date().toISOString().slice(0, 10);
  saveAs(blob, `crm-performance-report-${stamp}.xlsx`);
};
