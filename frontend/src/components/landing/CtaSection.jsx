import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const CtaSection = () => {
  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[32px] border border-slate-200/70 bg-white px-8 py-12 text-center shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)] sm:px-12 lg:px-16 lg:py-14 lg:text-left">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-linear-to-br from-blue-100/60 via-white to-white" />
          <div className="relative lg:flex lg:items-center lg:justify-between lg:gap-10">
            <div className="max-w-xl">
              <p className="inline-flex rounded-full bg-slate-100/80 px-3 py-1.5 text-xs font-medium leading-none text-slate-500">
                Staff access
              </p>
              <h2 className="mt-6 text-4xl font-bold leading-[1.05] tracking-[-0.045em] text-slate-950 sm:text-5xl">
                Ready to start learning?
              </h2>
              <p className="mt-6 text-base leading-8 text-slate-600 sm:text-lg">
                Sign in with your staff credentials or register for a new account
                to unlock full course content and assessments.
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:mt-0 lg:shrink-0">
              <Link
                to="/login"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_18px_rgba(15,23,42,0.1)] transition hover:bg-blue-600"
              >
                Staff login <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                to="/signup"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 px-4 text-sm font-semibold text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-white"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
