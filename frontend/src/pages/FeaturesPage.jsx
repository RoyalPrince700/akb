import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

import Footer from "../components/Footer";
import FeatureCard from "../components/FeatureCard";
import CtaSection from "../components/landing/CtaSection";
import { learningHighlights, platformFeatures, roleFeatures } from "../components/landing/landingContent";
import Navbar from "../components/Navbar";

const FeaturesPage = () => {
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
                Platform capabilities
              </p>
              <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-6xl">
                Everything your team needs to learn and grow.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                From onboarding materials to assessments and HR reporting—AKH keeps
                company knowledge in one trusted place for Accessible Publishers staff.
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/courses"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_18px_rgba(15,23,42,0.1)] transition hover:bg-blue-600"
                >
                  Explore courses <ChevronRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  to="/how-it-works"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 px-4 text-sm font-semibold text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:bg-white"
                >
                  See how it works
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-b border-slate-200/70 bg-white py-20 lg:py-24">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-linear-to-br from-blue-100/40 via-white to-white" />
          <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {platformFeatures.map((feature) => (
                <FeatureCard
                  key={feature.title}
                  title={feature.title}
                  description={feature.description}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200/70 bg-slate-50 py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-24">
              <div>
                <p className="inline-flex rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium leading-none text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                  What you will find
                </p>
                <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  A calm workspace built for daily learning
                </h2>
                <ul className="mt-8 space-y-6">
                  {learningHighlights.map((item) => (
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

              <div className="rounded-[32px] border border-slate-200/70 bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]">
                <p className="inline-flex rounded-full bg-slate-100/80 px-3 py-1.5 text-xs font-medium leading-none text-slate-500">
                  For progressive minds
                </p>
                <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  Trusted by Accessible staff since 1996
                </h2>
                <p className="mt-6 text-base leading-8 text-slate-600">
                  Accessible Knowledge Base helps staff at Accessible Publishers
                  Limited learn company history, products, and workplace skills in
                  one organized platform—designed for focused reading, not clutter.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-20 lg:py-24">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="inline-flex rounded-full bg-slate-100/80 px-3 py-1.5 text-xs font-medium leading-none text-slate-500">
                Built for every role
              </p>
              <h2 className="mt-6 text-4xl font-bold leading-[1.05] tracking-[-0.045em] text-slate-950 sm:text-5xl">
                One platform, tailored experiences
              </h2>
              <p className="mt-6 text-base leading-8 text-slate-600 sm:text-lg">
                Staff, HR, and admin users each get the tools they need without
                leaving the same learning environment.
              </p>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {roleFeatures.map((item) => (
                <div
                  key={item.role}
                  className="group relative overflow-hidden rounded-[28px] border border-slate-200/70 bg-white p-7 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-slate-300/80 hover:shadow-[0_8px_20px_rgba(15,23,42,0.08),0_28px_70px_rgba(15,23,42,0.12)]"
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-br from-blue-100/50 via-white to-white opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative">
                    <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
                      {item.role}
                    </p>
                    <p className="mt-4 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <CtaSection />
      </main>

      <Footer />
    </div>
  );
};

export default FeaturesPage;
