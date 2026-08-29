'use client';

import type { WeightUnit } from '@/lib/weightUnit';

export default function UnitToggle({
  unit,
  onChange,
  context,
}: {
  unit: WeightUnit;
  onChange: (unit: WeightUnit) => void;
  context?: string | null;
}) {
  return (
    <div
      role="group"
      aria-label={context ? `Weight unit for ${context}` : 'Weight unit'}
      className="inline-flex shrink-0 rounded-full border border-white/15 bg-black/35 p-0.5"
    >
      {(['lb', 'kg'] as const).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={`rounded-full px-2 py-0.5 text-[11px] font-black uppercase tracking-wide ${
            unit === value ? 'bg-[#e8c547] text-[#1a1404]' : 'text-[#f6f1e3]/55'
          }`}
        >
          {value === 'lb' ? 'Lb' : 'Kg'}
        </button>
      ))}
    </div>
  );
}
