import { Link } from "@tanstack/react-router";
import { Heart, ImageOff, ShoppingCart, Zap } from "lucide-react";
import { Button } from "@/components/common/Button";
import { StatusBadge } from "@/components/store/StatusBadge";
import { cn } from "@/lib/utils";
import { PriceTag } from "@/components/store/PriceTag";
import type { Account } from "@/types/store";

export interface AccountCardProps {
  account: Account;
  isFavorite?: boolean;
  inCart?: boolean;
  onToggleFavorite?: (accountId: string) => void;
  onAddToCart?: (accountId: string) => void;
  onBuyNow?: (account: Account) => void;
  disabled?: boolean;
}

export function AccountCard({
  account,
  isFavorite = false,
  inCart = false,
  onToggleFavorite,
  onAddToCart,
  onBuyNow,
  disabled = false,
}: AccountCardProps) {
  const isSold = account.status === "sold";
  const purchasable = account.status === "available";
  const cover = account.images?.[0];

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-gradient-surface transition-all duration-200 hover:border-primary/50 hover:shadow-panel">
      <div className="relative">
        <Link
          to="/accounts/$id"
          params={{ id: account.id }}
          className="block aspect-[16/10] overflow-hidden bg-surface-elevated"
        >
          {cover ? (
            <img
              src={cover}
              alt={account.title}
              loading="lazy"
              className={cn(
                "h-full w-full object-cover transition-transform duration-300 group-hover:scale-105",
                isSold && "opacity-50 grayscale",
              )}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ImageOff className="h-7 w-7" />
            </span>
          )}
        </Link>

        <div className="absolute left-3 top-3">
          <StatusBadge status={account.status} />
        </div>

        <button
          type="button"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={isFavorite}
          onClick={() => onToggleFavorite?.(account.id)}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/80 backdrop-blur transition-colors hover:border-primary/60"
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-colors",
              isFavorite ? "fill-primary text-primary" : "text-muted-foreground",
            )}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <Link to="/accounts/$id" params={{ id: account.id }}>
          <h3 className="line-clamp-1 font-display text-base font-bold uppercase text-foreground transition-colors hover:text-primary">
            {account.title}
          </h3>
        </Link>
        {account.description ? (
          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{account.description}</p>
        ) : null}

        <dl className="mt-3 flex flex-wrap gap-2 text-xs">
          {account.level != null ? (
            <div className="rounded-md border border-border bg-surface px-2 py-1">
              <dt className="inline text-muted-foreground">Level </dt>
              <dd className="inline font-semibold text-foreground">{account.level}</dd>
            </div>
          ) : null}
          {account.rank ? (
            <div className="rounded-md border border-border bg-surface px-2 py-1">
              <dt className="inline text-muted-foreground">Rank </dt>
              <dd className="inline font-semibold text-foreground">{account.rank}</dd>
            </div>
          ) : null}
        </dl>

        <PriceTag account={account} className="mt-4" />

        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={disabled || !purchasable || inCart}
            onClick={() => onAddToCart?.(account.id)}
          >
            <ShoppingCart className="h-4 w-4" />
            {inCart ? "In cart" : "Add"}
          </Button>
          <Button
            size="sm"
            className="flex-1"
            disabled={disabled || !purchasable}
            onClick={() => onBuyNow?.(account)}
          >
            <Zap className="h-4 w-4" />
            {isSold ? "Sold" : "Buy now"}
          </Button>
        </div>
      </div>
    </article>
  );
}
