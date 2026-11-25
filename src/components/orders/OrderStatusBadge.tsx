import { cn } from "@/lib/utils";
import {
  DEAL_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  type DealStatus,
  type PaymentStatus,
} from "@/types/order";

const base =
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide";

const paymentStyles: Record<PaymentStatus, string> = {
  pending: "border-border bg-surface text-muted-foreground",
  submitted: "border-primary/50 bg-primary/10 text-primary",
  approved: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
  rejected: "border-destructive/50 bg-destructive/10 text-destructive",
};

const dealStyles: Record<DealStatus, string> = {
  pending: "border-border bg-surface text-muted-foreground",
  credentials_sent: "border-primary/50 bg-primary/10 text-primary",
  completed: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
};

export function OrderStatusBadge({
  kind,
  status,
  className,
}: {
  kind: "payment" | "deal";
  status: PaymentStatus | DealStatus;
  className?: string;
}) {
  if (kind === "payment") {
    const key = status as PaymentStatus;
    return (
      <span className={cn(base, paymentStyles[key] ?? paymentStyles.pending, className)}>
        {PAYMENT_STATUS_LABELS[key] ?? key}
      </span>
    );
  }
  const key = status as DealStatus;
  return (
    <span className={cn(base, dealStyles[key] ?? dealStyles.pending, className)}>
      {DEAL_STATUS_LABELS[key] ?? key}
    </span>
  );
}
