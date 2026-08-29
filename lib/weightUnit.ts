export type WeightUnit = 'lb' | 'kg';

const LB_PER_KG = 2.2046226218;
const STORAGE_KEY = 'workit_exercise_units';

export function normalizeWeightUnit(value: unknown): WeightUnit {
  return String(value || '').trim().toLowerCase() === 'kg' ? 'kg' : 'lb';
}

export function lbsFromKg(kg: number): number {
  return Math.round(kg * LB_PER_KG * 100) / 100;
}

export function kgFromLbs(lbs: number): number {
  return Math.round((lbs / LB_PER_KG) * 10) / 10;
}

export function readExerciseUnits(): Record<string, WeightUnit> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const out: Record<string, WeightUnit> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (key) out[key] = normalizeWeightUnit(value);
    }
    return out;
  } catch {
    return {};
  }
}

export function writeExerciseUnits(units: Record<string, WeightUnit>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(units));
}

export function unitForExercise(gymName: string, units: Record<string, WeightUnit>): WeightUnit {
  return units[gymName] || 'lb';
}
