import chapter01 from "./chapters/01-financial-literacy";
import chapter02 from "./chapters/02-budgeting";
import chapter03 from "./chapters/03-procurement";
import chapter04 from "./chapters/03-invoicing";
import chapter05 from "./chapters/05-cash-handling";
import chapter06 from "./chapters/06-inventory-costs";
import chapter07 from "./chapters/07-payroll-claims";
import chapter08 from "./chapters/08-reporting-kpis";
import chapter09 from "./chapters/09-internal-controls";
import chapter10 from "./chapters/04-integrity";

export default {
  id: "finance",
  title: "Finance Essentials for Staff",
  shortDescription:
    "Build practical confidence in budgeting, procurement, payments, controls, and financial integrity at work.",
  description:
    "A practical finance course for Accessible Publishers staff. It explains how money moves through publishing operations, how budgets and vendors are managed, how invoices and payments are handled, and how every team supports strong controls, accurate records, and ethical financial decisions.",
  category: "Operations",
  audience: "staff",
  order: 2,
  accent: "emerald",
  chapters: [
    chapter01,
    chapter02,
    chapter03,
    chapter04,
    chapter05,
    chapter06,
    chapter07,
    chapter08,
    chapter09,
    chapter10,
  ],
};
