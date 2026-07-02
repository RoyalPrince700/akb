import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
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

const formatRating = (value) => (value === null || value === undefined ? "—" : `${value}/5`);

const cell = (text, bold = false) =>
  new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text: String(text ?? ""), bold })],
      }),
    ],
  });

const headerRow = (labels) =>
  new TableRow({
    children: labels.map((label) => cell(label, true)),
  });

const dataRow = (values) =>
  new TableRow({
    children: values.map((value) => cell(value)),
  });

const formatBreakdownRowLabel = (row) => row.name || formatLabel(row._id);

const breakdownTable = (title, rows) => {
  const children = [
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 120 },
    }),
  ];

  if (!rows.length) {
    children.push(new Paragraph({ text: "No data available." }));
    return children;
  }

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        headerRow(["Label", "Count"]),
        ...rows.map((row) => dataRow([formatBreakdownRowLabel(row), row.count])),
      ],
    })
  );

  return children;
};

export const downloadCrmReportDocx = async ({ period, reports, csrFilterLabel }) => {
  const overview = reports.overview || {};
  const csrPerformance = reports.csrPerformance || [];

  const children = [
    new Paragraph({
      text: "CRM Performance Report",
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Report period: ", bold: true }),
        new TextRun(formatPeriodLabel(period)),
      ],
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "CSR filter: ", bold: true }),
        new TextRun(csrFilterLabel || "All CSRs"),
      ],
      spacing: { after: 240 },
    }),
    new Paragraph({
      text: "Overview",
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 120 },
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        headerRow(["Metric", "Value"]),
        dataRow(["Total tickets", overview.totalTickets ?? 0]),
        dataRow(["Resolved tickets", overview.resolved ?? 0]),
        dataRow(["Unresolved tickets", overview.unresolved ?? 0]),
        dataRow(["Resolution rate", `${overview.resolutionRate ?? 0}%`]),
        dataRow(["Pending requests", overview.pendingRequests ?? 0]),
        dataRow(["Inbound tickets", overview.inbound ?? 0]),
        dataRow(["Outbound tickets", overview.outbound ?? 0]),
        dataRow(["Surveys sent", overview.surveySent ?? 0]),
        dataRow(["Surveys responded", overview.surveyResponded ?? 0]),
        dataRow(["Survey response rate", `${overview.surveyResponseRate ?? 0}%`]),
        dataRow(["Sales records", overview.salesRecords ?? 0]),
        dataRow(["Books sold", overview.booksSold ?? 0]),
        dataRow(["Sales value", formatCurrency(overview.salesValue ?? 0)]),
      ],
    }),
    new Paragraph({
      text: "CSR Performance",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 360, after: 120 },
    }),
  ];

  if (!csrPerformance.length) {
    children.push(new Paragraph({ text: "No CSR performance data available." }));
  } else {
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          headerRow([
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
          ]),
          ...csrPerformance.map((row) =>
            dataRow([
              row.name,
              row.staffId || "—",
              row.totalTickets ?? 0,
              row.resolved ?? 0,
              row.unresolved ?? 0,
              `${row.resolutionRate ?? 0}%`,
              row.inbound ?? 0,
              row.outbound ?? 0,
              row.enquiries ?? 0,
              row.complaints ?? 0,
              row.requests ?? 0,
              row.surveysSent ?? 0,
              row.surveysResponded ?? 0,
              `${row.surveyResponseRate ?? 0}%`,
              formatRating(row.avgCsrRating),
              formatRating(row.avgResolutionRating),
              row.salesRecords ?? 0,
              row.booksSold ?? 0,
              formatCurrency(row.salesValue ?? 0),
            ])
          ),
        ],
      })
    );
  }

  children.push(
    ...breakdownTable("Tickets by direction", reports.byDirection || []),
    ...breakdownTable("Tickets by category", reports.byCategory || []),
    ...breakdownTable("Tickets by state", reports.byState || []),
    ...breakdownTable("Tickets by resolution status", reports.byStatus || []),
    ...breakdownTable("Tickets by CSR", reports.byOwner || []),
    ...breakdownTable("Tickets by sales rep", reports.bySalesRep || []),
    ...breakdownTable("Surveys triggered by CSR", reports.surveyBySender || []),
    ...breakdownTable("Surveys by ticket owner", reports.surveyByTicketOwner || [])
  );

  const doc = new Document({
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  const stamp = new Date().toISOString().slice(0, 10);
  saveAs(blob, `crm-performance-report-${stamp}.docx`);
};
