import chapter01 from "./chapters/01-introduction-to-hrm";
import chapter02 from "./chapters/02-historical-perspectives";
import chapter03 from "./chapters/03-functions-and-responsibilities";
import chapter04 from "./chapters/04-hr-planning-and-performance";
import chapter05 from "./chapters/05-recruitment-selection-orientation";
import chapter06 from "./chapters/06-training-and-development";
import chapter07 from "./chapters/07-remuneration-motivation-health-safety";
import chapter08 from "./chapters/08-performance-management-appraisal";
import chapter09 from "./chapters/09-job-design-analysis";
import chapter10 from "./chapters/10-communication-employee-relations";

export default {
  id: "human-resource-management",
  title: "Human Resource Management",
  shortDescription:
    "A concise framework on HRM policy, processes, and practices—from planning and recruitment to motivation, performance, and employee relations.",
  description:
    "Based on Bassey Anam's A Concise Framework on Human Resource Management. Covers introduction to HRM, historical development, core functions, planning, recruitment, training, remuneration, performance management, job design, and communication.",
  category: "Professional Development",
  audience: "staff",
  order: 4,
  accent: "amber",
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
