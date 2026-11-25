import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { Skeleton } from "@/components/common/Skeleton";
import { getApiErrorMessage } from "@/services/apiClient";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  isLoading,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  isLoading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-gradient-surface p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      {isLoading ? (
        <Skeleton className="mt-3 h-7 w-20" />
      ) : (
        <p className="mt-2 font-display text-2xl font-bold text-foreground">{value}</p>
      )}
    </div>
  );
}

export function Panel({
  title,
  actions,
  children,
  className,
}: {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-surface", className)}>
      {title || actions ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          {title ? (
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
              {title}
            </h2>
          ) : null}
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  );
}

/** Shared loading / error / empty handling so no page reinvents it. */
export function DataState({
  isLoading,
  isError,
  error,
  isEmpty,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  emptyAction,
  errorFallback = "Could not load this data.",
  skeletonRows = 4,
  children,
}: {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  isEmpty: boolean;
  emptyTitle: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  emptyAction?: ReactNode;
  errorFallback?: string;
  skeletonRows?: number;
  children: ReactNode;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3" aria-hidden>
        {Array.from({ length: skeletonRows }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }
  if (isError) return <ErrorMessage message={getApiErrorMessage(error, errorFallback)} />;
  if (isEmpty)
    return (
      <EmptyState
        title={emptyTitle}
        {...(emptyDescription ? { description: emptyDescription } : {})}
        {...(emptyIcon ? { icon: emptyIcon } : {})}
        {...(emptyAction ? { action: emptyAction } : {})}
      />
    );
  return <>{children}</>;
}

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[42rem] text-left text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "border-b border-border pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <td className={cn("border-b border-border/60 py-3 pr-3 align-middle text-foreground", className)}>
      {children}
    </td>
  );
}

export function Pill({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "primary" | "success" | "danger";
}) {
  const tones: Record<string, string> = {
    muted: "border-muted-foreground/40 bg-muted/20 text-muted-foreground",
    primary: "border-primary/40 bg-primary/10 text-primary",
    success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
    danger: "border-destructive/40 bg-destructive/10 text-destructive",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </span>
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return (
    <textarea
      className={cn(
        "w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring",
        className,
      )}
      {...rest}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, ...rest } = props;
  return (
    <select
      className={cn(
        "h-11 w-full rounded-md border border-input bg-surface px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring",
        className,
      )}
      {...rest}
    />
  );
}

/** Determinate progress bar used by the media/video uploaders. */
export function ProgressBar({
  value,
  label,
}: {
  value: number;
  label?: string;
}) {
  const percent = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="space-y-1.5">
      {label ? (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{label}</span>
          <span className="font-semibold text-primary">{percent}%</span>
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-full overflow-hidden rounded-full bg-surface-elevated"
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
