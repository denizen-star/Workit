'use client';

/** Required 1–5 star control used on finish and early-exit. */
export default function StarRating({
  value,
  onChange,
  label,
}: {
  value: number | null;
  onChange: (stars: number) => void;
  label: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold leading-relaxed text-[#f6f1e3]/80">{label}</p>
      <div className="mt-3 flex justify-center gap-1" role="radiogroup" aria-label="Workout score">
        {[1, 2, 3, 4, 5].map((stars) => {
          const on = value != null && stars <= value;
          return (
            <button
              key={stars}
              type="button"
              role="radio"
              aria-checked={value === stars}
              aria-label={stars + ' star' + (stars === 1 ? '' : 's')}
              onClick={() => onChange(stars)}
              className={`min-h-11 min-w-11 text-2xl leading-none ${
                on ? 'text-[#e8c547]' : 'text-white/25 hover:text-[#e8c547]/70'
              }`}
            >
              ★
            </button>
          );
        })}
      </div>
    </div>
  );
}
