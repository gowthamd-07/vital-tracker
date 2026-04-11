"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getProfile() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      heightCm: users.heightCm,
      targetWeightKg: users.targetWeightKg,
      targetDate: users.targetDate,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  return row ?? null;
}

export async function updateProfile(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const name = String(formData.get("name") ?? "").trim();
  const heightRaw = String(formData.get("heightCm") ?? "").trim();
  const targetWeightRaw = String(formData.get("targetWeightKg") ?? "").trim();
  const targetDateRaw = String(formData.get("targetDate") ?? "").trim();

  if (!name) return;

  let heightCm: number | null = null;
  if (heightRaw) {
    const h = parseFloat(heightRaw);
    if (Number.isNaN(h) || h < 50 || h > 300) return;
    heightCm = h;
  }

  let targetWeightKg: number | null = null;
  if (targetWeightRaw) {
    const tw = parseFloat(targetWeightRaw);
    if (Number.isNaN(tw) || tw < 20 || tw > 400) return;
    targetWeightKg = tw;
  }

  const targetDate: string | null = targetDateRaw || null;

  await db
    .update(users)
    .set({ name, heightCm, targetWeightKg, targetDate })
    .where(eq(users.id, session.user.id));

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/weight");
}
