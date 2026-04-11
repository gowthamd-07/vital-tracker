"use client";

import { useEffect, useState, useCallback } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true);
    setIsStandalone(standalone);

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !("BeforeInstallPromptEvent" in window);
    setIsIos(ios);

    if (sessionStorage.getItem("pwa-dismissed") === "1") {
      setDismissed(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    sessionStorage.setItem("pwa-dismissed", "1");
  }, []);

  if (isStandalone || dismissed) return null;

  if (isIos) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4 sm:bottom-4">
        <div className="relative rounded-2xl border border-emerald-200 bg-white p-4 shadow-lg dark:border-emerald-800 dark:bg-zinc-900">
          <button
            onClick={handleDismiss}
            className="absolute right-2 top-2 rounded-lg p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-emerald-100 p-2 dark:bg-emerald-950">
              <Download className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Install VitalTrack
              </p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                Tap the share button <span className="font-medium">⎙</span> then
                &quot;Add to Home Screen&quot; for the full app experience.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!deferredPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md sm:bottom-4">
      <div className="relative flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-lg dark:border-emerald-800 dark:bg-zinc-900">
        <button
          onClick={handleDismiss}
          className="absolute right-2 top-2 rounded-lg p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="rounded-xl bg-emerald-100 p-2 dark:bg-emerald-950">
          <Download className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Install VitalTrack
          </p>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Add to home screen for a native app experience.
          </p>
        </div>
        <button
          onClick={handleInstall}
          className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          Install
        </button>
      </div>
    </div>
  );
}
