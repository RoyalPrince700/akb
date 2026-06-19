import { howItWorksSteps } from "./landingContent";

const HowItWorksSection = () => {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 bg-slate-50 py-20 lg:py-24"
    >
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="inline-flex rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium leading-none text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            How it works
          </p>
          <h2 className="mt-6 text-4xl font-bold leading-[1.05] tracking-[-0.045em] text-slate-950 sm:text-5xl">
            Start learning in four simple steps
          </h2>
          <p className="mt-6 text-base leading-8 text-slate-600 sm:text-lg">
            Whether you are new staff or returning for a refresher, AKH guides
            you from discovery to measurable progress.
          </p>
        </div>

        <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
                <h3 className="mt-8 text-xl font-bold tracking-tight text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default HowItWorksSection;
