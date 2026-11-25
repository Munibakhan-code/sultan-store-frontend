import { cn } from "@/lib/utils";

const sizes = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-[3px]",
} as const;

export function LoadingSpinner({
  size = "md",
  className,
  label,
}: {
  size?: keyof typeof sizes;
  className?: string;
  label?: string;
}) {
  return (
    <span className="inline-flex items-center gap-2" role="status" aria-live="polite">
      <span
        className={cn(
          "animate-spin rounded-full border-primary/25 border-t-primary",
          sizes[size],
          className,
        )}
      />
      {label ? <span className="text-sm text-muted-foreground">{label}</span> : null}
      <span className="sr-only">Loading</span>
    </span>
  );
}

export function FullPageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <LoadingSpinner size="lg" label={label} />
    </div>
  );
}
