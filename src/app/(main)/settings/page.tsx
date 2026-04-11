import { getProfile, updateProfile } from "@/app/actions/profile";
import { SignOutButton } from "@/components/sign-out-button";
import { ACTIVITY_LABELS } from "@/lib/health";
import type { ActivityLevel } from "@/lib/health";

const ACTIVITY_OPTIONS = (
  Object.entries(ACTIVITY_LABELS) as [ActivityLevel, string][]
).map(([value, label]) => ({ value, label }));

export default async function SettingsPage() {
  const profile = await getProfile();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Settings
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Your profile, health data, and weight goal.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Profile
        </h2>
        <form action={updateProfile} className="mt-4 max-w-lg space-y-5">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Name
            <input
              type="text"
              name="name"
              required
              defaultValue={profile?.name ?? ""}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Email
            <input
              type="email"
              value={profile?.email ?? ""}
              disabled
              className="mt-1 w-full cursor-not-allowed rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
            />
          </label>

          <div className="border-t border-zinc-200 pt-5 dark:border-zinc-700">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Body measurements
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500">
              Used for BMI, BMR, TDEE, and personalized health insights.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Height (cm)
              <input
                type="number"
                name="heightCm"
                min={50}
                max={300}
                step="0.1"
                placeholder="e.g. 175"
                defaultValue={
                  profile?.heightCm != null ? String(profile.heightCm) : ""
                }
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </label>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Date of birth
              <input
                type="date"
                name="dateOfBirth"
                defaultValue={profile?.dateOfBirth ?? ""}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </label>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Biological sex
              <select
                name="gender"
                defaultValue={profile?.gender ?? ""}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
              >
                <option value="">Select…</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              <span className="mt-1 block text-xs text-zinc-500">
                Used for Mifflin-St Jeor BMR formula.
              </span>
            </label>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Activity level
              <select
                name="activityLevel"
                defaultValue={profile?.activityLevel ?? ""}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
              >
                <option value="">Select…</option>
                {ACTIVITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-zinc-500">
                Your baseline (rest day) activity. Used for TDEE.
              </span>
            </label>
          </div>

          <div className="border-t border-zinc-200 pt-5 dark:border-zinc-700">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Weight goal
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500">
              Set a target weight and deadline to get motivational tracking and
              calorie guidance on your dashboard.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Target weight (kg)
              <input
                type="number"
                name="targetWeightKg"
                min={20}
                max={400}
                step="0.1"
                placeholder="e.g. 70"
                defaultValue={
                  profile?.targetWeightKg != null
                    ? String(profile.targetWeightKg)
                    : ""
                }
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </label>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Target date
              <input
                type="date"
                name="targetDate"
                defaultValue={profile?.targetDate ?? ""}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </label>
          </div>

          <button
            type="submit"
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Save changes
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:hidden">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Session
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Sign out on this device.
        </p>
        <div className="mt-3">
          <SignOutButton />
        </div>
      </section>
    </div>
  );
}
