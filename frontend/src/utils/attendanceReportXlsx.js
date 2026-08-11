import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/** Date key YYYY-MM-DD → readable Lagos date for the Date column only */
const formatDateKey = (value) => {
  if (!value) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("en-NG", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Africa/Lagos",
    });
  }
  return value;
};

/** Punch time only (AM/PM) — date lives in the Date column */
const formatTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Lagos",
  });
};

const formatDuration = (minutes) => {
  if (minutes == null || minutes === undefined) return "—";
  const total = Number(minutes) || 0;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours <= 0) return `${mins}m`;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

const formatOvertime = (minutes) => {
  const total = Number(minutes) || 0;
  if (total <= 0) return "—";
  return formatDuration(total);
};

const yesNo = (value) => (value ? "Yes" : "No");

/** Columns aligned with what HR sees on the attendance page */
const HEADERS = [
  "Date",
  "Name",
  "Staff ID",
  "Department",
  "Position",
  "Check in",
  "Check out",
  "Duration",
  "Status",
  "Late",
  "Early leave",
  "Overtime",
  "Source",
];

const mapRecordRow = (record) => [
  formatDateKey(record.date),
  record.name || "—",
  record.staffId || "—",
  record.department || "—",
  record.position || "—",
  formatTime(record.checkInAt),
  formatTime(record.checkOutAt),
  formatDuration(record.durationMinutes),
  record.status || "—",
  yesNo(record.isLate),
  yesNo(record.isEarlyLeave),
  formatOvertime(record.overtimeMinutes),
  record.source || "facial",
];

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

  const dataRows = [HEADERS, ...records.map(mapRecordRow)];
  const dataSheet = XLSX.utils.aoa_to_sheet(dataRows);
  dataSheet["!cols"] = [
    { wch: 14 }, // Date
    { wch: 24 }, // Name
    { wch: 12 }, // Staff ID
    { wch: 18 }, // Department
    { wch: 16 }, // Position
    { wch: 12 }, // Check in
    { wch: 12 }, // Check out
    { wch: 12 }, // Duration
    { wch: 10 }, // Status
    { wch: 8 }, // Late
    { wch: 12 }, // Early leave
    { wch: 12 }, // Overtime
    { wch: 10 }, // Source
  ];
  // Primary sheet first — the row-level details HR needs
  XLSX.utils.book_append_sheet(workbook, dataSheet, "Attendance");

  const summaryRows = [
    ["AKB Attendance Report"],
    ["Timezone", timezone],
    ["Period", monthLabel],
    [
      "Generated on",
      new Date().toLocaleString("en-NG", {
        timeZone: timezone,
        hour12: true,
      }),
    ],
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
    ["Resumption", "08:00 AM"],
    ["Grace period", "15 minutes (on time through 08:15 AM)"],
    ["Late from", "08:16 AM"],
    ["Official closing", "05:00 PM"],
    ["Overtime starts", "06:00 PM"],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  summarySheet["!cols"] = [{ wch: 28 }, { wch: 48 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const stamp = month || filter.month || new Date().toISOString().slice(0, 7);
  saveAs(blob, `attendance-report-${stamp}.xlsx`);
};
