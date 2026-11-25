import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageSquare, ReceiptText, RefreshCw } from "lucide-react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { DataState, Panel, Pill, Select, Td, Th, TableWrap } from "@/components/admin/AdminUI";
import { Button } from "@/components/common/Button";
import { notify } from "@/components/common/Toast";
import { useAdminOrders, useUpdateOrderStatus } from "@/hooks/useAdmin";
import { getApiErrorMessage } from "@/services/apiClient";
import { formatPrice } from "@/types/store";
import {
  DEAL_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  formatOrderDate,
  shortOrderId,
  type DealStatus,
  type Order,
} from "@/types/order";
import { DEAL_STATUS_OPTIONS } from "@/types/admin";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrdersPage,
});

const FILTERS = [
  { value: "pending", label: "Pending deals" },
  { value: "approved", label: "Approved deals" },
];

function AdminOrdersPage() {
  const [status, setStatus] = useState("pending");
  const { data, isLoading, isError, error, refetch, isFetching } = useAdminOrders(status);
  const updateStatus = useUpdateOrderStatus();

  const orders = data ?? [];

  async function handleStatus(order: Order, dealStatus: DealStatus) {
    try {
      await updateStatus.mutateAsync({ id: order.id, dealStatus });
      notify.success("Deal updated", `${shortOrderId(order.id)} → ${DEAL_STATUS_LABELS[dealStatus]}`);
    } catch (err) {
      notify.error("Update failed", getApiErrorMessage(err, "Could not update the deal status."));
    }
  }

  return (
    <AdminLayout
      title="Orders & deals"
      description="Track handovers, send credentials privately and close completed deals."
      actions={
        <div className="flex items-center gap-2">
          <div className="w-48">
            <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Deal filter">
              {FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <Button
            size="sm"
            variant="surface"
            aria-label="Refresh orders"
            onClick={() => refetch()}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      }
    >
      <Panel title={`${orders.length} order(s)`}>
        <DataState
          isLoading={isLoading}
          isError={isError}
          error={error}
          isEmpty={orders.length === 0}
          emptyTitle="No orders in this view"
          emptyDescription="Switch the filter or wait for new purchases."
          emptyIcon={<ReceiptText className="h-6 w-6" />}
          errorFallback="Could not load orders."
        >
          <TableWrap>
            <thead>
              <tr>
                <Th>Order</Th>
                <Th>Accounts</Th>
                <Th>Amount</Th>
                <Th>Payment</Th>
                <Th>Deal</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <Td>
                    <div className="flex flex-col">
                      <span className="font-semibold">{shortOrderId(order.id)}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatOrderDate(order.createdAt)}
                      </span>
                    </div>
                  </Td>
                  <Td className="max-w-[14rem] text-muted-foreground">
                    {order.items.map((item) => item.account?.title).filter(Boolean).join(", ") || "—"}
                  </Td>
                  <Td>{formatPrice(order.amount)}</Td>
                  <Td>
                    <Pill
                      tone={
                        order.paymentStatus === "approved"
                          ? "success"
                          : order.paymentStatus === "rejected"
                            ? "danger"
                            : "primary"
                      }
                    >
                      {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                    </Pill>
                  </Td>
                  <Td>
                    <div className="w-44">
                      <Select
                        value={order.dealStatus}
                        aria-label="Deal status"
                        onChange={(e) => handleStatus(order, e.target.value as DealStatus)}
                      >
                        {DEAL_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </Td>
                  <Td className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      {order.conversationId ? (
                        <Link
                          to="/messages/$conversationId"
                          params={{ conversationId: order.conversationId }}
                        >
                          <Button size="sm" variant="surface">
                            <MessageSquare className="h-3.5 w-3.5" />
                            Conversation
                          </Button>
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Chat opens after approval
                        </span>
                      )}
                      <Link to="/orders/$id" params={{ id: order.id }}>
                        <Button size="sm" variant="ghost">
                          Open deal
                        </Button>
                      </Link>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </DataState>
      </Panel>
    </AdminLayout>
  );
}
