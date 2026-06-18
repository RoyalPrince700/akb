import questions from "./questions";

export default {
  courseId: "critical-thinking",
  title: "Critical Thinking for Staff — Assessment",
  description:
    "Test your understanding of critical thinking concepts, the five step process, common biases, and practical application in publishing and sales work.",
  totalQuestions: questions.length,
  pointsPerQuestion: 1,
  passMark: 12,
  timeLimitMinutes: 5,
  questions,
};
