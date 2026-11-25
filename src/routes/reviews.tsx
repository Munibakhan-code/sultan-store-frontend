import { createFileRoute, Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { MainLayout } from "@/layouts/MainLayout";
import { ProtectedRoute } from "@/routes/guards/ProtectedRoute";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { Skeleton } from "@/components/common/Skeleton";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { useMyReviews } from "@/hooks/useReviews";
import { useOrders } from "@/hooks/useOrders";
import { getApiErrorMessage } from "@/services/apiClient";
import { shortOrderId } from "@/types/order";

export const Route = createFileRoute("/reviews")({
  head: () => ({
    meta: [
      { title: "My Reviews — Sultan Official PUBG Store" },
      {
        name: "description",
        content: "Review your completed PUBG account purchases and track review approval status.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "My Reviews — Sultan Official PUBG Store" },
      {
        property: "og:description",
        content: "Rate completed deals and see the status of your submitted reviews.",
      },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <ReviewsPage />
    </ProtectedRoute>
  ),
});

function ReviewsPage() {
  const orders = useOrders();
  const mine = useMyReviews();

  const reviewedOrderIds = new Set((mine.data ?? []).map((review) => review.orderId));
  const eligible = (orders.data ?? []).filter(
    (order) =>
      order.paymentStatus === "approved" &&
      (order.dealStatus === "completed" || order.dealStatus === "credentials_sent") &&
      !reviewedOrderIds.has(order.id),
  );

  return (
    <MainLayout>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <header>
          <h1 className="font-display text-3xl font-bold uppercase text-foreground">
            My <span className="text-gradient-gold">Reviews</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You can review completed purchases. Our team approves reviews before they appear
            publicly.
          </p>
        </header>

        <section className="mt-8">
          <h2 className="font-display text-xl font-bold uppercase text-foreground">
            Awaiting your review
          </h2>
          <div className="mt-4 space-y-4">
            {orders.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : orders.isError ? (
              <ErrorMessage message={getApiErrorMessage(orders.error, "Could not load orders.")} />
            ) : eligible.length > 0 ? (
              eligible.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-border bg-gradient-surface p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-display text-sm font-bold uppercase text-foreground">
                      {order.items[0]?.account?.title ?? "Account"}{" "}
                      <span className="ml-1 font-mono text-xs text-muted-foreground">
                        {shortOrderId(order.id)}
                      </span>
                    </p>
                    <Link to="/orders/$id" params={{ id: order.id }}>
                      <Button size="sm" variant="ghost">
                        View order
                      </Button>
                    </Link>
                  </div>
                  <div className="mt-4">
                    <ReviewForm orderId={order.id} />
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={<Star className="h-6 w-6" />}
                title="No purchases to review yet"
                description="Once a deal is delivered, you'll be able to rate it here."
                action={
                  <Link to="/accounts">
                    <Button size="sm">Browse accounts</Button>
                  </Link>
                }
              />
            )}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-xl font-bold uppercase text-foreground">
            Submitted reviews
          </h2>
          <div className="mt-4 space-y-3">
            {mine.isLoading ? (
              <Skeleton className="h-28 w-full" />
            ) : mine.isError ? (
              <ErrorMessage message={getApiErrorMessage(mine.error, "Could not load reviews.")} />
            ) : mine.data && mine.data.length > 0 ? (
              mine.data.map((review) => (
                <ReviewCard key={review.id} review={review} showStatus />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">You haven&apos;t written a review yet.</p>
            )}
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
