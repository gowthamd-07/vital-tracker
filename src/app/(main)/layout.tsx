import { auth } from "@/auth";
import { AppNav } from "@/components/app-nav";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-950">
      <AppNav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 sm:pb-8">
        {children}
      </main>
      <PwaInstallPrompt />
    </div>
  );
}
