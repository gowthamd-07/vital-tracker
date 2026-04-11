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

export function analyzeGoal(opts: {
  currentWeight: number | null;
  startWeight: number | null;
  targetWeight: number;
  targetDate: string;
  today: string;
}): GoalAnalysis {
  const { currentWeight, startWeight, targetWeight, targetDate, today } = opts;

  const daysLeft = daysBetween(today, targetDate);

  if (currentWeight == null) {
    return {
      status: "no_data",
      message: "Log your first weight to start tracking your goal!",
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

  if (
    (isLosing && currentWeight <= targetWeight) ||
    (!isLosing && currentWeight >= targetWeight)
  ) {
    return {
      status: "reached",
      message: "You reached your target weight! Incredible work!",
      sub: `Current: ${currentWeight.toFixed(1)} kg — Goal was ${targetWeight} kg`,
      progressPct: 100,
      remaining: 0,
      daysLeft,
      requiredPerWeek: null,
    };
  }

  if (daysLeft < 0) {
    return {
      status: "deadline_passed",
      message: `You're ${absRemaining.toFixed(1)} kg away. Update your target date to keep going!`,
      sub: `Deadline was ${targetDate}. Don't give up — set a new one.`,
      progressPct,
      remaining: absRemaining,
      daysLeft: 0,
      requiredPerWeek: null,
    };
  }

  if (requiredPerWeek != null && requiredPerWeek <= 0.5) {
    const msgs = [
      `Crushing it! Only ${absRemaining.toFixed(1)} kg to go — you've got this!`,
      `Amazing pace! ${absRemaining.toFixed(1)} kg left and ${daysLeft} days to spare.`,
      `Right on track! At this pace, ${targetWeight} kg is well within reach.`,
    ];
    return {
      status: "on_track",
      message: msgs[daysLeft % msgs.length]!,
      sub: `${absRemaining.toFixed(1)} kg to go · ${daysLeft} days left · ${requiredPerWeek.toFixed(2)} kg/week needed`,
      progressPct,
      remaining: absRemaining,
      daysLeft,
      requiredPerWeek,
    };
  }

  if (requiredPerWeek != null && requiredPerWeek <= 1.0) {
    const msgs = [
      `Keep pushing! ${absRemaining.toFixed(1)} kg left — consistency is key.`,
      `You can do this! ${absRemaining.toFixed(1)} kg in ${daysLeft} days is totally doable.`,
      `Stay focused! Every healthy choice moves you closer to ${targetWeight} kg.`,
    ];
    return {
      status: "behind",
      message: msgs[daysLeft % msgs.length]!,
      sub: `${absRemaining.toFixed(1)} kg to go · ${daysLeft} days left · ${requiredPerWeek.toFixed(2)} kg/week needed`,
      progressPct,
      remaining: absRemaining,
      daysLeft,
      requiredPerWeek,
    };
  }

  return {
    status: "far_behind",
    message: `Every step counts! You've already made progress — don't stop now.`,
    sub: `${absRemaining.toFixed(1)} kg to go · ${daysLeft} days left`,
    progressPct,
    remaining: absRemaining,
    daysLeft,
    requiredPerWeek,
  };
}
