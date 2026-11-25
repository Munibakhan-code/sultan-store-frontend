import { createFileRoute, Link } from "@tanstack/react-router";
import { ImageOff, ShoppingCart, Trash2 } from "lucide-react";
import { MainLayout } from "@/layouts/MainLayout";
import { ProtectedRoute } from "@/routes/guards/ProtectedRoute";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { Skeleton } from "@/components/common/Skeleton";
import { StatusBadge } from "@/components/store/StatusBadge";

import { useCart } from "@/hooks/useCart";
import { getApiErrorMessage } from "@/services/apiClient";
import { formatPrice } from "@/types/store";
import { PriceTag } from "@/components/store/PriceTag";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — Sultan Official PUBG Store" },
      {
        name: "description",
        content: "Review the PUBG Mobile accounts in your cart before checkout.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Your Cart — Sultan Official PUBG Store" },
      { property: "og:description", content: "Review the accounts in your cart." },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <CartPage />
    </ProtectedRoute>
  ),
});

function CartPage() {
  const { items, total, isLoading, isError, error, removeFromCart, clearCart, isMutating } =
    useCart();
  const blockedItems = items.filter((item) => item.account.status !== "available");


  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <header className="flex items-center gap-3">
          <ShoppingCart className="h-6 w-6 text-primary" />
          <h1 className="font-display text-3xl font-bold uppercase text-foreground">Your Cart</h1>
        </header>

        <div className="mt-8">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
          ) : isError ? (
            <ErrorMessage message={getApiErrorMessage(error, "Could not load your cart.")} />
          ) : items.length === 0 ? (
            <EmptyState
              icon={<ShoppingCart className="h-6 w-6" />}
              title="Your cart is empty"
              description="Add a verified PUBG account to get started."
              action={
                <Link to="/accounts">
                  <Button size="sm">Browse accounts</Button>
                </Link>
              }
            />
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              <ul className="space-y-3 lg:col-span-2">
                {items.map((item) => {
                  const account = item.account;
                  return (
                    <li
                      key={account.id}
                      className="flex gap-4 rounded-xl border border-border bg-gradient-surface p-4"
                    >
                      <Link
                        to="/accounts/$id"
                        params={{ id: account.id }}
                        className="h-20 w-28 shrink-0 overflow-hidden rounded-md bg-surface-elevated"
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
                            <ImageOff className="h-5 w-5" />
                          </span>
                        )}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to="/accounts/$id"
                            params={{ id: account.id }}
                            className="font-display text-base font-bold uppercase text-foreground hover:text-primary"
                          >
                            {account.title}
                          </Link>
                          <StatusBadge status={account.status} />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {account.level != null ? `Level ${account.level}` : null}
                          {account.level != null && account.rank ? " · " : null}
                          {account.rank}
                        </p>
                        <PriceTag account={account} size="sm" className="mt-2" />

                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${account.title} from cart`}
                        disabled={isMutating}
                        onClick={() => removeFromCart(account.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  );
                })}
              </ul>

              <aside className="h-fit rounded-xl border border-border bg-gradient-surface p-5">
                <h2 className="font-display text-lg font-bold uppercase text-foreground">
                  Order summary
                </h2>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Items</dt>
                    <dd className="text-foreground">{items.length}</dd>
                  </div>
                  <div className="flex justify-between border-t border-border pt-3">
                    <dt className="font-semibold text-foreground">Total</dt>
                    <dd className="font-display text-xl font-bold text-primary">
                      {formatPrice(total)}
                    </dd>
                  </div>
                </dl>
                {blockedItems.length > 0 ? (
                  <p className="mt-4 text-xs text-destructive">
                    {blockedItems.map((item) => item.account.title).join(", ")} is no longer
                    available. Remove it to check out.
                  </p>
                ) : null}
                <Link to="/checkout" search={{ accountId: undefined }} className="block">
                  <Button full className="mt-5" disabled={isMutating || blockedItems.length > 0}>
                    Proceed to checkout
                  </Button>
                </Link>
                <Button
                  full
                  variant="ghost"
                  className="mt-2"
                  disabled={isMutating}
                  onClick={() => clearCart()}
                >
                  Clear cart
                </Button>
              </aside>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
