import { getProfile, updateProfile } from "@/app/actions/profile";
import { SignOutButton } from "@/components/sign-out-button";

export default async function SettingsPage() {
  const profile = await getProfile();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Settings
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Your profile and BMI height. Height is used to compute BMI from weight
          entries.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Profile
        </h2>
        <form action={updateProfile} className="mt-4 max-w-md space-y-4">
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
            <span className="mt-1 block text-xs text-zinc-500">
              Leave empty if you only want to track weight without BMI.
            </span>
          </label>
          <button
            type="submit"
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
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
