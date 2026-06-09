import questions from "./questions";

export default {
  courseId: "company-history",
  title: "History of Accessible Publishers Limited — Assessment",
  description:
    "Test your understanding of our origins, scale, VICAP values, publishing services, Smart Edu Hub, awards, clients, and leadership.",
  totalQuestions: questions.length,
  pointsPerQuestion: 1,
  passMark: 12,
  timeLimitMinutes: 4,
  questions,
};
