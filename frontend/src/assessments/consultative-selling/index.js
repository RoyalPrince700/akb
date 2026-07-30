import questions from "./questions";

export default {
  courseId: "consultative-selling",
  title: "Consultative Selling — Assessment",
  description:
    "Twenty questions on consultative selling, the 5D model, customer landscape, APL solutions, value selling, objection handling, and follow-up discipline.",
  totalQuestions: questions.length,
  pointsPerQuestion: 1,
  passMark: 14,
  timeLimitMinutes: 10,
  questions,
};
