const gradeAssessment = (assessment, submittedAnswers) => {
  const questionIds = Object.keys(assessment.answers);
  const gradedAnswers = questionIds.map((questionId) => {
    const selectedAnswer = submittedAnswers[questionId];
    const correctAnswer = assessment.answers[questionId];
    const isCorrect =
      typeof selectedAnswer === "string" &&
      selectedAnswer.trim() === correctAnswer.trim();

    return {
      questionId,
      selectedAnswer: selectedAnswer || "",
      isCorrect,
    };
  });

  const score = gradedAnswers.filter((answer) => answer.isCorrect).length;
  const totalQuestions = assessment.totalQuestions;
  const percentage = Math.round((score / totalQuestions) * 100);
  const passed = score >= assessment.passMark;

  return {
    answers: gradedAnswers,
    score,
    totalQuestions,
    percentage,
    passed,
  };
};

module.exports = gradeAssessment;
