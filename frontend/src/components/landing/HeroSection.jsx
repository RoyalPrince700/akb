import { BookOpen, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const LearningPreview = () => (
  <div className="pointer-events-none relative hidden lg:block" aria-hidden="true">
    <div className="absolute -left-8 top-10 h-48 w-48 rounded-full bg-blue-100/70 blur-3xl" />
    <div className="relative rotate-2 rounded-[32px] border border-slate-200/70 bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_24px_70px_rgba(15,23,42,0.14)]">
      <div className="absolute inset-x-0 top-0 h-40 rounded-t-[32px] bg-linear-to-br from-blue-100/70 via-white to-white" />

      <div className="relative">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
          <BookOpen className="h-[18px] w-[18px] stroke-[1.8]" />
        </div>
        <p className="mt-6 inline-flex rounded-full bg-slate-100/70 px-2.5 py-1 text-xs font-medium leading-none text-slate-500">
          Staff Development
        </p>
        <h2 className="mt-5 text-[1.85rem] font-bold leading-[1.08] tracking-[-0.035em] text-slate-950">
          Learn, assess, and keep growing at work.
        </h2>
        <p className="mt-10 text-[13px] font-medium leading-5 text-slate-500">
          AI, finance, HR, service, and company knowledge
        </p>

        <div className="mt-14">
          <div className="flex justify-end">
            <p className="text-sm font-semibold tabular-nums text-slate-900">
              64%
            </p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200/80">
            <div className="h-full w-[64%] rounded-full bg-linear-to-r from-blue-600 to-cyan-500" />
          </div>
          <p className="mt-4 text-[13px] font-medium leading-5 text-slate-500">
            18 lessons completed this month
          </p>
        </div>
      </div>
    </div>
  </div>
);

const HeroSection = ({ courseCount, chapterCount }) => {
  return (
    <section className="relative overflow-hidden border-b border-slate-200/70 bg-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-linear-to-br from-blue-100/60 via-white to-slate-50" />
      <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-blue-100/50 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-24 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center lg:gap-16 lg:px-8 lg:py-24">
        <div className="max-w-3xl">
          <p className="inline-flex rounded-full bg-slate-100/80 px-3 py-1.5 text-xs font-medium leading-none text-slate-500">
            Accessible Publishers Limited
          </p>
          <h1 className="mt-6 text-5xl font-bold leading-[1.02] tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-7xl">
            A focused learning hub for Accessible staff.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            Browse courses, read chapters, take assessments, and track your
            development with a calm workspace built for daily learning.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/courses"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_18px_rgba(15,23,42,0.1)] transition hover:bg-blue-600"
            >
              Explore courses <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              to="/login"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 px-4 text-sm font-semibold text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-white"
            >
              Staff login
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-3 text-sm font-medium text-slate-600">
            <span className="rounded-full border border-slate-200/80 bg-white/80 px-3.5 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              {courseCount} course{courseCount !== 1 ? "s" : ""}
            </span>
            <span className="rounded-full border border-slate-200/80 bg-white/80 px-3.5 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              {chapterCount} lesson{chapterCount !== 1 ? "s" : ""}
            </span>
            <span className="rounded-full border border-slate-200/80 bg-white/80 px-3.5 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              Since 1996
            </span>
          </div>
        </div>

        <LearningPreview />

        <div className="mx-auto mt-24 max-w-5xl border-t border-slate-100 pt-16 sm:mt-28 sm:pt-20 lg:col-span-2 lg:mt-32 lg:pt-24">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-24">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                What you will find
              </h2>
              <ul className="mt-8 space-y-6">
                {[
                  "Courses on AI, finance, and Accessible Publishers history",
                  "Chapter-by-chapter reading for signed-in staff",
                  "Assessments with scores and progress tracking",
                  "HR tools for staff records and learning results",
                ].map((item) => (
                  <li key={item} className="flex gap-4 text-base leading-7 text-slate-600">
                    <span
                      className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col justify-center">
              <dl className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3 lg:grid-cols-2">
                <div className="flex flex-col-reverse gap-y-2">
                  <dt className="text-xs font-medium text-slate-500">
                    Courses
                  </dt>
                  <dd className="text-4xl font-bold tracking-[-0.04em] text-slate-950">
                    {courseCount}
                  </dd>
                </div>
                <div className="flex flex-col-reverse gap-y-2">
                  <dt className="text-xs font-medium text-slate-500">
                    Lessons
                  </dt>
                  <dd className="text-4xl font-bold tracking-[-0.04em] text-slate-950">
                    {chapterCount}
                  </dd>
                </div>
                <div className="flex flex-col-reverse gap-y-2">
                  <dt className="text-xs font-medium text-slate-500">
                    Since
                  </dt>
                  <dd className="text-4xl font-bold tracking-[-0.04em] text-slate-950">
                    1996
                  </dd>
                </div>
              </dl>

              <div className="mt-12 rounded-[28px] border border-slate-200/70 bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]">
                <h3 className="text-sm font-semibold text-slate-950">New to AKH?</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Register with your Accessible Publishers staff details or ask HR
                  for access.
                </p>
                <Link
                  to="/signup"
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-950 transition hover:text-blue-700"
                >
                  Create account <ChevronRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
