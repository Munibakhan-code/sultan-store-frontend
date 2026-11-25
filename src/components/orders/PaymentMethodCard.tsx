import { CheckCircle2, CreditCard, Landmark, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PaymentMethod } from "@/types/order";

function MethodIcon({ type }: { type: string }) {
  const key = type.toLowerCase();
  if (key.includes("binance") || key.includes("crypto")) return <Wallet className="h-5 w-5" />;
  if (key.includes("bank")) return <Landmark className="h-5 w-5" />;
  return <CreditCard className="h-5 w-5" />;
}

/** Selectable card for a backend-provided payment method. */
export function PaymentMethodCard({
  method,
  selected,
  onSelect,
}: {
  method: PaymentMethod;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const disabled = !method.enabled;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={() => onSelect(method.id)}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all",
        selected
          ? "border-primary bg-primary/10 shadow-gold"
          : "border-border bg-surface hover:border-primary/50",
        disabled && "cursor-not-allowed opacity-50 hover:border-border",
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface-elevated",
          selected ? "text-primary" : "text-muted-foreground",
        )}
      >
        {method.logoUrl ? (
          <img src={method.logoUrl} alt="" className="h-6 w-6 object-contain" />
        ) : (
          <MethodIcon type={method.type} />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block font-display text-sm font-bold uppercase tracking-wide text-foreground">
          {method.name}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {disabled ? "Currently unavailable" : method.note ?? "Manual transfer with screenshot"}
        </span>
      </span>

      {selected ? <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" /> : null}
    </button>
  );
}
