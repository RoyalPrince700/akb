import questions from "./questions";

export default {
  courseId: "solution-selling",
  title: "Solution Selling — Assessment",
  description:
    "Twenty questions on cross-selling, up-selling, the Accessible product ecosystem, SmartEdu Hub bundles, the N.E.E.D.S. framework, objections, practice scenarios, and KPIs.",
  totalQuestions: questions.length,
  pointsPerQuestion: 1,
  passMark: 14,
  timeLimitMinutes: 10,
  questions,
};
