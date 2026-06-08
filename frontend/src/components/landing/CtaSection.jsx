import { Link } from "react-router-dom";

const CtaSection = () => {
  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 to-indigo-800 px-8 py-12 text-center shadow-lg sm:px-12 lg:px-16 lg:py-14 lg:text-left">
          <div className="lg:flex lg:items-center lg:justify-between lg:gap-10">
            <div className="max-w-xl">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to start learning?
              </h2>
              <p className="mt-4 text-lg leading-8 text-blue-100">
                Sign in with your staff credentials or register for a new account
                to unlock full course content and assessments.
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:mt-0 lg:shrink-0">
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-blue-800 transition hover:bg-blue-50"
              >
                Staff login
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
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
