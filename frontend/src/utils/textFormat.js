export const capitalizeWords = (value) => {
  if (!value || typeof value !== "string") {
    return value;
  }

  return value.trim().toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export const CRM_CAPITALIZED_FIELDS = [
  "schoolName",
  "address",
  "complaintNature",
  "bookTitles",
  "remark",
  "phoneLineLabel",
];
