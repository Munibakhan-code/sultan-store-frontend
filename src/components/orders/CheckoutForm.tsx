import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { Button } from "@/components/common/Button";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { Skeleton } from "@/components/common/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { PaymentMethodCard } from "@/components/orders/PaymentMethodCard";
import { PaymentInstructions } from "@/components/orders/PaymentInstructions";
import { notify } from "@/components/common/Toast";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useCreateOrder } from "@/hooks/useOrders";
import { getApiErrorMessage } from "@/services/apiClient";

/**
 * Payment-method selection + order creation. The backend re-validates
 * availability and computes the authoritative total.
 */
export function CheckoutForm({
  accountIds,
  fromCart,
  blocked,
  blockedReason,
}: {
  accountIds: string[];
  fromCart: boolean;
  blocked?: boolean | undefined;
  blockedReason?: string | undefined;
}) {
  const navigate = useNavigate();
  const { enabledMethods, isLoading, isError, error } = usePaymentMethods();
  const [selected, setSelected] = useState<string | null>(null);
  const createOrder = useCreateOrder();

  useEffect(() => {
    if (!selected && enabledMethods.length === 1) setSelected(enabledMethods[0]!.id);
  }, [enabledMethods, selected]);

  const method = enabledMethods.find((entry) => entry.id === selected) ?? null;

  async function handleSubmit() {
    if (!selected || blocked) return;
    try {
      const order = await createOrder.mutateAsync({
        accountIds,
        paymentMethod: selected,
        fromCart,
      });
      if (!order.id) throw new Error("The server did not return an order id.");
      notify.success("Order created", "Complete the payment to continue.");
      navigate({ to: "/payment/$orderId", params: { orderId: order.id } });
    } catch (mutationError) {
      notify.error("Checkout failed", getApiErrorMessage(mutationError));
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-lg font-bold uppercase text-foreground">Payment method</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose how you want to pay. Methods are managed by our team.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : isError ? (
        <ErrorMessage message={getApiErrorMessage(error, "Could not load payment methods.")} />
      ) : enabledMethods.length === 0 ? (
        <EmptyState
          title="No payment method available"
          description="Payment methods are temporarily disabled. Please try again later."
        />
      ) : (
        <div role="radiogroup" aria-label="Payment method" className="space-y-3">
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

      {method ? <PaymentInstructions method={method} /> : null}

      {blocked ? <ErrorMessage message={blockedReason ?? "This order cannot be placed."} /> : null}

      <Button
        full
        size="lg"
        disabled={!selected || blocked || accountIds.length === 0}
        isLoading={createOrder.isPending}
        onClick={handleSubmit}
      >
        <Lock className="h-4 w-4" /> Place order &amp; continue
      </Button>
    </div>
  );
}
