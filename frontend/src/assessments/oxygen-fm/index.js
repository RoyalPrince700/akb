import questions from "./questions";

export default {
  courseId: "oxygen-fm",
  title: "Oxygen FM 96.9 — Assessment",
  description:
    "Twenty questions on Oxygen FM positioning, content pillars, commercial products, how to sell and capture leads, subsidiary collaboration, and compliance.",
  totalQuestions: questions.length,
  pointsPerQuestion: 1,
  passMark: 14,
  timeLimitMinutes: 15,
  questions,
};
