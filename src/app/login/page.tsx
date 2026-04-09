import { loginAction } from "@/app/actions/auth";
import { LoginForm } from "@/components/auth-forms";
import { AppLogo } from "@/components/app-logo";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center text-center">
          <Link href="/">
            <AppLogo size="lg" />
          </Link>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Track weight, BMI, and habits in one place.
          </p>
        </div>
        <LoginForm action={loginAction} />
        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          No account?{" "}
          <Link
            href="/register"
            className="font-medium text-emerald-700 underline dark:text-emerald-400"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
