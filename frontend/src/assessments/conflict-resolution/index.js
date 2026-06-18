import questions from "./questions";

export default {
  courseId: "conflict-resolution",
  title: "Conflict Resolution - Assessment",
  description:
    "Test your understanding of workplace conflict, its causes, communication skills, listening, negotiation, and building a positive conflict culture at Accessible Publishers.",
  totalQuestions: questions.length,
  pointsPerQuestion: 1,
  passMark: 12,
  timeLimitMinutes: 5,
  questions,
};
