/**
 * Seed script — imports weight, habit, and action CSV files into the database.
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/seed.ts
 *
 * Or, if you have a .env.local:
 *   npx tsx scripts/seed.ts          (reads .env.local automatically)
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";
import bcrypt from "bcryptjs";

const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  const envText = readFileSync(envPath, "utf-8");
  for (const line of envText.split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m && !process.env[m[1]!]) process.env[m[1]!] = m[2]!;
  }
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required. Set it in .env.local or as an env var.");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { ssl: DATABASE_URL.includes("neon.tech") ? "require" : false });

const root = process.cwd();

function readCsv(name: string): string[][] {
  const text = readFileSync(resolve(root, name), "utf-8");
  return text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .map((l) => l.split(",").map((c) => c.replace(/^"|"$/g, "").trim()));
}

async function main() {
  console.log("Seeding database…");

  // ── 1. User ──────────────────────────────────────────────────────
  const email = "gowthamd";
  const passwordHash = await bcrypt.hash("Digi@8631", 12);

  const [user] = await sql`
    INSERT INTO users (id, email, password_hash, name, height_cm)
    VALUES (
      'a0000000-0000-4000-8000-000000000001',
      ${email}, ${passwordHash}, 'Gowtham', 175.0
    )
    ON CONFLICT (email) DO UPDATE SET password_hash = ${passwordHash}
    RETURNING id
  `;
  const uid = user!.id as string;
  console.log(`  User: ${email}  (id ${uid})`);

  // ── 2. Weight entries ────────────────────────────────────────────
  const weightRows = readCsv("mm_weighttracker_backup_2026_04_07.csv").slice(1);
  let wCount = 0;
  for (const row of weightRows) {
    const weightKg = parseFloat(row[0]!);
    const bodyFat = parseFloat(row[1]!);
    // Date column has Excel escaping:  ="2026-04-07"
    const dateRaw = row[2]!.replace(/[="]/g, "");
    if (!dateRaw || Number.isNaN(weightKg)) continue;
    await sql`
      INSERT INTO weight_entries (user_id, entry_date, weight_kg, body_fat_percent)
      VALUES (${uid}, ${dateRaw}, ${weightKg}, ${Number.isNaN(bodyFat) ? null : bodyFat})
      ON CONFLICT DO NOTHING
    `;
    wCount++;
  }
  console.log(`  Weight entries: ${wCount}`);

  // ── 3. Habits ────────────────────────────────────────────────────
  const colorMap: Record<string, string> = {
    cyan: "#06b6d4",
    blue: "#3b82f6",
    red: "#ef4444",
  };
  const habitRows = readCsv("habits.csv").slice(1);
  const habitIdMap = new Map<string, string>(); // csv_id → db uuid

  for (const row of habitRows) {
    const csvId = row[0]!;
    const name = row[1]!;
    const color = colorMap[row[2]!.toLowerCase()] ?? "#6366f1";

    const [h] = await sql`
      INSERT INTO habits (user_id, name, color)
      VALUES (${uid}, ${name}, ${color})
      ON CONFLICT DO NOTHING
      RETURNING id
    `;
    if (h) habitIdMap.set(csvId, h.id as string);
  }
  // If habits already existed, fetch their IDs
  if (habitIdMap.size === 0) {
    const existing = await sql`SELECT id, name FROM habits WHERE user_id = ${uid}`;
    const nameToRow = new Map(habitRows.map((r) => [r[1]!, r[0]!]));
    for (const row of existing) {
      const csvId = nameToRow.get(row.name as string);
      if (csvId) habitIdMap.set(csvId, row.id as string);
    }
  }
  console.log(`  Habits: ${habitIdMap.size}`);

  // ── 4. Habit completions ─────────────────────────────────────────
  const actionRows = readCsv("actions.csv").slice(1);
  let cCount = 0;
  for (const row of actionRows) {
    const csvHabitId = row[1]!;
    const tsMs = parseInt(row[2]!, 10);
    const habitId = habitIdMap.get(csvHabitId);
    if (!habitId || Number.isNaN(tsMs)) continue;

    const dateStr = new Date(tsMs).toISOString().slice(0, 10);
    await sql`
      INSERT INTO habit_completions (habit_id, user_id, completed_date)
      VALUES (${habitId}, ${uid}, ${dateStr})
      ON CONFLICT DO NOTHING
    `;
    cCount++;
  }
  console.log(`  Habit completions: ${cCount}`);
  console.log("Done ✓");
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
