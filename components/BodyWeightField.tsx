'use client';

import { forwardRef, useState } from 'react';
import UnitToggle from '@/components/UnitToggle';
import { BODY_WEIGHT_WHY } from '@/lib/bodyWeightShared';
import { kgFromLbs, lbsFromKg, type WeightUnit } from '@/lib/weightUnit';

/**
 * The one body-weight input (join, Edit profile, the profile gate, the 6-week check-in):
 * lb/kg toggle (enter kg, store lb — same as the live cards) plus the plain "why we ask"
 * line. `value` / `onChange` are always lb, as a string, so each form keeps its existing
 * state and payload shape. docs/plans/PLAN_BODY_WEIGHT.md.
 */
const BodyWeightField = forwardRef<
  HTMLInputElement,
  {
    value: string;
    onChange: (lb: string) => void;
    label?: string;
    className?: string;
  }
>(function BodyWeightField({ value, onChange, label = 'Weight', className = 'mb-4' }, ref) {
  const [unit, setUnit] = useState<WeightUnit>('lb');
  // What the athlete sees in kg mode; converting on every keystroke would fight their typing.
  const [kgText, setKgText] = useState('');

  const toLbText = (kg: string) => {
    const n = Number(kg);
    return kg.trim() === '' || !Number.isFinite(n) ? kg : String(Math.round(lbsFromKg(n) * 10) / 10);
  };

  const switchUnit = (next: WeightUnit) => {
    if (next === unit) return;
    if (next === 'kg') {
      const n = Number(value);
      setKgText(value.trim() === '' || !Number.isFinite(n) ? '' : String(kgFromLbs(n)));
    }
    setUnit(next);
  };

  return (
    <div className={className}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className="block text-sm font-semibold text-[#f6f1e3]/65">
          {label} ({unit})
        </label>
        <UnitToggle unit={unit} onChange={switchUnit} context="body weight" />
      </div>
      <input
        ref={ref}
        type="number"
        inputMode="decimal"
        value={unit === 'kg' ? kgText : value}
        onChange={(event) => {
          if (unit === 'kg') {
            setKgText(event.target.value);
            onChange(toLbText(event.target.value));
          } else {
            onChange(event.target.value);
          }
        }}
        className="glass-input w-full"
      />
      <p className="mt-1 text-xs text-[#f6f1e3]/50">{BODY_WEIGHT_WHY}</p>
    </div>
  );
});

export default BodyWeightField;
