import questions from "./questions";

export default {
  courseId: "human-resource-management",
  title: "Human Resource Management — Assessment",
  description:
    "Test your understanding of HRM concepts, functions, planning, motivation, performance, and employee relations.",
  totalQuestions: questions.length,
  pointsPerQuestion: 1,
  passMark: 12,
  timeLimitMinutes: 4,
  questions,
};
