export const nigerianStates = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Federal Capital Territory",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

export const outboundCategories = [
  { value: "enquiry", label: "Enquiry" },
  { value: "complaint", label: "Complaint" },
  { value: "request", label: "Request" },
  { value: "appreciationCall", label: "Appreciation Call" },
  { value: "promotionalCall", label: "Promotional Call" },
  { value: "prospectCall", label: "Prospect Call" },
];

export const inboundCategories = [
  { value: "enquiry", label: "Enquiry" },
  { value: "complaint", label: "Complaint" },
  { value: "request", label: "Request" },
];

export const crmStatuses = [
  { value: "resolved", label: "Resolved" },
  { value: "unresolved", label: "Unresolved" },
];

export const contactMedia = [
  { value: "website", label: "Website" },
  { value: "mail", label: "Mail" },
  { value: "phone", label: "Phone" },
  { value: "whatsapp", label: "WhatsApp" },
];

export const phoneLineLabels = [
  { value: "landline", label: "Landline" },
  { value: "csrOfficialLine", label: "CSR Official Line" },
  { value: "message", label: "Message" },
];

export const getPhoneLineLabelsForMedium = (medium) => {
  if (medium === "whatsapp") {
    return phoneLineLabels.filter((item) => item.value === "message");
  }

  if (medium === "phone") {
    return phoneLineLabels.filter((item) => item.value !== "message");
  }

  return [];
};

export const landlinePhoneNumber = "02012278139";

export const customerTypes = [
  { value: "newCustomer", label: "New customer" },
  { value: "existingCustomer", label: "Existing customer" },
];

export const organizationTypes = [
  { value: "school", label: "School" },
  { value: "bookshop", label: "Bookshop" },
  { value: "individual", label: "Individual" },
  { value: "marketer", label: "Marketer" },
];

export const callerStatuses = [
  { value: "firstCaller", label: "First caller" },
  { value: "repeatCaller", label: "Repeat caller" },
];

export const surveyChannels = [
  { value: "WhatsApp", label: "WhatsApp" },
  { value: "SMS", label: "SMS" },
  { value: "Email", label: "Email" },
  { value: "Manual", label: "Manual" },
];

export const bookSaleClassOptions = [
  { value: "nursery1", label: "Nursery 1" },
  { value: "nursery2", label: "Nursery 2" },
  { value: "nursery3", label: "Nursery 3" },
  { value: "primary1", label: "Primary 1" },
  { value: "primary2", label: "Primary 2" },
  { value: "primary3", label: "Primary 3" },
  { value: "primary4", label: "Primary 4" },
  { value: "primary5", label: "Primary 5" },
  { value: "primary6", label: "Primary 6" },
  { value: "jss1", label: "JSS 1" },
  { value: "jss2", label: "JSS 2" },
  { value: "jss3", label: "JSS 3" },
  { value: "ss1", label: "SS 1" },
  { value: "ss2", label: "SS 2" },
  { value: "ss3", label: "SS 3" },
  { value: "tertiary", label: "Tertiary" },
  { value: "literature", label: "Literature" },
  { value: "other", label: "Other titles" },
];

export const crmRoleOptions = [
  { value: "staff", label: "Staff" },
  { value: "hr", label: "HR" },
  { value: "admin", label: "Admin" },
  { value: "csr", label: "CSR" },
  { value: "csrAdmin", label: "CSR Admin" },
];

export const formatCrmCategory = (value) => {
  const allCategories = [...outboundCategories, ...inboundCategories];
  return allCategories.find((item) => item.value === value)?.label || value;
};

export const formatRoleLabel = (role) =>
  crmRoleOptions.find((item) => item.value === role)?.label || role;

export const getCsrDisplayName = (user, fallback = "Unknown CSR") =>
  user?.csrDisplayName || user?.name || fallback;

export const formatBookSaleClass = (value) =>
  bookSaleClassOptions.find((item) => item.value === value)?.label || value;

export const formatPhoneLineLabel = (value) =>
  phoneLineLabels.find((item) => item.value === value)?.label || value;

export const formatOrganizationType = (value) =>
  organizationTypes.find((item) => item.value === value)?.label || value;

export const getOrganizationNameLabel = (organizationType) => {
  if (organizationType === "bookshop") return "Bookshop name";
  if (organizationType === "individual") return "Individual name";
  if (organizationType === "marketer") return "Marketer name";
  return "School name";
};

export const getOrganizationNamePlaceholder = (organizationType) => {
  if (organizationType === "bookshop") return "Enter bookshop name";
  if (organizationType === "individual") return "Enter individual name";
  if (organizationType === "marketer") return "Enter marketer name";
  return "Search uploaded school name...";
};
