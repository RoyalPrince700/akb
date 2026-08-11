import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const slugify = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "session";

/**
 * Download KSS attendance Excel for one session (HR/admin).
 * Columns: Name, Department, Present, Topic of the KSS
 * @param {{ session: object, attendees?: Array }} payload
 */
export const downloadKssAttendanceReportXlsx = ({
  session,
  attendees = [],
}) => {
  if (!session) {
    throw new Error("Session is required to export KSS attendance.");
  }

  const topic = session.topic || "—";
  const workbook = XLSX.utils.book_new();

  const rows = [
    ["Name", "Department", "Present", "Topic of the KSS"],
    ...attendees.map((row) => [
      row.name || "—",
      row.department || "—",
      "Yes",
      topic,
    ]),
  ];

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet["!cols"] = [
    { wch: 28 },
    { wch: 20 },
    { wch: 10 },
    { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(workbook, sheet, "Attendance");

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const dateStamp = session.date || new Date().toISOString().slice(0, 10);
  saveAs(blob, `kss-attendance-${dateStamp}-${slugify(topic)}.xlsx`);
};
