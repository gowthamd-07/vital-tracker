import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, CheckSquare, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
            VitalTrack
          </span>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16 px-4 py-16">
        <section className="text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            Weight, BMI, and habits
            <br />
            <span className="text-emerald-700 dark:text-emerald-400">
              in one calm dashboard
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
            Log weight and body fat daily, see BMI from your height, build streaks
            with habits, and keep your data portable with CSV import and export.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              Create free account
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
            >
              Sign in
            </Link>
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-3">
          {[
            {
              icon: Activity,
              title: "Weight & BMI",
              text: "Daily entries with optional body fat. BMI updates automatically from your height.",
            },
            {
              icon: CheckSquare,
              title: "Habit grid",
              text: "Seven-day view to tap completions. Built for phone and desktop.",
            },
            {
              icon: Shield,
              title: "Your data",
              text: "Account login, data in Neon Postgres, deploy to Vercel in minutes.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <Icon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              <h2 className="mt-4 font-semibold text-zinc-900 dark:text-zinc-50">
                {title}
              </h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{text}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
