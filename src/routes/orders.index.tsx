import { createFileRoute, Link } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { MainLayout } from "@/layouts/MainLayout";
import { ProtectedRoute } from "@/routes/guards/ProtectedRoute";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { Skeleton } from "@/components/common/Skeleton";
import { OrderCard } from "@/components/orders/OrderCard";
import { useOrders } from "@/hooks/useOrders";
import { getApiErrorMessage } from "@/services/apiClient";

export const Route = createFileRoute("/orders/")({
  head: () => ({
    meta: [
      { title: "My Orders — Sultan Official PUBG Store" },
      {
        name: "description",
        content: "Track your PUBG account orders, payment reviews and deal handover status.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "My Orders — Sultan Official PUBG Store" },
      { property: "og:description", content: "Track your orders and deal status." },
    ],
  }),
  component: () => (
    <ProtectedRoute allowAdmin>
      <OrdersPage />
    </ProtectedRoute>
  ),
});

function OrdersPage() {
  const { data: orders, isLoading, isError, error } = useOrders();

  return (
    <MainLayout allowAdmin>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <header className="flex items-center gap-3">
          <Package className="h-6 w-6 text-primary" />
          <h1 className="font-display text-3xl font-bold uppercase text-foreground">My Orders</h1>
        </header>

        <div className="mt-8">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : isError ? (
            <ErrorMessage message={getApiErrorMessage(error, "Could not load your orders.")} />
          ) : !orders || orders.length === 0 ? (
            <EmptyState
              icon={<Package className="h-6 w-6" />}
              title="No orders yet"
              description="Your purchases and deals will show up here."
              action={
                <Link to="/accounts">
                  <Button size="sm">Browse accounts</Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
