import FeatureCard from "../FeatureCard";
import { platformFeatures } from "./landingContent";

const FeaturesSection = () => {
  return (
    <section id="features" className="scroll-mt-24 border-y border-slate-200 bg-white py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
            Platform capabilities
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Everything your team needs to learn and grow
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            From onboarding materials to assessments and HR reporting—AKB keeps
            company knowledge in one trusted place.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
