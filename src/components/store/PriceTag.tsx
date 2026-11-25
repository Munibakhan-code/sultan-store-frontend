import { cn } from "@/lib/utils";
import { accountPrices, type Account } from "@/types/store";

/**
 * Dual-currency price display. Newer accounts have PKR + USD prices; older
 * accounts only carry the legacy single price, which is shown as-is.
 */
export function PriceTag({
  account,
  size = "md",
  className,
}: {
  account: Pick<Account, "price" | "pricePKR" | "priceUSD">;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { pkr, usd, legacy } = accountPrices(account);
  const primary =
    size === "lg"
      ? "font-display text-3xl font-bold text-primary"
      : size === "sm"
        ? "font-display text-base font-bold text-primary"
        : "font-display text-xl font-bold text-primary";
  const secondary = size === "lg" ? "text-base" : "text-sm";

  if (legacy) {
    return (
      <p className={cn(primary, className)}>
        {legacy}
      </p>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      {pkr ? <span className={primary}>{pkr}</span> : null}
      {usd ? (
        <span className={cn("font-semibold text-muted-foreground", secondary)}>
          {pkr ? "· " : ""}
          {usd}
        </span>
      ) : null}
      {!pkr && !usd ? <span className={primary}>—</span> : null}
    </div>
  );
}
