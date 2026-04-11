import { daysBetween } from "./dates";

export type GoalStatus =
  | "no_goal"
  | "no_data"
  | "reached"
  | "deadline_passed"
  | "on_track"
  | "behind"
  | "far_behind";

export interface GoalAnalysis {
  status: GoalStatus;
  message: string;
  sub: string;
  progressPct: number;
  remaining: number;
  daysLeft: number;
  requiredPerWeek: number | null;
}

// ── Motivational message pools ──────────────────────────────────────

const ON_TRACK_MSGS = [
  (n: string, r: string) => `${n}Crushing it! Only ${r} kg left — you're smashing it!`,
  (n: string, r: string) => `${n}Amazing pace! ${r} kg to go — Sachin-level consistency!`,
  (_n: string, r: string, tw: number) => `Right on track! ${tw} kg is well within reach. ${r} kg left.`,
  (n: string, r: string, _tw: number, dl: number) => `${n}Champion! ${r} kg in ${dl} days — you've got this covered.`,
  (n: string, r: string) => `${n}Brilliant pace! Only ${r} kg to go — keep it steady!`,
];

const BEHIND_MSGS = [
  (n: string, r: string) => `${n}Push a little harder! ${r} kg left — consistency is your superpower.`,
  (n: string, r: string, _tw: number, dl: number) => `${n}You've got this! ${r} kg in ${dl} days — skip that extra serving today.`,
  (n: string, _r: string, tw: number) => `${n}Stay focused! Every healthy choice is a step closer to ${tw} kg.`,
  (n: string, r: string) => `${n}Just ${r} kg to go! Think of it as a few biryani plates less.`,
  (n: string, r: string) => `${n}Keep pushing! ${r} kg left — you didn't come this far to only come this far.`,
];

const FAR_BEHIND_MSGS = [
  (n: string) => `${n}Every step counts! You've already started — that's half the battle won.`,
  (n: string) => `${n}Rome wasn't built in a day, neither was any six-pack. Keep going!`,
  (n: string) => `${n}Slow and steady wins the race — just like Dravid at the crease.`,
  (n: string) => `${n}The journey matters more than the destination. You're doing great!`,
  (n: string) => `${n}Don't give up! Even Dhoni finished matches in the last over.`,
];

// ── Streak motivational add-ons ──────────────────────────────────────

function streakNote(streak: number, firstName: string): string {
  if (streak <= 0) return "";
  if (streak >= 100) return ` ${firstName ? firstName + ", " : ""}100+ day streak — absolutely legendary!`;
  if (streak >= 30) return ` ${streak}-day streak — rock-solid discipline!`;
  if (streak >= 14) return ` ${streak}-day streak — you're on fire!`;
  if (streak >= 7) return ` ${streak}-day streak! One full week — fantastic!`;
  if (streak >= 3) return ` ${streak}-day streak going — keep the momentum!`;
  return "";
}

function gymNote(isGymDay: boolean, gymBurn: number): string {
  if (!isGymDay || gymBurn <= 0) return "";
  return ` Gym day — ~${gymBurn} extra kcal burned. Great work!`;
}

// ── Pick a message cycling by day ────────────────────────────────────

function pick<T>(pool: T[], seed: number): T {
  return pool[Math.abs(seed) % pool.length]!;
}

// ── Main analysis function ───────────────────────────────────────────

