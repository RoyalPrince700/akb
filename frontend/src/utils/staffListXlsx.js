import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import { formatRoleLabel } from "../constants/crm";

const HEADERS = [
  "Name",
  "Staff ID",
  "Email",
  "Department",
  "Position",
  "Role",
  "Face",
  "Status",
];

const mapStaffRow = (member) => [
  member.name || "—",
  member.staffId || "—",
  member.email || "—",
  member.department || "—",
  member.position || "—",
  formatRoleLabel(member.role || "staff"),
  member.faceEnrolled || member.facePhotoUrl ? "Enrolled" : "Not enrolled",
  member.isActive !== false ? "Active" : "Inactive",
];

/**
 * Download the HR staff list as Excel.
 * @param {{ staff?: Array }} payload
 */
export const downloadStaffListXlsx = ({ staff = [] }) => {
  const workbook = XLSX.utils.book_new();
  const dataRows = [HEADERS, ...staff.map(mapStaffRow)];
  const sheet = XLSX.utils.aoa_to_sheet(dataRows);
  sheet["!cols"] = [
    { wch: 24 },
    { wch: 14 },
    { wch: 32 },
    { wch: 20 },
    { wch: 20 },
    { wch: 16 },
    { wch: 14 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(workbook, sheet, "Staff");

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const stamp = new Date().toISOString().slice(0, 10);
  saveAs(blob, `staff-list-${stamp}.xlsx`);
};
