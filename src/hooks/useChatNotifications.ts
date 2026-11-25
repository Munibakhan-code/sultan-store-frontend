import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";
import { onAnyNewMessage } from "@/sockets/socketClient";
import { normaliseMessage } from "@/services/conversationService";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/hooks/useAuth";
import { useOrders } from "@/hooks/useOrders";
import { notify } from "@/components/common/Toast";
import { shortOrderId, type Order } from "@/types/order";

/**
 * App-wide toasts: new chat messages plus payment/deal status transitions.
 * No typing or seen indicators by design.
 */
export function useChatNotifications() {
  const { user, isAuthenticated } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const location = useLocation();
  const pathname = location.pathname;

  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    function onNew(raw: unknown, event: string) {
      const message = normaliseMessage((raw ?? {}) as Record<string, never>);
      console.info("[Notifications] realtime message", {
        event,
        conversationId: message.conversationId,
        senderId: message.senderId,
        pathname,
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      if (message.conversationId) {
        queryClient.invalidateQueries({ queryKey: ["messages", message.conversationId] });
      }
      if (message.senderId && user?.id && message.senderId === user.id) return;
      if (message.conversationId && pathname.endsWith(message.conversationId)) return;
      notify.info(
        `New message${message.senderName ? ` from ${message.senderName}` : ""}`,
        message.body.slice(0, 120),
      );
    }

    return onAnyNewMessage(onNew);
  }, [socket, isAuthenticated, queryClient, user?.id, pathname]);


  useOrderStatusToasts();
}

/** Watches the cached order list and announces status changes once each. */
function useOrderStatusToasts() {
  const { data: orders } = useOrders();
  const seen = useRef<Map<string, string> | null>(null);

  useEffect(() => {
    if (!orders) return;
    const map = seen.current;
    if (!map) {
      seen.current = new Map(orders.map((o) => [o.id, key(o)]));
      return;
    }

    for (const order of orders) {
      const previous = map.get(order.id);
      const current = key(order);
      if (previous === current) continue;
      map.set(order.id, current);
      if (!previous) continue;

      const ref = shortOrderId(order.id);
      if (order.paymentStatus === "submitted") {
        notify.info("Payment submitted", `${ref} is under review.`);
      } else if (order.paymentStatus === "approved") {
        notify.success("Payment approved", `${ref} deal is now unlocked.`);
      } else if (order.paymentStatus === "rejected") {
        notify.error("Payment rejected", `${ref} needs a new payment proof.`);
      }
      if (order.dealStatus === "completed") {
        notify.success("Order completed", `${ref} is complete — you can leave a review.`);
      }
    }
  }, [orders]);
}

function key(order: Order): string {
  return `${order.paymentStatus}|${order.dealStatus}`;
}
