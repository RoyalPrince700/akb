const FeatureCard = ({ title, description }) => {
  return (
    <div className="group relative overflow-hidden rounded-[28px] border border-slate-200/70 bg-white p-7 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-slate-300/80 hover:shadow-[0_8px_20px_rgba(15,23,42,0.08),0_28px_70px_rgba(15,23,42,0.12)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-br from-blue-100/50 via-white to-white opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative">
        <div className="mb-8 h-1.5 w-10 rounded-full bg-linear-to-r from-blue-600 to-cyan-500" />
        <h3 className="text-xl font-bold tracking-tight text-slate-950">{title}</h3>
        <p className="mt-4 text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </div>
  );
};

export default FeatureCard;
