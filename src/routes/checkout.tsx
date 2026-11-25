import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { MainLayout } from "@/layouts/MainLayout";
import { ProtectedRoute } from "@/routes/guards/ProtectedRoute";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { Skeleton } from "@/components/common/Skeleton";
import { CheckoutForm } from "@/components/orders/CheckoutForm";
import { OrderSummary } from "@/components/orders/OrderSummary";
import { useCart } from "@/hooks/useCart";
import { useAccount } from "@/hooks/useAccounts";
import { getApiErrorMessage } from "@/services/apiClient";
import type { Account } from "@/types/store";

export const Route = createFileRoute("/checkout")({
  validateSearch: (search: Record<string, unknown>) => ({
    accountId: typeof search["accountId"] === "string" ? search["accountId"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Checkout — Sultan Official PUBG Store" },
      {
        name: "description",
        content: "Review your PUBG account order and choose a payment method to continue.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Checkout — Sultan Official PUBG Store" },
      { property: "og:description", content: "Choose a payment method and place your order." },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <CheckoutPage />
    </ProtectedRoute>
  ),
});

function CheckoutPage() {
  const { accountId } = Route.useSearch();
  return accountId ? <BuyNowCheckout accountId={accountId} /> : <CartCheckout />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <header>
          <h1 className="font-display text-3xl font-bold uppercase text-foreground">Checkout</h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" /> Manual review keeps every deal
            verified. Credentials are handed over only after approval.
          </p>
        </header>
        <div className="mt-8">{children}</div>
      </div>
    </MainLayout>
  );
}

function CheckoutLayout({
  accounts,
  total,
  fromCart,
}: {
  accounts: Account[];
  total: number;
  fromCart: boolean;
}) {
  const unavailable = accounts.filter((account) => account.status !== "available");

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <CheckoutForm
          accountIds={accounts.map((account) => account.id)}
          fromCart={fromCart}
          blocked={unavailable.length > 0}
          blockedReason={
            unavailable.length > 0
              ? `${unavailable.map((a) => a.title).join(", ")} is no longer available. Remove it to continue.`
              : undefined
          }
        />
      </div>
      <OrderSummary
        lines={accounts.map((account) => ({ account }))}
        total={total}
        footnote="Displayed prices are indicative — the server confirms the final amount on your order."
      />
    </div>
  );
}

function CartCheckout() {
  const { items, total, isLoading, isError, error } = useCart();

  if (isLoading) return <Shell><Skeleton className="h-72 w-full" /></Shell>;
  if (isError)
    return (
      <Shell>
        <ErrorMessage message={getApiErrorMessage(error, "Could not load your cart.")} />
      </Shell>
    );
  if (items.length === 0)
    return (
      <Shell>
        <EmptyState
          title="Nothing to check out"
          description="Add a verified account to your cart first."
          action={
            <Link to="/accounts">
              <Button size="sm">Browse accounts</Button>
            </Link>
          }
        />
      </Shell>
    );

  return (
    <Shell>
      <CheckoutLayout accounts={items.map((item) => item.account)} total={total} fromCart />
    </Shell>
  );
}

function BuyNowCheckout({ accountId }: { accountId: string }) {
  const { data: account, isLoading, isError, error } = useAccount(accountId);

  if (isLoading) return <Shell><Skeleton className="h-72 w-full" /></Shell>;
  if (isError)
    return (
      <Shell>
        <ErrorMessage message={getApiErrorMessage(error, "Could not load this account.")} />
      </Shell>
    );
  if (!account)
    return (
      <Shell>
        <EmptyState title="Account not found" description="This listing is no longer available." />
      </Shell>
    );

  return (
    <Shell>
      <CheckoutLayout accounts={[account]} total={account.pricePKR ?? account.price} fromCart={false} />
    </Shell>
  );
}
