import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Heart, ImageOff, ShoppingCart, Zap } from "lucide-react";
import { MainLayout } from "@/layouts/MainLayout";
import { Button } from "@/components/common/Button";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { Skeleton } from "@/components/common/Skeleton";
import { StatusBadge } from "@/components/store/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";

import { useAccount } from "@/hooks/useAccounts";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { getApiErrorMessage } from "@/services/apiClient";
import { cn } from "@/lib/utils";
import { PriceTag } from "@/components/store/PriceTag";
import type { Account } from "@/types/store";

export const Route = createFileRoute("/accounts/$id")({
  head: () => ({
    meta: [
      { title: "Account Details — Sultan Official PUBG Store" },
      {
        name: "description",
        content:
          "Full details of this verified PUBG Mobile account: level, rank, skins, weapons, outfits and price.",
      },
      { property: "og:title", content: "Account Details — Sultan Official PUBG Store" },
      {
        property: "og:description",
        content: "Verified PUBG account details — level, rank, skins, weapons and outfits.",
      },
    ],
  }),
  component: AccountDetailPage,
  errorComponent: ({ error }) => (
    <MainLayout>
      <div className="mx-auto max-w-3xl px-4 py-20">
        <ErrorMessage message={error.message} />
      </div>
    </MainLayout>
  ),
  notFoundComponent: () => (
    <MainLayout>
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState title="Account not found" description="This listing is no longer available." />
      </div>
    </MainLayout>
  ),
});

function AccountDetailPage() {
  const { id } = Route.useParams();
  const { data: account, isLoading, isError, error } = useAccount(id);

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Link
          to="/accounts"
          className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to accounts
        </Link>

        <div className="mt-6">
          {isLoading ? (
            <DetailSkeleton />
          ) : isError ? (
            <ErrorMessage
              message={getApiErrorMessage(error, "Could not load this account right now.")}
            />
          ) : account ? (
            <AccountDetail account={account} />
          ) : (
            <EmptyState title="Account not found" />
          )}
        </div>
      </div>
    </MainLayout>
  );
}

function AccountDetail({ account }: { account: Account }) {
  const [activeImage, setActiveImage] = useState(0);
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToCart, inCart } = useCart();
  const purchasable = account.status === "available";
  const cover = account.images?.[activeImage];

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Gallery */}
      <div>
        <div className="aspect-[4/3] overflow-hidden rounded-xl border border-border bg-surface-elevated">
          {cover ? (
            <img src={cover} alt={account.title} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ImageOff className="h-8 w-8" />
            </span>
          )}
        </div>
        {account.images?.length > 1 ? (
          <div className="mt-3 grid grid-cols-5 gap-2">
            {account.images.map((image, index) => (
              <button
                key={image}
                type="button"
                onClick={() => setActiveImage(index)}
                aria-label={`View image ${index + 1}`}
                className={cn(
                  "aspect-square overflow-hidden rounded-md border",
                  index === activeImage ? "border-primary" : "border-border hover:border-primary/50",
                )}
              >
                <img
                  src={image}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Info */}
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={account.status} />
          {account.category ? (
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {account.category}
            </span>
          ) : null}
        </div>

        <h1 className="mt-3 font-display text-3xl font-bold uppercase text-foreground">
          {account.title}
        </h1>
        {account.description ? (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {account.description}
          </p>
        ) : null}

        <dl className="mt-6 grid grid-cols-2 gap-3">
          <Stat label="Level" value={account.level ?? "—"} />
          <Stat label="Rank" value={account.rank ?? "—"} />
        </dl>

        <PriceTag account={account} size="lg" className="mt-6" />

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            className="min-w-40 flex-1"
            disabled={!purchasable}
            onClick={() =>
              navigate({ to: "/checkout", search: { accountId: account.id } })
            }
          >
            <Zap className="h-4 w-4" /> {purchasable ? "Buy now" : account.status}
          </Button>
          <Button
            variant="outline"
            className="min-w-40 flex-1"
            disabled={!purchasable || inCart(account.id)}
            onClick={() => addToCart(account.id)}
          >
            <ShoppingCart className="h-4 w-4" /> {inCart(account.id) ? "In cart" : "Add to cart"}
          </Button>
          <Button
            variant="surface"
            size="icon"
            aria-label="Toggle favorite"
            aria-pressed={isFavorite(account.id)}
            onClick={() => toggleFavorite(account.id)}
          >
            <Heart
              className={cn(
                "h-4 w-4",
                isFavorite(account.id) ? "fill-primary text-primary" : "text-muted-foreground",
              )}
            />
          </Button>
        </div>

        {!purchasable ? (
          <p className="mt-3 text-xs text-muted-foreground">
            This account is {account.status} and cannot be purchased.
          </p>
        ) : null}

        <div className="mt-8 space-y-4">
          <ItemList title="Skins" items={account.skins} />
          <ItemList title="Weapons" items={account.weapons} />
          <ItemList title="Outfits" items={account.outfits} />
        </div>

        <p className="mt-8 rounded-lg border border-border bg-surface p-4 text-xs text-muted-foreground">
          For your safety, account login credentials are never displayed publicly. They are handed
          over securely after payment confirmation.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 font-display text-lg font-bold text-foreground">{value}</dd>
    </div>
  );
}

function ItemList({ title, items }: { title: string; items?: string[] | undefined }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
        {title}
      </h2>
      <ul className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-muted-foreground"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <Skeleton className="aspect-[4/3] w-full" />
        <div className="mt-3 grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-11 w-full" />
      </div>
    </div>
  );
}
