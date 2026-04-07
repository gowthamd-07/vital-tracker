import { ImportCsvForms } from "@/components/import-forms";
import { CleanupForm } from "@/components/cleanup-form";
import Link from "next/link";

export default function DataPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Import, export & cleanup
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Download backups as CSV, merge data from a spreadsheet, or remove old
          entries by date range.
        </p>
      </div>

      {/* ── Export ──────────────────────────────────────── */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Export
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Your browser will download a file. BMI in the weight export uses your
          current height from{" "}
          <Link
            href="/settings"
            className="text-emerald-700 underline dark:text-emerald-400"
          >
            Settings
          </Link>
          .
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="/api/export/weights"
            className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            Download weight CSV
          </a>
          <a
            href="/api/export/habits"
            className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            Download habits CSV
          </a>
        </div>
      </section>

      {/* ── Import ─────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Import
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Imports merge with existing data (same weight date updates the row;
          habit completions skip duplicates).
        </p>
        <div className="mt-4">
          <ImportCsvForms />
        </div>
      </section>

      {/* ── Cleanup ────────────────────────────────────── */}
      <section className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm dark:border-red-900/40 dark:bg-zinc-900">
        <h2 className="text-lg font-medium text-red-900 dark:text-red-300">
          Cleanup data
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Permanently remove weight entries and/or habit completions within a
          date range. Use the quick presets or choose a custom range.
        </p>
        <div className="mt-4">
          <CleanupForm />
        </div>
      </section>
    </div>
  );
}
