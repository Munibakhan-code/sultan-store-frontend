import { Info } from "lucide-react";
import type { PaymentMethod } from "@/types/order";

/** Renders whatever payment info the backend returns — nothing is hardcoded. */
export function PaymentInstructions({ method }: { method: PaymentMethod }) {
  const details = Object.entries(method.details ?? {}).filter(
    ([, value]) => value !== null && value !== "" && value !== undefined,
  );

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center gap-3">
        {method.logoUrl ? (
          <img
            src={method.logoUrl}
            alt={`${method.name} logo`}
            className="h-9 w-9 shrink-0 rounded-md border border-border bg-surface-elevated object-contain p-1"
          />
        ) : null}
        <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
          {method.name} payment details
        </h3>
      </div>

      {method.instructions ? (
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {method.instructions}
        </p>
      ) : null}

      {details.length > 0 ? (
        <dl className="mt-4 space-y-2">
          {details.map(([key, value]) => (
            <div
              key={key}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-surface-elevated px-3 py-2"
            >
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {key.replace(/[_-]/g, " ")}
              </dt>
              <dd className="break-all font-mono text-sm text-foreground">{String(value)}</dd>
            </div>
          ))}
        </dl>
      ) : method.instructions ? null : (
        <p className="mt-2 text-sm text-muted-foreground">
          Payment details for this method are not published yet. Please contact support.
        </p>
      )}

      <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        Transfer the exact order total, then upload a clear screenshot of the completed transfer.
      </p>
    </div>
  );
}
