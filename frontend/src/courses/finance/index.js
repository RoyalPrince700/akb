import chapter01 from "./chapters/01-financial-literacy";
import chapter02 from "./chapters/02-budgeting";
import chapter03 from "./chapters/03-invoicing";
import chapter04 from "./chapters/04-integrity";

export default {
  id: "finance",
  title: "Finance Essentials for Staff",
  shortDescription:
    "Build confidence in budgets, invoicing, payments, and financial integrity at work.",
  description:
    "Introductory finance training for non-finance staff at Accessible Publishers—covering literacy, expenses, invoicing, and compliance.",
  category: "Operations",
  audience: "staff",
  order: 2,
  accent: "emerald",
  chapters: [chapter01, chapter02, chapter03, chapter04],
};
