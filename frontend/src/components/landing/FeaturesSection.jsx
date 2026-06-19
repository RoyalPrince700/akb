import FeatureCard from "../FeatureCard";
import { platformFeatures } from "./landingContent";

const FeaturesSection = () => {
  return (
    <section id="features" className="relative scroll-mt-24 overflow-hidden border-y border-slate-200/70 bg-white py-20 lg:py-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-linear-to-br from-blue-100/40 via-white to-white" />
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="relative mx-auto max-w-2xl text-center">
          <p className="inline-flex rounded-full bg-slate-100/80 px-3 py-1.5 text-xs font-medium leading-none text-slate-500">
            Platform capabilities
          </p>
          <h2 className="mt-6 text-4xl font-bold leading-[1.05] tracking-[-0.045em] text-slate-950 sm:text-5xl">
            Everything your team needs to learn and grow
          </h2>
          <p className="mt-6 text-base leading-8 text-slate-600 sm:text-lg">
            From onboarding materials to assessments and HR reporting—AKH keeps
            company knowledge in one trusted place.
          </p>
        </div>

        <div className="relative mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
  );
};

export default FeaturesSection;
