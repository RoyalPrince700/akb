import questions from "./questions";

export default {
  courseId: "ai-for-staff",
  title: "AI at Work — Assessment",
  description:
    "Ten questions on responsible and practical AI use for Accessible Publishers staff.",
  totalQuestions: questions.length,
  pointsPerQuestion: 1,
  passMark: 7,
  questions,
};