export function analyzeGoal(opts: {
  currentWeight: number | null;
  startWeight: number | null;
  targetWeight: number;
  targetDate: string;
  today: string;
  name?: string | null;
  isGymDay?: boolean;
  gymCalorieBurn?: number;
  bestStreak?: number;
  weightLogStreak?: number;
}): GoalAnalysis {
  const { currentWeight, startWeight, targetWeight, targetDate, today } = opts;
  const firstName = opts.name?.split(" ")[0] ?? "";
  const namePrefix = firstName ? `${firstName}, ` : "";
  const isGymDay = opts.isGymDay ?? false;
  const gymBurn = opts.gymCalorieBurn ?? 0;
  const bestStreak = opts.bestStreak ?? 0;
  const weightLogStreak = opts.weightLogStreak ?? 0;

  const daysLeft = daysBetween(today, targetDate);

  if (currentWeight == null) {
    return {
      status: "no_data",
      message: firstName
        ? `${firstName}, log your first weight to kickstart your goal!`
        : "Log your first weight to kickstart your goal!",
      sub: `Target: ${targetWeight} kg by ${targetDate}`,
      progressPct: 0,
      remaining: 0,
      daysLeft,
      requiredPerWeek: null,
    };
  }

  const totalToLose = (startWeight ?? currentWeight) - targetWeight;
  const lostSoFar = (startWeight ?? currentWeight) - currentWeight;
  const remaining = currentWeight - targetWeight;
  const isLosing = totalToLose > 0;

  const absRemaining = Math.abs(remaining);
  const absTotal = Math.abs(totalToLose);
  const progressPct =
    absTotal > 0
      ? Math.min(100, Math.max(0, Math.round(((isLosing ? lostSoFar : -lostSoFar) / absTotal) * 100)))
      : 0;

  const weeksLeft = Math.max(0, daysLeft / 7);
  const requiredPerWeek =
    weeksLeft > 0 ? Math.abs(remaining) / weeksLeft : null;

  const gym = gymNote(isGymDay, gymBurn);
  const streak = streakNote(bestStreak, firstName);
  const wlStreak = weightLogStreak >= 7
    ? ` ${weightLogStreak} days of consistent logging — data is power!`
    : "";

  const suffix = gym + streak + wlStreak;

  if (
    (isLosing && currentWeight <= targetWeight) ||
    (!isLosing && currentWeight >= targetWeight)
  ) {
    return {
      status: "reached",
      message: firstName
        ? `${firstName}, goal reached! You've earned a celebration!`
        : "Goal reached! You've earned a celebration!",
      sub: `Current: ${currentWeight.toFixed(1)} kg — Goal was ${targetWeight} kg. Well done!`,
      progressPct: 100,
      remaining: 0,
      daysLeft,
      requiredPerWeek: null,
    };
  }

  if (daysLeft < 0) {
    return {
      status: "deadline_passed",
      message: `${namePrefix}${absRemaining.toFixed(1)} kg away — deadline passed, but don't worry! Set a new date.`,
      sub: `Deadline was ${targetDate}. Reset and go again — never too late!`,
      progressPct,
      remaining: absRemaining,
      daysLeft: 0,
      requiredPerWeek: null,
    };
  }

  const r = absRemaining.toFixed(1);

  if (requiredPerWeek != null && requiredPerWeek <= 0.5) {
    const msgFn = pick(ON_TRACK_MSGS, daysLeft);
    return {
      status: "on_track",
      message: msgFn(namePrefix, r, targetWeight, daysLeft) + suffix,
      sub: `${r} kg to go · ${daysLeft} days left · ${requiredPerWeek.toFixed(2)} kg/week needed`,
      progressPct,
      remaining: absRemaining,
      daysLeft,
      requiredPerWeek,
    };
  }

  if (requiredPerWeek != null && requiredPerWeek <= 1.0) {
    const msgFn = pick(BEHIND_MSGS, daysLeft);
    return {
      status: "behind",
      message: msgFn(namePrefix, r, targetWeight, daysLeft) + suffix,
      sub: `${r} kg to go · ${daysLeft} days left · ${requiredPerWeek.toFixed(2)} kg/week needed`,
      progressPct,
      remaining: absRemaining,
      daysLeft,
      requiredPerWeek,
    };
  }

  const msgFn = pick(FAR_BEHIND_MSGS, daysLeft);
  return {
    status: "far_behind",
    message: msgFn(namePrefix) + suffix,
    sub: `${r} kg to go · ${daysLeft} days left`,
    progressPct,
    remaining: absRemaining,
    daysLeft,
    requiredPerWeek,
  };
}
