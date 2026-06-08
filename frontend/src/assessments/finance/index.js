import questions from "./questions";

export default {
  courseId: "finance",
  title: "Finance Essentials — Assessment",
  description:
    "Ten questions on workplace finance literacy, expenses, and integrity.",
  totalQuestions: questions.length,
  pointsPerQuestion: 1,
  passMark: 7,
  questions,
};
