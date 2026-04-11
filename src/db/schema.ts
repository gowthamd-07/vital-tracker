import {
  date,
  index,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  /** Height in centimeters — used for BMI */
  heightCm: real("height_cm"),
  /** Date of birth (YYYY-MM-DD) — used for age-based health calculations */
  dateOfBirth: date("date_of_birth"),
  /** Biological sex for BMR calculation: male | female */
  gender: text("gender"),
  /** Activity level for TDEE: sedentary | light | moderate | active | very_active */
  activityLevel: text("activity_level"),
  /** Weight goal in kg */
  targetWeightKg: real("target_weight_kg"),
  /** Deadline to reach target weight (YYYY-MM-DD) */
  targetDate: date("target_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const weightEntries = pgTable(
  "weight_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    entryDate: date("entry_date").notNull(),
    weightKg: real("weight_kg").notNull(),
    bodyFatPercent: real("body_fat_percent"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("weight_entries_user_date_unique").on(table.userId, table.entryDate),
  ],
);

export const habits = pgTable(
  "habits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull().default("#6366f1"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("habits_user_idx").on(table.userId)],
);

export const habitCompletions = pgTable(
  "habit_completions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    habitId: uuid("habit_id")
      .notNull()
      .references(() => habits.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    completedDate: date("completed_date").notNull(),
  },
  (table) => [
    uniqueIndex("habit_completions_habit_date_unique").on(
      table.habitId,
      table.completedDate,
    ),
    index("habit_completions_user_idx").on(table.userId),
  ],
);

export type User = typeof users.$inferSelect;
export type WeightEntry = typeof weightEntries.$inferSelect;
export type Habit = typeof habits.$inferSelect;
export type HabitCompletion = typeof habitCompletions.$inferSelect;
