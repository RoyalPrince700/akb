import questions from "./questions";

export default {
  courseId: "project-advance",
  title: "Project ADVANCE — Assessment",
  description:
    "Fifteen questions on the Project ADVANCE growth agenda, points system, leaderboard structure, staff responsibilities, group leader role, and reward framework.",
  totalQuestions: questions.length,
  pointsPerQuestion: 1,
  passMark: 9,
  timeLimitMinutes: 10,
  questions,
};
