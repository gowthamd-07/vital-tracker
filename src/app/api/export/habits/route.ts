import { auth } from "@/auth";
import { db } from "@/db";
import { habitCompletions, habits } from "@/db/schema";
import { rowsToCsv } from "@/lib/csv";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const habitRows = await db
    .select()
    .from(habits)
    .where(eq(habits.userId, session.user.id));

  const habitIds = habitRows.map((h) => h.id);
  const nameById = new Map(habitRows.map((h) => [h.id, h.name]));
  const colorById = new Map(habitRows.map((h) => [h.id, h.color]));

  if (habitIds.length === 0) {
    const csv = rowsToCsv(
      ["habit_name", "color", "date", "completed"],
      [],
    );
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="habits-export.csv"`,
      },
    });
  }

  const completions = await db
    .select()
    .from(habitCompletions)
    .where(eq(habitCompletions.userId, session.user.id));

  const csvRows = completions.map((c) => [
    nameById.get(c.habitId) ?? "",
    colorById.get(c.habitId) ?? "",
    c.completedDate,
    "yes",
  ]);

  const csv = rowsToCsv(
    ["habit_name", "color", "date", "completed"],
    csvRows,
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="habits-export.csv"`,
    },
  });
}
