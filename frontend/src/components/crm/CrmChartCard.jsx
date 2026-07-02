const CrmChartCard = ({
  title,
  description,
  children,
  empty = false,
  emptyMessage = "No data available.",
  heightClassName = "h-72",
}) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-emerald-900/5">
    <h2 className="text-xl font-bold text-slate-950">{title}</h2>
    {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
    <div className={`mt-5 ${heightClassName}`}>
      {empty ? (
        <p className="flex h-full items-center justify-center text-sm text-slate-600">
          {emptyMessage}
        </p>
      ) : (
        children
      )}
    </div>
  </div>
);

export default CrmChartCard;
