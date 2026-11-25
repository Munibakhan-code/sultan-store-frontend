import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarClock, ImageOff } from "lucide-react";
import { Button } from "@/components/common/Button";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { formatOrderDate, shortOrderId, type Order } from "@/types/order";
import { formatPrice } from "@/types/store";

export function OrderCard({ order }: { order: Order }) {
  const first = order.items[0]?.account;
  const extra = order.items.length - 1;

  return (
    <article className="rounded-xl border border-border bg-gradient-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-4">
          <div className="h-20 w-28 shrink-0 overflow-hidden rounded-md bg-surface-elevated">
            {first?.images?.[0] ? (
              <img
                src={first.images[0]}
                alt={first.title}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                <ImageOff className="h-5 w-5" />
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Order {shortOrderId(order.id)}
            </p>
            <h3 className="mt-1 font-display text-base font-bold uppercase text-foreground">
              {first?.title ?? "Account"}
              {extra > 0 ? (
                <span className="ml-2 text-xs font-semibold text-muted-foreground">
                  +{extra} more
                </span>
              ) : null}
            </h3>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" /> {formatOrderDate(order.createdAt)}
            </p>
            <p className="mt-2 font-display text-lg font-bold text-primary">
              {formatPrice(order.amount)}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <div className="flex flex-wrap gap-2">
            <OrderStatusBadge kind="payment" status={order.paymentStatus} />
            <OrderStatusBadge kind="deal" status={order.dealStatus} />
          </div>
          <p className="text-xs text-muted-foreground">
            Payment method: {order.paymentMethodName ?? order.paymentMethod ?? "Not selected"}
          </p>
          <div className="flex gap-2">
            {order.paymentStatus === "pending" || order.paymentStatus === "rejected" ? (
              <Link to="/payment/$orderId" params={{ orderId: order.id }}>
                <Button size="sm">Complete payment</Button>
              </Link>
            ) : null}
            <Link to="/orders/$id" params={{ id: order.id }}>
              <Button variant="outline" size="sm">
                View deal <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
