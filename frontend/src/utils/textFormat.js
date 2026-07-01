export const capitalizeWords = (value, options = {}) => {
  if (!value || typeof value !== "string") {
    return value;
  }

  const { trim = true } = options;
  const normalizedValue = trim ? value.trim() : value;

  return normalizedValue.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export const CRM_CAPITALIZED_FIELDS = [
  "schoolName",
  "address",
  "complaintNature",
  "bookTitles",
];
