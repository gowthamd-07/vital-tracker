"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { habitCompletions, weightEntries } from "@/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type CleanupResult = {
  weightsDeleted: number;
  completionsDeleted: number;
};

export async function cleanupData(
  fromDate: string,
  toDate: string,
  targets: ("weights" | "habits")[],
): Promise<CleanupResult> {
  const session = await auth();
  if (!session?.user?.id) return { weightsDeleted: 0, completionsDeleted: 0 };

  if (!fromDate || !toDate || fromDate > toDate) {
    return { weightsDeleted: 0, completionsDeleted: 0 };
  }

  let weightsDeleted = 0;
  let completionsDeleted = 0;

  if (targets.includes("weights")) {
    const result = await db
      .delete(weightEntries)
      .where(
        and(
          eq(weightEntries.userId, session.user.id),
          gte(weightEntries.entryDate, fromDate),
          lte(weightEntries.entryDate, toDate),
        ),
      )
      .returning({ id: weightEntries.id });
    weightsDeleted = result.length;
  }

  if (targets.includes("habits")) {
    const result = await db
      .delete(habitCompletions)
      .where(
        and(
          eq(habitCompletions.userId, session.user.id),
          gte(habitCompletions.completedDate, fromDate),
          lte(habitCompletions.completedDate, toDate),
        ),
      )
      .returning({ id: habitCompletions.id });
    completionsDeleted = result.length;
  }

  revalidatePath("/dashboard");
  revalidatePath("/weight");
  revalidatePath("/habits");
  revalidatePath("/data");

  return { weightsDeleted, completionsDeleted };
}
