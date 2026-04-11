export type Gender = "male" | "female";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary (little or no exercise)",
  light: "Lightly active (1–3 days/week)",
  moderate: "Moderately active (3–5 days/week)",
  active: "Very active (6–7 days/week)",
  very_active: "Extra active (intense daily + physical job)",
};

export function computeAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

/** Mifflin-St Jeor BMR (kcal/day) */
export function computeBmr(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === "male" ? base + 5 : base - 161;
}

/** Total Daily Energy Expenditure */
export function computeTdee(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * (ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.2);
}

/** Ideal weight range based on BMI 18.5–24.9 */
export function idealWeightRange(heightCm: number): {
  min: number;
  max: number;
} {
  const hm = heightCm / 100;
  return { min: 18.5 * hm * hm, max: 24.9 * hm * hm };
}

/** Daily calorie deficit to lose `kgToLose` in `daysLeft` days. ~7700 kcal per kg. */
export function dailyCalorieDeficit(
  kgToLose: number,
  daysLeft: number,
): number {
  if (daysLeft <= 0 || kgToLose <= 0) return 0;
  return (kgToLose * 7700) / daysLeft;
}

/** Recommended daily water intake in liters (≈ 0.033 × body weight in kg) */
export function waterIntake(weightKg: number): number {
  return weightKg * 0.033;
}

export interface HealthMetrics {
  age: number;
  bmr: number;
  tdee: number;
  idealWeight: { min: number; max: number };
  waterLiters: number;
  dailyDeficit: number | null;
  targetCalories: number | null;
}

export function computeHealthMetrics(opts: {
  weightKg: number;
  heightCm: number;
  dateOfBirth: string;
  gender: Gender;
  activityLevel: ActivityLevel;
  targetWeightKg?: number | null;
  daysLeft?: number | null;
}): HealthMetrics {
  const age = computeAge(opts.dateOfBirth);
  const bmr = computeBmr(opts.weightKg, opts.heightCm, age, opts.gender);
  const tdee = computeTdee(bmr, opts.activityLevel);
  const ideal = idealWeightRange(opts.heightCm);
  const water = waterIntake(opts.weightKg);

  let deficit: number | null = null;
  let targetCalories: number | null = null;
  if (
    opts.targetWeightKg != null &&
    opts.daysLeft != null &&
    opts.daysLeft > 0
  ) {
    const kgToLose = opts.weightKg - opts.targetWeightKg;
    if (kgToLose > 0) {
      deficit = dailyCalorieDeficit(kgToLose, opts.daysLeft);
      targetCalories = Math.max(1200, tdee - deficit);
    }
  }

  return { age, bmr, tdee, idealWeight: ideal, waterLiters: water, dailyDeficit: deficit, targetCalories };
}
