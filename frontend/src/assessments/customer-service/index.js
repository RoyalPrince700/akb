import questions from "./questions";

export default {
  courseId: "customer-service",
  title: "Customer Service Assessment",
  description:
    "Twenty questions on customer care, communication, complaint handling, service recovery, and professional follow-through for Accessible Publishers staff.",
  totalQuestions: questions.length,
  pointsPerQuestion: 1,
  passMark: 14,
  timeLimitMinutes: 6,
  questions,
};
