"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { habitCompletions, habits } from "@/db/schema";
import { and, asc, eq, inArray } from "drizzle-orm";
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

export async function getHabitsWithCompletions() {
  const session = await auth();
  if (!session?.user?.id)
    return { habits: [] as HabitWithStreak[], completions: [] as { habitId: string; completedDate: string }[] };

  const habitRows = await db
    .select()
    .from(habits)
    .where(eq(habits.userId, session.user.id))
    .orderBy(asc(habits.color), asc(habits.name));

  if (habitRows.length === 0) {
    return { habits: [] as HabitWithStreak[], completions: [] };
  }

  const habitIds = habitRows.map((h) => h.id);

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
    completions: allCompletions.map((c) => ({
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

  const deleted = await db
    .delete(habitCompletions)
    .where(
      and(
        eq(habitCompletions.habitId, habitId),
        eq(habitCompletions.userId, session.user.id),
        eq(habitCompletions.completedDate, completedDate),
      ),
    )
    .returning({ id: habitCompletions.id });

  if (deleted.length === 0) {
    const [habit] = await db
      .select({ id: habits.id })
      .from(habits)
      .where(and(eq(habits.id, habitId), eq(habits.userId, session.user.id)))
      .limit(1);

    if (habit) {
      await db.insert(habitCompletions).values({
        habitId,
        userId: session.user.id,
        completedDate,
      });
    }
  }

  revalidatePath("/habits");
  revalidatePath("/dashboard");
}
