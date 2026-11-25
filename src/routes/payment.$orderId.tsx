import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Clock, Upload } from "lucide-react";
import { MainLayout } from "@/layouts/MainLayout";
import { ProtectedRoute } from "@/routes/guards/ProtectedRoute";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { Input } from "@/components/common/Input";
import { Skeleton } from "@/components/common/Skeleton";
import { OrderSummary } from "@/components/orders/OrderSummary";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { PaymentInstructions } from "@/components/orders/PaymentInstructions";
import { PaymentMethodCard } from "@/components/orders/PaymentMethodCard";
import { ScreenshotUploader } from "@/components/orders/ScreenshotUploader";
import { notify } from "@/components/common/Toast";
import { useOrder, useSubmitPayment } from "@/hooks/useOrders";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { getApiErrorMessage } from "@/services/apiClient";
import { shortOrderId, type Order } from "@/types/order";

export const Route = createFileRoute("/payment/$orderId")({
  head: () => ({
    meta: [
      { title: "Complete Payment — Sultan Official PUBG Store" },
      {
        name: "description",
        content: "Follow the payment instructions and upload your transfer screenshot for review.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Complete Payment — Sultan Official PUBG Store" },
      { property: "og:description", content: "Upload your payment screenshot for review." },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <PaymentPage />
    </ProtectedRoute>
  ),
});

function PaymentPage() {
  const { orderId } = Route.useParams();
  const { data: order, isLoading, isError, error } = useOrder(orderId);

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold uppercase text-foreground">Payment</h1>
            <p className="mt-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Order {order ? shortOrderId(order.id) : "…"}
            </p>
          </div>
          {order ? (
            <div className="flex flex-wrap gap-2">
              <OrderStatusBadge kind="payment" status={order.paymentStatus} />
              <OrderStatusBadge kind="deal" status={order.dealStatus} />
            </div>
          ) : null}
        </header>

        <div className="mt-8">
          {isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : isError ? (
            <ErrorMessage message={getApiErrorMessage(error, "Could not load this order.")} />
          ) : !order?.id ? (
            <EmptyState title="Order not found" description="This order is no longer available." />
          ) : (
            <PaymentView order={order} />
          )}
        </div>
      </div>
    </MainLayout>
  );
}

function PaymentView({ order }: { order: Order }) {
  const { enabledMethods, isLoading: methodsLoading } = usePaymentMethods();
  const [selected, setSelected] = useState<string | null>(order.paymentMethod ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [reference, setReference] = useState("");
  const submit = useSubmitPayment(order.id);

  useEffect(() => {
    if (!selected && enabledMethods.length > 0) setSelected(enabledMethods[0]!.id);
  }, [enabledMethods, selected]);

  const method = enabledMethods.find((entry) => entry.id === selected) ?? null;
  const submitted = order.paymentStatus === "submitted" || order.paymentStatus === "approved";

  async function handleSubmit() {
    if (!selected || !file) return;
    try {
      await submit.mutateAsync({
        paymentMethod: selected,
        screenshot: file,
        ...(reference ? { reference } : {}),
      });
      setFile(null);
      notify.success("Payment submitted", "Your payment is currently under review.");
    } catch (mutationError) {
      notify.error("Upload failed", getApiErrorMessage(mutationError));
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        {submitted ? (
          <div className="rounded-xl border border-primary/40 bg-primary/10 p-5">
            <p className="flex items-center gap-2 font-display text-base font-bold uppercase text-primary">
              {order.paymentStatus === "approved" ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Clock className="h-5 w-5" />
              )}
              {order.paymentStatus === "approved"
                ? "Payment approved"
                : "Payment submitted. Your payment is currently under review."}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {order.paymentStatus === "approved"
                ? "Your account is reserved for you. Open the deal to receive your credentials."
                : "Our team is verifying your transfer. You will be notified once it is approved."}
            </p>
            <Link to="/orders/$id" params={{ id: order.id }} className="mt-4 inline-block">
              <Button size="sm">
                View deal <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : null}

        {order.paymentStatus === "rejected" ? (
          <ErrorMessage
            message={
              order.reviewNote ??
              "Your previous payment was rejected. Please upload a valid screenshot."
            }
          />
        ) : null}

        {!submitted ? (
          <>
            <div>
              <h2 className="font-display text-lg font-bold uppercase text-foreground">
                Payment method
              </h2>
              {methodsLoading ? (
                <div className="mt-3 space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <div role="radiogroup" aria-label="Payment method" className="mt-3 space-y-3">
                  {enabledMethods.map((entry) => (
                    <PaymentMethodCard
                      key={entry.id}
                      method={entry}
                      selected={entry.id === selected}
                      onSelect={setSelected}
                    />
                  ))}
                </div>
              )}
            </div>

            {method ? <PaymentInstructions method={method} /> : null}

            <ScreenshotUploader file={file} onChange={setFile} disabled={submit.isPending} />

            <Input
              label="Transaction reference (optional)"
              placeholder="e.g. TXN123456789"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
            />

            <Button
              full
              size="lg"
              disabled={!selected || !file}
              isLoading={submit.isPending}
              onClick={handleSubmit}
            >
              <Upload className="h-4 w-4" /> Submit payment
            </Button>
          </>
        ) : null}

        {order.paymentScreenshotUrl ? (
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Submitted screenshot
            </p>
            <img
              src={order.paymentScreenshotUrl}
              alt="Submitted payment screenshot"
              className="mt-2 max-h-80 w-full rounded-md object-contain"
            />
          </div>
        ) : null}
      </div>

      <OrderSummary
        lines={order.items.map((item) => ({ account: item.account, price: item.price }))}
        total={order.amount}
        heading="Amount to pay"
        footnote="This total is issued by our server. Transfer this exact amount."
      />
    </div>
  );
}
