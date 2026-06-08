import CourseCard from "../components/CourseCard";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import courses from "../courses";

const getChapterCount = (courseList) =>
  courseList.reduce((total, course) => total + (course.chapters?.length ?? 0), 0);

const CoursesPage = () => {
  const chapterCount = getChapterCount(courses);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main>
        <section className="border-b border-slate-200 bg-gradient-to-br from-blue-50 via-white to-slate-50">
          <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8 lg:py-16">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
              Learning paths
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              All courses
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              Browse every course available on AKB. Open a course to see its
              chapters, then sign in to read and complete assessments.
            </p>
            <p className="mt-6 text-sm font-medium text-slate-500">
              {courses.length} course{courses.length !== 1 ? "s" : ""} ·{" "}
              {chapterCount} chapter{chapterCount !== 1 ? "s" : ""}
            </p>
          </div>
        </section>

        <section className="py-12 lg:py-16">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CoursesPage;
