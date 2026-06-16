import { Link } from "react-router-dom";

const HeroSection = ({ courseCount, chapterCount }) => {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* Subtle, high-quality abstract gradient background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        aria-hidden="true"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 0%, rgba(241, 245, 249, 1) 0%, rgba(255, 255, 255, 0) 70%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
            Accessible Publishers Limited
          </p>
          <h1 className="mt-6 text-5xl font-bold tracking-tighter text-slate-950 sm:text-7xl">
            The Accessible learning platform
          </h1>
          <p className="mx-auto mt-6 max-w-[540px] text-lg leading-8 text-slate-600">
            Browse courses, read chapters, and take assessments. Sign in with
            your staff ID to get started.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/courses"
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Explore courses
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-8 py-3.5 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Staff login
            </Link>
          </div>
        </div>

        {/* Stats and Features moved down */}
        <div className="mx-auto mt-24 max-w-5xl border-t border-slate-100 pt-16 sm:mt-32 sm:pt-24 lg:mt-40 lg:pt-32">
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
                  <li
                    key={item}
                    className="flex gap-4 text-base leading-7 text-slate-600"
                  >
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
                  <dt className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Courses
                  </dt>
                  <dd className="text-4xl font-bold tracking-tight text-slate-950">
                    {courseCount}
                  </dd>
                </div>
                <div className="flex flex-col-reverse gap-y-2">
                  <dt className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Chapters
                  </dt>
                  <dd className="text-4xl font-bold tracking-tight text-slate-950">
                    {chapterCount}
                  </dd>
                </div>
                <div className="flex flex-col-reverse gap-y-2">
                  <dt className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Since
                  </dt>
                  <dd className="text-4xl font-bold tracking-tight text-slate-950">
                    1996
                  </dd>
                </div>
              </dl>

              <div className="mt-12 rounded-2xl bg-slate-50 p-8">
                <h3 className="text-sm font-semibold text-slate-950">New to AKH?</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Register with your Accessible Publishers staff details or ask HR
                  for access.
                </p>
                <Link
                  to="/signup"
                  className="mt-4 inline-flex text-sm font-semibold text-slate-950 hover:text-slate-700"
                >
                  Create account <span aria-hidden="true" className="ml-1">&rarr;</span>
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
