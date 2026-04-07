"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { habitCompletions, habits } from "@/db/schema";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { computeStreak, longestStreak } from "@/lib/streaks";

export type HabitWithStreak = {
  id: string;
  name: string;
  color: string;
  currentStreak: number;
  bestStreak: number;
  createdAt: Date;
};

export async function getHabitsWithCompletions(daysBack: number) {
  const session = await auth();
  if (!session?.user?.id)
    return { habits: [] as HabitWithStreak[], completions: [] as { habitId: string; completedDate: string }[] };

  const habitRows = await db
    .select()
    .from(habits)
    .where(eq(habits.userId, session.user.id))
    .orderBy(desc(habits.createdAt));

  if (habitRows.length === 0) {
    return { habits: [] as HabitWithStreak[], completions: [] };
  }

  const habitIds = habitRows.map((h) => h.id);

  // For the grid, restrict to `daysBack` days
  const from = new Date();
  from.setDate(from.getDate() - daysBack);
  const fromStr = from.toISOString().slice(0, 10);

  const recentCompletions = await db
    .select()
    .from(habitCompletions)
    .where(
      and(
        eq(habitCompletions.userId, session.user.id),
        inArray(habitCompletions.habitId, habitIds),
        gte(habitCompletions.completedDate, fromStr),
      ),
    );

  // For streaks, fetch ALL completions per habit
  const allCompletions = await db
    .select({ habitId: habitCompletions.habitId, completedDate: habitCompletions.completedDate })
    .from(habitCompletions)
    .where(
      and(
        eq(habitCompletions.userId, session.user.id),
        inArray(habitCompletions.habitId, habitIds),
      ),
    );

  const byHabit = new Map<string, string[]>();
  for (const c of allCompletions) {
    const list = byHabit.get(c.habitId) ?? [];
    list.push(c.completedDate);
    byHabit.set(c.habitId, list);
  }

  const habitsWithStreaks: HabitWithStreak[] = habitRows.map((h) => {
    const dates = byHabit.get(h.id) ?? [];
    const dateSet = new Set(dates);
    return {
      id: h.id,
      name: h.name,
      color: h.color,
      currentStreak: computeStreak(dateSet),
      bestStreak: longestStreak(dates),
      createdAt: h.createdAt,
    };
  });

  return {
    habits: habitsWithStreaks,
    completions: recentCompletions.map((c) => ({
      habitId: c.habitId,
      completedDate: c.completedDate,
    })),
  };
}

export async function createHabit(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "#6366f1").trim() || "#6366f1";
  if (!name) return;

  await db.insert(habits).values({ userId: session.user.id, name, color });

  revalidatePath("/habits");
  revalidatePath("/dashboard");
  revalidatePath("/data");
}

export async function deleteHabit(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  await db
    .delete(habits)
    .where(and(eq(habits.id, id), eq(habits.userId, session.user.id)));

  revalidatePath("/habits");
  revalidatePath("/dashboard");
  revalidatePath("/data");
}

export async function toggleHabitFormAction(formData: FormData): Promise<void> {
  const habitId = String(formData.get("habitId") ?? "");
  const completedDate = String(formData.get("completedDate") ?? "");
  if (!habitId || !completedDate) return;
  await toggleHabitCompletion(habitId, completedDate);
}

export async function toggleHabitCompletion(
  habitId: string,
  completedDate: string,
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const [habit] = await db
    .select()
    .from(habits)
    .where(and(eq(habits.id, habitId), eq(habits.userId, session.user.id)))
    .limit(1);
  if (!habit) return;

  const [existing] = await db
    .select()
    .from(habitCompletions)
    .where(
      and(
        eq(habitCompletions.habitId, habitId),
        eq(habitCompletions.completedDate, completedDate),
      ),
    )
    .limit(1);

  if (existing) {
    await db.delete(habitCompletions).where(eq(habitCompletions.id, existing.id));
  } else {
    await db.insert(habitCompletions).values({
      habitId,
      userId: session.user.id,
      completedDate,
    });
  }

  revalidatePath("/habits");
  revalidatePath("/dashboard");
  revalidatePath("/data");
}
