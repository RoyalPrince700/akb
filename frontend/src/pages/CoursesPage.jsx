import { BookOpen, ChevronRight } from "lucide-react";

import CourseCard from "../components/CourseCard";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import courses from "../courses";

const getChapterCount = (courseList) =>
  courseList.reduce((total, course) => total + (course.chapters?.length ?? 0), 0);

const HeroCoursePreview = () => (
  <div
    className="pointer-events-none relative hidden lg:block"
    aria-hidden="true"
  >
    <div className="absolute -left-6 top-8 h-44 w-44 rounded-full bg-blue-100/70 blur-3xl" />
    <div className="relative rotate-2 rounded-[32px] border border-slate-200/70 bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_24px_70px_rgba(15,23,42,0.14)]">
      <div className="absolute inset-x-0 top-0 h-40 rounded-t-[32px] bg-linear-to-br from-blue-100/70 via-white to-white" />

      <div className="relative">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
          <BookOpen className="h-[18px] w-[18px] stroke-[1.8]" />
        </div>

        <p className="mt-6 inline-flex rounded-full bg-slate-100/70 px-2.5 py-1 text-xs font-medium leading-none text-slate-500">
          Professional Development
        </p>
        <h2 className="mt-5 text-[1.85rem] font-bold leading-[1.08] tracking-[-0.035em] text-slate-950">
          Using Artificial Intelligence at Work
        </h2>
        <p className="mt-10 text-[13px] font-medium leading-5 text-slate-500">
          5 lessons • 40 mins • Beginner
        </p>

        <div className="mt-14">
          <div className="flex justify-end">
            <p className="text-sm font-semibold tabular-nums text-slate-900">
              72%
            </p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200/80">
            <div className="h-full w-[72%] rounded-full bg-linear-to-r from-blue-600 to-cyan-500" />
          </div>
          <p className="mt-4 text-[13px] font-medium leading-5 text-slate-500">
            4 of 5 lessons completed
          </p>

          <div className="mt-10 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-3.5 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_18px_rgba(15,23,42,0.1)]">
            <span>Continue Learning</span>
            <ChevronRight className="h-3.5 w-3.5 stroke-[2.2]" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

const CoursesPage = () => {
  const chapterCount = getChapterCount(courses);
  const categoryCount = new Set(courses.map((course) => course.category)).size;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main>
        <section className="relative overflow-hidden border-b border-slate-200/70 bg-white">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-linear-to-br from-blue-100/60 via-white to-slate-50" />
          <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-blue-100/50 blur-3xl" />

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8 lg:py-20">
            <div className="max-w-3xl">
              <p className="inline-flex rounded-full bg-slate-100/80 px-3 py-1.5 text-xs font-medium leading-none text-slate-500">
                Learning paths
              </p>
              <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-6xl">
                Courses built for focused professional growth.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Browse every course available on AKH, continue your learning,
                and track progress across concise staff development paths.
              </p>

              <div className="mt-10 flex flex-wrap gap-3 text-sm font-medium text-slate-600">
                <span className="rounded-full border border-slate-200/80 bg-white/80 px-3.5 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                  {courses.length} course{courses.length !== 1 ? "s" : ""}
                </span>
                <span className="rounded-full border border-slate-200/80 bg-white/80 px-3.5 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                  {chapterCount} lesson{chapterCount !== 1 ? "s" : ""}
                </span>
                <span className="rounded-full border border-slate-200/80 bg-white/80 px-3.5 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                  {categoryCount} categor{categoryCount === 1 ? "y" : "ies"}
                </span>
              </div>
            </div>

            <HeroCoursePreview />
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
