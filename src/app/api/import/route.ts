import { auth } from "@/auth";
import { db } from "@/db";
import { habitCompletions, habits, weightEntries } from "@/db/schema";
import { parseCsv } from "@/lib/csv";
import { and, eq, inArray } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2 MB
const BATCH_SIZE = 100;

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

  if (file.size > MAX_FILE_BYTES) {
    return Response.json(
      { error: "File too large. Maximum size is 2 MB." },
      { status: 400 },
    );
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

  const values: {
    userId: string;
    entryDate: string;
    weightKg: number;
    bodyFatPercent: number | null;
    notes: string | null;
  }[] = [];

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

    values.push({ userId, entryDate: dateStr, weightKg, bodyFatPercent, notes });
  }

  for (let i = 0; i < values.length; i += BATCH_SIZE) {
    await db
      .insert(weightEntries)
      .values(values.slice(i, i + BATCH_SIZE))
      .onConflictDoUpdate({
        target: [weightEntries.userId, weightEntries.entryDate],
        set: {
          weightKg: sql`excluded.weight_kg`,
          bodyFatPercent: sql`excluded.body_fat_percent`,
          notes: sql`excluded.notes`,
        },
      });
  }

  revalidatePath("/dashboard");
  revalidatePath("/weight");
  revalidatePath("/data");
  return Response.json({ ok: true, imported: values.length });
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

  // Collect unique habit names and their colors from CSV
  const nameColorMap = new Map<string, string>();
  const parsed: { name: string; date: string; done: boolean; color: string }[] = [];

  for (const row of dataRows) {
    const name = row[iName]?.trim();
    const dateStr = row[iDate]?.trim();
    if (!name || !dateStr) continue;

    const color = iColor >= 0 ? (row[iColor]?.trim() ?? "#6366f1") : "#6366f1";
    const done = iDone < 0 ? true : parseBool(row[iDone] ?? "yes");

    if (!nameColorMap.has(name.toLowerCase())) {
      nameColorMap.set(name.toLowerCase(), color);
    }
    parsed.push({ name, date: dateStr, done, color });
  }

  // Resolve all habit IDs in bulk: fetch existing, create missing
  const uniqueNames = [...new Set(parsed.map((p) => p.name))];

  const existingHabits =
    uniqueNames.length > 0
      ? await db
          .select({ id: habits.id, name: habits.name })
          .from(habits)
          .where(
            and(
              eq(habits.userId, userId),
              inArray(habits.name, uniqueNames),
            ),
          )
      : [];

  const habitIdByName = new Map<string, string>();
  for (const h of existingHabits) {
    habitIdByName.set(h.name.toLowerCase(), h.id);
  }

  const missingNames = uniqueNames.filter(
    (n) => !habitIdByName.has(n.toLowerCase()),
  );

  if (missingNames.length > 0) {
    const newHabits = missingNames.map((name) => ({
      userId,
      name,
      color: nameColorMap.get(name.toLowerCase()) || "#6366f1",
    }));

    for (let i = 0; i < newHabits.length; i += BATCH_SIZE) {
      const created = await db
        .insert(habits)
        .values(newHabits.slice(i, i + BATCH_SIZE))
        .returning({ id: habits.id, name: habits.name });

      for (const h of created) {
        habitIdByName.set(h.name.toLowerCase(), h.id);
      }
    }
  }

  // Batch insert completions
  const completionValues: {
    habitId: string;
    userId: string;
    completedDate: string;
  }[] = [];

  for (const p of parsed) {
    if (!p.done) continue;
    const hid = habitIdByName.get(p.name.toLowerCase());
    if (!hid) continue;
    completionValues.push({ habitId: hid, userId, completedDate: p.date });
  }

  for (let i = 0; i < completionValues.length; i += BATCH_SIZE) {
    await db
      .insert(habitCompletions)
      .values(completionValues.slice(i, i + BATCH_SIZE))
      .onConflictDoNothing({
        target: [habitCompletions.habitId, habitCompletions.completedDate],
      });
  }

  revalidatePath("/habits");
  revalidatePath("/dashboard");
  revalidatePath("/data");
  return Response.json({ ok: true, imported: completionValues.length });
}
