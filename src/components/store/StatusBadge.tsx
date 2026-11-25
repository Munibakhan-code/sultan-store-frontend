import { cn } from "@/lib/utils";
import type { AccountStatus } from "@/types/store";

const styles: Record<AccountStatus, string> = {
  available: "border-success/40 bg-success/15 text-success",
  reserved: "border-primary/40 bg-primary/15 text-primary",
  sold: "border-destructive/40 bg-destructive/15 text-destructive",
};

export function StatusBadge({
  status,
  className,
}: {
  status: AccountStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider",
        styles[status] ?? styles.available,
        className,
      )}
    >
      {status}
    </span>
  );
}
