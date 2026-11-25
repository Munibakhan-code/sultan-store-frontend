import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarClock, MessageSquare, ShieldCheck } from "lucide-react";
import { MainLayout } from "@/layouts/MainLayout";
import { ProtectedRoute } from "@/routes/guards/ProtectedRoute";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { Skeleton } from "@/components/common/Skeleton";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { OrderSummary } from "@/components/orders/OrderSummary";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { useOrder } from "@/hooks/useOrders";
import { getApiErrorMessage } from "@/services/apiClient";
import { formatOrderDate, shortOrderId, type Order } from "@/types/order";

export const Route = createFileRoute("/orders/$id")({
  head: () => ({
    meta: [
      { title: "Order Details — Sultan Official PUBG Store" },
      {
        name: "description",
        content: "See your order payment status, deal progress and account handover details.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Order Details — Sultan Official PUBG Store" },
      { property: "og:description", content: "Payment status and deal progress for your order." },
    ],
  }),
  component: () => (
    <ProtectedRoute allowAdmin>
      <OrderDetailPage />
    </ProtectedRoute>
  ),
});

function OrderDetailPage() {
  const { id } = Route.useParams();
  const { data: order, isLoading, isError, error } = useOrder(id);

  return (
    <MainLayout allowAdmin>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to orders
        </button>

        <div className="mt-6">
          {isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : isError ? (
            <ErrorMessage message={getApiErrorMessage(error, "Could not load this order.")} />
          ) : !order?.id ? (
            <EmptyState title="Order not found" description="This order is no longer available." />
          ) : (
            <OrderDetail order={order} />
          )}
        </div>
      </div>
    </MainLayout>
  );
}

function OrderDetail({ order }: { order: Order }) {
  const dealUnlocked = order.paymentStatus === "approved";
  const canReview =
    order.canReview ?? (dealUnlocked && order.dealStatus !== "pending" && !order.hasReview);

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase text-foreground">
            Order {shortOrderId(order.id)}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarClock className="h-4 w-4" /> {formatOrderDate(order.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <OrderStatusBadge kind="payment" status={order.paymentStatus} />
          <OrderStatusBadge kind="deal" status={order.dealStatus} />
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section className="rounded-xl border border-border bg-gradient-surface p-5">
            <h2 className="font-display text-lg font-bold uppercase text-foreground">
              Payment
            </h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Method
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {order.paymentMethodName ?? order.paymentMethod ?? "Not selected"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </dt>
                <dd className="mt-1">
                  <OrderStatusBadge kind="payment" status={order.paymentStatus} />
                </dd>
              </div>
            </dl>

            {order.reviewNote ? (
              <p className="mt-4 rounded-md border border-border bg-surface px-3 py-2 text-sm text-muted-foreground">
                {order.reviewNote}
              </p>
            ) : null}

            {order.paymentScreenshotUrl ? (
              <img
                src={order.paymentScreenshotUrl}
                alt="Submitted payment screenshot"
                className="mt-4 max-h-72 w-full rounded-md border border-border object-contain"
              />
            ) : null}

            {order.paymentStatus === "pending" || order.paymentStatus === "rejected" ? (
              <Link to="/payment/$orderId" params={{ orderId: order.id }} className="mt-4 inline-block">
                <Button size="sm">Complete payment</Button>
              </Link>
            ) : null}
          </section>

          <section className="rounded-xl border border-border bg-gradient-surface p-5">
            <h2 className="font-display text-lg font-bold uppercase text-foreground">Deal</h2>
            <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {dealUnlocked
                ? "Your payment is approved. Our team delivers the account credentials privately in your deal conversation."
                : "The deal opens as soon as your payment is approved by our team. Credentials are never shown publicly."}
            </p>
            <div className="mt-4">
              {dealUnlocked && order.conversationId ? (
                <Link
                  to="/messages/$conversationId"
                  params={{ conversationId: order.conversationId }}
                >
                  <Button size="sm">
                    <MessageSquare className="h-4 w-4" /> Open deal conversation
                  </Button>
                </Link>
              ) : dealUnlocked ? (
                <Link to="/messages">
                  <Button size="sm" variant="outline">
                    <MessageSquare className="h-4 w-4" /> Go to messages
                  </Button>
                </Link>
              ) : (
                <Button size="sm" variant="outline" disabled>
                  <MessageSquare className="h-4 w-4" /> Deal locked
                </Button>
              )}
            </div>
          </section>

          {canReview ? (
            <section className="rounded-xl border border-border bg-gradient-surface p-5">
              <h2 className="font-display text-lg font-bold uppercase text-foreground">
                Leave a review
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Rate this purchase. Our team approves reviews before they appear publicly.
              </p>
              <div className="mt-4">
                <ReviewForm orderId={order.id} />
              </div>
            </section>
          ) : null}
        </div>

        <OrderSummary
          lines={order.items.map((item) => ({ account: item.account, price: item.price }))}
          total={order.amount}
          heading="Order total"
          footnote="Amount confirmed by our server."
        />
      </div>
    </>
  );
}
