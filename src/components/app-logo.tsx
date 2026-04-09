export function AppLogo({ size = "default" }: { size?: "sm" | "default" | "lg" }) {
  const dim = size === "sm" ? "h-6 w-6" : size === "lg" ? "h-9 w-9" : "h-7 w-7";
  const text =
    size === "sm"
      ? "text-sm"
      : size === "lg"
        ? "text-xl"
        : "text-base";

  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight text-emerald-700 dark:text-emerald-400`}>
      <svg
        viewBox="0 0 32 32"
        className={`${dim} shrink-0`}
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="8" fill="currentColor" />
        <path
          d="M4 17H10L13 9L16 25L19 13L21 17H28"
          fill="none"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className={text}>VitalTrack</span>
    </span>
  );
}
