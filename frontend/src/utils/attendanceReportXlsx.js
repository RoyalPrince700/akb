import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const formatDateTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  });
};

const formatDuration = (minutes) => {
  if (minutes == null || minutes === undefined) return "—";
  const total = Number(minutes) || 0;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours <= 0) return `${mins}m`;
  return `${mins > 0 ? `${hours}h ${mins}m` : `${hours}h`}`;
};

const formatOvertime = (minutes) => {
  const total = Number(minutes) || 0;
  if (total <= 0) return "0";
  return formatDuration(total);
};

const yesNo = (value) => (value ? "Yes" : "No");

const HEADERS = [
  "Date",
  "Staff ID",
  "Name",
  "Department",
  "Position",
  "Check in",
  "Check out",
  "Duration",
  "Status",
  "Late",
  "Early leave",
  "Overtime (minutes)",
  "Overtime (hours)",
  "Overtime display",
  "Source",
];

const mapRecordRow = (record) => {
  const overtimeMinutes = Number(record.overtimeMinutes) || 0;
  const overtimeHours =
    record.overtimeHours != null
      ? record.overtimeHours
      : Math.round((overtimeMinutes / 60) * 100) / 100;

  return [
    record.date || "—",
    record.staffId || "—",
    record.name || "—",
    record.department || "—",
    record.position || "—",
    formatDateTime(record.checkInAt),
    formatDateTime(record.checkOutAt),
    formatDuration(record.durationMinutes),
    record.status || "—",
    yesNo(record.isLate),
    yesNo(record.isEarlyLeave),
    overtimeMinutes,
    overtimeHours,
    formatOvertime(overtimeMinutes),
    record.source || "facial",
  ];
};

const formatMonthLabel = (month) => {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return month || "—";
  const [year, mon] = month.split("-");
  const date = new Date(Number(year), Number(mon) - 1, 1);
  return date.toLocaleDateString("en-NG", { month: "long", year: "numeric" });
};

/**
 * Download HR attendance Excel for a month (or filtered export payload).
 * @param {{ month?: string, records: Array, totals?: object, filter?: object, timezone?: string }} payload
 */
export const downloadAttendanceReportXlsx = ({
  month,
  records = [],
  totals = {},
  filter = {},
  timezone = "Africa/Lagos",
}) => {
  const workbook = XLSX.utils.book_new();
  const monthLabel = formatMonthLabel(month || filter.month);

  const summaryRows = [
    ["AKB Attendance Report"],
    ["Timezone", timezone],
    ["Period", monthLabel],
    ["Generated on", new Date().toLocaleString("en-NG", { timeZone: timezone })],
    [],
    ["Totals"],
    ["Records", totals.records ?? records.length],
    ["Late", totals.late ?? 0],
    ["Early leave", totals.earlyLeave ?? 0],
    ["With overtime", totals.withOvertime ?? 0],
    ["Overtime hours", totals.overtimeHours ?? 0],
    ["Overtime minutes", totals.overtimeMinutes ?? 0],
    [],
    ["Official policy (Africa/Lagos)"],
    ["Resumption", "08:00"],
    ["Grace period", "15 minutes (on time through 08:15)"],
    ["Late from", "08:16"],
    ["Official closing", "17:00"],
    ["Overtime starts", "18:00"],
  ];

  const dataRows = [
    HEADERS,
    ...records.map(mapRecordRow),
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  summarySheet["!cols"] = [{ wch: 28 }, { wch: 48 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

  const dataSheet = XLSX.utils.aoa_to_sheet(dataRows);
  dataSheet["!cols"] = [
    { wch: 12 },
    { wch: 12 },
    { wch: 22 },
    { wch: 16 },
    { wch: 16 },
    { wch: 22 },
    { wch: 22 },
    { wch: 12 },
    { wch: 10 },
    { wch: 8 },
    { wch: 12 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(workbook, dataSheet, "Records");

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const stamp = month || filter.month || new Date().toISOString().slice(0, 7);
  saveAs(blob, `attendance-report-${stamp}.xlsx`);
};
