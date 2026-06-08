import courses from "../../courses";
import CtaSection from "./CtaSection";
import CoursesSection from "./CoursesSection";
import FeaturesSection from "./FeaturesSection";
import HeroSection from "./HeroSection";
import HowItWorksSection from "./HowItWorksSection";

const getChapterCount = (courseList) =>
  courseList.reduce((total, course) => total + (course.chapters?.length ?? 0), 0);

const LandingPage = () => {
  const chapterCount = getChapterCount(courses);

  return (
    <>
      <HeroSection courseCount={courses.length} chapterCount={chapterCount} />
      <CoursesSection courses={courses} />
      <FeaturesSection />
      <HowItWorksSection />
      <CtaSection />
    </>
  );
};

export default LandingPage;
