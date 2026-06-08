import { Link } from "react-router-dom";

const HeroSection = ({ courseCount, chapterCount }) => {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-blue-50 via-white to-slate-50">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(29, 78, 216, 0.12) 0%, transparent 45%), radial-gradient(circle at 80% 0%, rgba(99, 102, 241, 0.1) 0%, transparent 40%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="inline-flex rounded-full bg-blue-100 px-4 py-1.5 text-sm font-semibold text-blue-800">
              Accessible Publishers Limited
            </p>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-[3.25rem] lg:leading-tight">
              The Accessible learning platform for our staff.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Browse courses, read chapters, and take assessments. Sign in with
              your staff ID to get started.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to="/courses"
                className="inline-flex items-center justify-center rounded-full bg-blue-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
              >
                Explore courses
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Staff login
              </Link>
            </div>

            <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-slate-200/80 pt-8 sm:max-w-lg">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Courses
                </dt>
                <dd className="mt-1 text-2xl font-bold text-slate-950">
                  {courseCount}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Chapters
                </dt>
                <dd className="mt-1 text-2xl font-bold text-slate-950">
                  {chapterCount}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Since
                </dt>
                <dd className="mt-1 text-2xl font-bold text-slate-950">1996</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-900/5 lg:p-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
              What you will find
            </p>
            <ul className="mt-6 space-y-4">
              {[
                "Courses on AI, finance, and Accessible Publishers history",
                "Chapter-by-chapter reading for signed-in staff",
                "Assessments with scores and progress tracking",
                "HR tools for staff records and learning results",
              ].map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-sm leading-6 text-slate-600"
                >
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8 rounded-2xl bg-slate-950 px-5 py-4 text-sm text-slate-300">
              <p className="font-medium text-white">New to AKB?</p>
              <p className="mt-1 leading-6">
                Register with your Accessible Publishers staff details or ask HR
                for access.
              </p>
              <Link
                to="/signup"
                className="mt-4 inline-flex text-sm font-semibold text-blue-300 hover:text-white"
              >
                Create account →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
