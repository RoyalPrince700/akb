const NIGERIAN_STATES = [
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

const CRM_DIRECTIONS = ["inbound", "outbound"];
const OUTBOUND_CATEGORIES = [
  "enquiry",
  "complaint",
  "request",
  "appreciationCall",
  "promotionalCall",
  "prospectCall",
];
const INBOUND_CATEGORIES = ["enquiry", "complaint", "request"];
const CRM_CATEGORIES = [...new Set([...OUTBOUND_CATEGORIES, ...INBOUND_CATEGORIES])];
const CRM_STATUSES = ["resolved", "unresolved"];
const CONTACT_MEDIA = ["website", "mail", "phone", "whatsapp"];
const PHONE_LINE_LABELS = ["landline", "csrOfficialLine", "message"];
const CUSTOMER_TYPES = ["newCustomer", "existingCustomer"];
const ORGANIZATION_TYPES = ["school", "bookshop", "individual", "marketer"];
const CALLER_STATUSES = ["firstCaller", "repeatCaller"];
const SURVEY_CHANNELS = ["WhatsApp", "SMS", "Email", "Manual"];
const BOOK_SALE_CLASSES = [
  "nursery1",
  "nursery2",
  "nursery3",
  "primary1",
  "primary2",
  "primary3",
  "primary4",
  "primary5",
  "primary6",
  "jss1",
  "jss2",
  "jss3",
  "ss1",
  "ss2",
  "ss3",
  "tertiary",
  "literature",
  "other",
];

module.exports = {
  CALLER_STATUSES,
  CONTACT_MEDIA,
  CRM_CATEGORIES,
  CRM_DIRECTIONS,
  CRM_STATUSES,
  CUSTOMER_TYPES,
  INBOUND_CATEGORIES,
  NIGERIAN_STATES,
  BOOK_SALE_CLASSES,
  ORGANIZATION_TYPES,
  OUTBOUND_CATEGORIES,
  PHONE_LINE_LABELS,
  SURVEY_CHANNELS,
};
