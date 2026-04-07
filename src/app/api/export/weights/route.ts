import { auth } from "@/auth";
import { db } from "@/db";
import { users, weightEntries } from "@/db/schema";
import { computeBmi, formatBmi } from "@/lib/bmi";
import { rowsToCsv } from "@/lib/csv";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const [user] = await db
    .select({ heightCm: users.heightCm })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const rows = await db
    .select()
    .from(weightEntries)
    .where(eq(weightEntries.userId, session.user.id))
    .orderBy(desc(weightEntries.entryDate));

  const height = user?.heightCm ?? 0;
  const csvRows = rows.map((r) => {
    const bmi =
      height > 0 ? formatBmi(computeBmi(r.weightKg, height)) : "";
    return [
      r.entryDate,
      String(r.weightKg),
      r.bodyFatPercent != null ? String(r.bodyFatPercent) : "",
      bmi,
      r.notes ?? "",
    ];
  });

  const csv = rowsToCsv(
    ["date", "weight_kg", "body_fat_percent", "bmi", "notes"],
    csvRows,
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="weight-export.csv"`,
    },
  });
}
