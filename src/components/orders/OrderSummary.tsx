import { Link } from "@tanstack/react-router";
import { ImageOff } from "lucide-react";
import type { ReactNode } from "react";
import { StatusBadge } from "@/components/store/StatusBadge";
import { formatPrice, formatUSD, type Account } from "@/types/store";

export interface OrderSummaryLine {
  account: Account;
  price?: number | undefined;
}

/**
 * Shared summary panel for checkout and payment pages.
 * `total` is always the backend-supplied figure when an order exists.
 */
export function OrderSummary({
  lines,
  total,
  heading = "Order summary",
  footnote,
  children,
}: {
  lines: OrderSummaryLine[];
  total: number;
  heading?: string;
  footnote?: string;
  children?: ReactNode;
}) {
  return (
    <aside className="h-fit rounded-xl border border-border bg-gradient-surface p-5">
      <h2 className="font-display text-lg font-bold uppercase text-foreground">{heading}</h2>

      <ul className="mt-4 space-y-3">
        {lines.map(({ account, price }) => (
          <li key={account.id} className="flex gap-3">
            <Link
              to="/accounts/$id"
              params={{ id: account.id }}
              className="h-14 w-20 shrink-0 overflow-hidden rounded-md bg-surface-elevated"
            >
              {account.images?.[0] ? (
                <img
                  src={account.images[0]}
                  alt={account.title}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <ImageOff className="h-4 w-4" />
                </span>
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-bold uppercase text-foreground">
                {account.title}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge status={account.status} />
              </div>
            </div>
            <p className="font-display text-sm font-bold text-primary">
              {formatPrice(price ?? account.pricePKR ?? account.price)}
              {account.priceUSD ? (
                <span className="ml-2 text-xs font-semibold text-muted-foreground">
                  {formatUSD(account.priceUSD)}
                </span>
              ) : null}
            </p>
          </li>
        ))}
      </ul>

      <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Items</dt>
          <dd className="text-foreground">{lines.length}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="font-semibold text-foreground">Total</dt>
          <dd className="font-display text-xl font-bold text-primary">{formatPrice(total)}</dd>
        </div>
      </dl>

      <p className="mt-3 text-xs text-muted-foreground">
        {footnote ?? "Final amount is confirmed by our server before payment review."}
      </p>

      {children ? <div className="mt-5">{children}</div> : null}
    </aside>
  );
}
