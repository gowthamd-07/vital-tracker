"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { weightEntries } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getWeightEntries() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return db
    .select()
    .from(weightEntries)
    .where(eq(weightEntries.userId, session.user.id))
    .orderBy(desc(weightEntries.entryDate));
}

export async function upsertWeightEntry(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const dateStr = String(formData.get("entryDate") ?? "");
  const weightRaw = String(formData.get("weightKg") ?? "");
  const bodyFatRaw = String(formData.get("bodyFatPercent") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const weightKg = parseFloat(weightRaw);
  if (!dateStr || Number.isNaN(weightKg) || weightKg <= 0) return;

  let bodyFatPercent: number | null = null;
  if (bodyFatRaw) {
    const bf = parseFloat(bodyFatRaw);
    if (Number.isNaN(bf) || bf < 0 || bf > 100) return;
    bodyFatPercent = bf;
  }

  await db
    .insert(weightEntries)
    .values({
      userId: session.user.id,
      entryDate: dateStr,
      weightKg,
      bodyFatPercent,
      notes,
    })
    .onConflictDoUpdate({
      target: [weightEntries.userId, weightEntries.entryDate],
      set: {
        weightKg: sql`excluded.weight_kg`,
        bodyFatPercent: sql`excluded.body_fat_percent`,
        notes: sql`excluded.notes`,
      },
    });

  revalidatePath("/dashboard");
  revalidatePath("/weight");
  revalidatePath("/data");
}

export async function deleteWeightEntry(id: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  await db
    .delete(weightEntries)
    .where(
      and(eq(weightEntries.id, id), eq(weightEntries.userId, session.user.id)),
    );

  revalidatePath("/dashboard");
  revalidatePath("/weight");
  revalidatePath("/data");
}
