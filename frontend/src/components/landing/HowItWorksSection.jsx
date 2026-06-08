import { howItWorksSteps } from "./landingContent";

const HowItWorksSection = () => {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 bg-slate-50 py-16 lg:py-20"
    >
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
            How it works
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Start learning in four simple steps
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Whether you are new staff or returning for a refresher, AKB guides
            you from discovery to measurable progress.
          </p>
        </div>

        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorksSteps.map((item) => (
            <li
              key={item.step}
              className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <span className="text-3xl font-bold text-blue-100">{item.step}</span>
              <h3 className="mt-3 text-lg font-semibold text-slate-950">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {item.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default HowItWorksSection;
