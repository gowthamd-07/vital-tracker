/** BMI = weight (kg) / height (m)² */
export function computeBmi(weightKg: number, heightCm: number): number {
  const h = heightCm / 100;
  if (h <= 0 || weightKg <= 0) return 0;
  return weightKg / (h * h);
}

export function bmiLabel(bmi: number): string {
  if (bmi <= 0) return "—";
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

export function formatBmi(bmi: number): string {
  if (bmi <= 0) return "—";
  return bmi.toFixed(1);
}
