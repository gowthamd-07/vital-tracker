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

  if (!name) return;

  let heightCm: number | null = null;
  if (heightRaw) {
    const h = parseFloat(heightRaw);
    if (Number.isNaN(h) || h < 50 || h > 300) return;
    heightCm = h;
  }

  await db
    .update(users)
    .set({ name, heightCm })
    .where(eq(users.id, session.user.id));

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/weight");
}
