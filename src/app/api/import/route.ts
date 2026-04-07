import { auth } from "@/auth";
import { db } from "@/db";
import { habitCompletions, habits, weightEntries } from "@/db/schema";
import { parseCsv } from "@/lib/csv";
import { and, eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const kind = String(form.get("kind") ?? "");
  const file = form.get("file");

  if (!file || !(file instanceof File)) {
    return Response.json({ error: "Missing file." }, { status: 400 });
  }

  const text = await file.text();
  const rows = parseCsv(text);
  if (rows.length < 2) {
    return Response.json(
      { error: "CSV must include a header row and at least one data row." },
      { status: 400 },
    );
  }

  const header = rows[0]!.map((h) => h.trim().toLowerCase());
  const dataRows = rows.slice(1);

  if (kind === "weights") {
    return importWeights(session.user.id, header, dataRows);
  }
  if (kind === "habits") {
    return importHabits(session.user.id, header, dataRows);
  }

  return Response.json({ error: "Invalid import kind." }, { status: 400 });
}

function idx(header: string[], ...names: string[]): number {
  for (const n of names) {
    const i = header.indexOf(n);
    if (i >= 0) return i;
  }
  return -1;
}

async function importWeights(
  userId: string,
  header: string[],
  dataRows: string[][],
) {
  const iDate = idx(header, "date", "entry_date");
  const iWeight = idx(header, "weight_kg", "weight", "kg");
  if (iDate < 0 || iWeight < 0) {
    return Response.json(
      {
        error:
          "Weight CSV needs columns: date (or entry_date) and weight_kg (or weight).",
      },
      { status: 400 },
    );
  }
  const iBf = idx(header, "body_fat_percent", "body_fat", "fat");
  const iNotes = idx(header, "notes", "note");

  let n = 0;
  for (const row of dataRows) {
    const dateStr = row[iDate]?.trim();
    const wStr = row[iWeight]?.trim();
    if (!dateStr || !wStr) continue;
    const weightKg = parseFloat(wStr);
    if (Number.isNaN(weightKg) || weightKg <= 0) continue;

    let bodyFatPercent: number | null = null;
    if (iBf >= 0 && row[iBf]?.trim()) {
      const bf = parseFloat(row[iBf]!);
      if (!Number.isNaN(bf) && bf >= 0 && bf <= 100) bodyFatPercent = bf;
    }
    const notes =
      iNotes >= 0 && row[iNotes]?.trim() ? row[iNotes]!.trim() : null;

    await db
      .insert(weightEntries)
      .values({
        userId,
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
    n++;
  }

  revalidatePath("/dashboard");
  revalidatePath("/weight");
  revalidatePath("/data");
  return Response.json({ ok: true, imported: n });
}

function parseBool(s: string): boolean {
  const v = s.trim().toLowerCase();
  return v === "yes" || v === "true" || v === "1" || v === "y" || v === "x";
}

async function importHabits(
  userId: string,
  header: string[],
  dataRows: string[][],
) {
  const iName = idx(header, "habit_name", "name", "habit");
  const iDate = idx(header, "date");
  const iDone = idx(header, "completed", "done");
  const iColor = idx(header, "color");

  if (iName < 0 || iDate < 0) {
    return Response.json(
      {
        error:
          "Habits CSV needs columns: habit_name (or name) and date. Optional: completed, color.",
      },
      { status: 400 },
    );
  }

  const habitCache = new Map<string, string>();

  async function habitIdForName(name: string, color: string) {
    const key = name.toLowerCase();
    if (habitCache.has(key)) return habitCache.get(key)!;
    const [existing] = await db
      .select()
      .from(habits)
      .where(and(eq(habits.userId, userId), eq(habits.name, name)))
      .limit(1);
    if (existing) {
      habitCache.set(key, existing.id);
      return existing.id;
    }
    const [created] = await db
      .insert(habits)
      .values({ userId, name, color: color || "#6366f1" })
      .returning({ id: habits.id });
    habitCache.set(key, created!.id);
    return created!.id;
  }

  let completions = 0;
  for (const row of dataRows) {
    const name = row[iName]?.trim();
    const dateStr = row[iDate]?.trim();
    if (!name || !dateStr) continue;

    const color = iColor >= 0 ? (row[iColor]?.trim() ?? "#6366f1") : "#6366f1";
    const done =
      iDone < 0 ? true : parseBool(row[iDone] ?? "yes");

    const hid = await habitIdForName(name, color);
    if (!done) continue;

    await db
      .insert(habitCompletions)
      .values({
        habitId: hid,
        userId,
        completedDate: dateStr,
      })
      .onConflictDoNothing({
        target: [habitCompletions.habitId, habitCompletions.completedDate],
      });
    completions++;
  }

  revalidatePath("/habits");
  revalidatePath("/dashboard");
  revalidatePath("/data");
  return Response.json({ ok: true, imported: completions });
}
