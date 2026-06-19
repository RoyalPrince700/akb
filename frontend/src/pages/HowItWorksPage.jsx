import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

import Footer from "../components/Footer";
import CtaSection from "../components/landing/CtaSection";
import { gettingStartedTips, howItWorksSteps } from "../components/landing/landingContent";
import Navbar from "../components/Navbar";

const HowItWorksPage = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main>
        <section className="relative overflow-hidden border-b border-slate-200/70 bg-white">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-linear-to-br from-blue-100/60 via-white to-slate-50" />
          <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-blue-100/50 blur-3xl" />

          <div className="relative mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-20">
            <div className="max-w-3xl">
              <p className="inline-flex rounded-full bg-slate-100/80 px-3 py-1.5 text-xs font-medium leading-none text-slate-500">
                How it works
              </p>
              <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-6xl">
                Start learning in four simple steps.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Whether you are new staff or returning for a refresher, AKH guides
                you from discovery to measurable progress with a calm, structured flow.
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/signup"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_18px_rgba(15,23,42,0.1)] transition hover:bg-blue-600"
                >
                  Create account <ChevronRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  to="/features"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 px-4 text-sm font-semibold text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-white"
                >
                  View platform features
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200/70 bg-slate-50 py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {howItWorksSteps.map((item) => (
                <li
                  key={item.step}
                  className="group relative overflow-hidden rounded-[28px] border border-slate-200/70 bg-white p-7 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-slate-300/80 hover:shadow-[0_8px_20px_rgba(15,23,42,0.08),0_28px_70px_rgba(15,23,42,0.12)]"
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-br from-blue-100/50 via-white to-white opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-sm font-bold text-blue-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                      {item.step}
                    </span>
                    <h2 className="mt-8 text-xl font-bold tracking-tight text-slate-950">
                      {item.title}
                    </h2>
                    <p className="mt-4 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="bg-white py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="inline-flex rounded-full bg-slate-100/80 px-3 py-1.5 text-xs font-medium leading-none text-slate-500">
                Getting started
              </p>
              <h2 className="mt-6 text-4xl font-bold leading-[1.05] tracking-[-0.045em] text-slate-950 sm:text-5xl">
                Practical tips for your first visit
              </h2>
              <p className="mt-6 text-base leading-8 text-slate-600 sm:text-lg">
                New to AKH? These quick pointers mirror what staff see on the home
                page and help you get productive faster.
              </p>
            </div>

            <div className="mt-14 grid gap-5 sm:grid-cols-2">
              {gettingStartedTips.map((tip) => (
                <article
                  key={tip.title}
                  className="rounded-[28px] border border-slate-200/70 bg-slate-50 p-7 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]"
                >
                  <h3 className="text-xl font-bold tracking-tight text-slate-950">
                    {tip.title}
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-slate-600">{tip.description}</p>
                </article>
              ))}
            </div>

            <div className="mt-14 rounded-[32px] border border-slate-200/70 bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)] lg:flex lg:items-center lg:justify-between lg:gap-10">
              <div className="max-w-xl">
                <h3 className="text-2xl font-bold tracking-tight text-slate-950">
                  New to AKH?
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Register with your Accessible Publishers staff details or ask HR
                  for access. You can preview courses before signing in.
                </p>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:shrink-0">
                <Link
                  to="/courses"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_18px_rgba(15,23,42,0.1)] transition hover:bg-blue-600"
                >
                  Browse courses <ChevronRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200/80 bg-white px-4 text-sm font-semibold text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-white"
                >
                  Staff login
                </Link>
              </div>
            </div>
          </div>
        </section>

        <CtaSection />
      </main>

      <Footer />
    </div>
  );
};

export default HowItWorksPage;
