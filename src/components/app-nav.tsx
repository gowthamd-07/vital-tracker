"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  CheckSquare,
  Database,
  Settings,
} from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppLogo } from "@/components/app-logo";

const links = [
  { href: "/dashboard", label: "Dashboard", short: "Home", icon: BarChart3 },
  { href: "/weight", label: "Weight", short: "Weight", icon: Activity },
  { href: "/habits", label: "Habits", short: "Habits", icon: CheckSquare },
  { href: "/settings", label: "Settings", short: "Settings", icon: Settings },
  { href: "/data", label: "Import / Export", short: "Data", icon: Database },
];

export function AppNav() {
  const pathname = usePathname();
  const currentPath = pathname ?? "";

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/dashboard">
            <AppLogo />
          </Link>
          <div className="flex items-center gap-1 sm:hidden">
            <ThemeToggle />
          </div>
          <nav className="hidden items-center gap-1 sm:flex">
            {links.map(({ href, label, icon: Icon }) => {
              const active =
                currentPath === href || currentPath.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  {label}
                </Link>
              );
            })}
            <ThemeToggle />
            <SignOutButton />
          </nav>
        </div>
      </header>
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] dark:border-zinc-800 dark:bg-zinc-950/95 sm:hidden">
        <div className="mx-auto flex w-full max-w-lg justify-around">
          {links.map(({ href, short, icon: Icon }) => {
            const active =
              currentPath === href || currentPath.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-1 flex-col items-center gap-0.5 px-1 py-2.5 text-[11px] font-medium ${
                  active
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-zinc-500 dark:text-zinc-500"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span className="truncate">{short}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      <div className="h-[4.5rem] sm:hidden" aria-hidden />
    </>
  );
}
