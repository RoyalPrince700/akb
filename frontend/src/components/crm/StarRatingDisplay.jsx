import { Star } from "lucide-react";

const ratingOptions = [1, 2, 3, 4, 5];

const StarRatingDisplay = ({ value, size = 16, showValue = false }) => {
  if (value === null || value === undefined || value < 1) {
    return <span className="text-slate-400">-</span>;
  }

  const numericValue = Number(value);
  const filledCount = Math.round(numericValue);

  return (
    <span
      className="inline-flex items-center gap-1"
      title={showValue ? undefined : `${numericValue}/5`}
    >
      <span className="inline-flex items-center gap-0.5">
        {ratingOptions.map((rating) => (
          <Star
            key={rating}
            size={size}
            className={
              rating <= filledCount
                ? "fill-amber-400 text-amber-400"
                : "fill-none text-slate-300"
            }
          />
        ))}
      </span>
      {showValue ? (
        <span className="text-xs font-medium text-slate-600">{numericValue.toFixed(1)}</span>
      ) : null}
    </span>
  );
};

export default StarRatingDisplay;
