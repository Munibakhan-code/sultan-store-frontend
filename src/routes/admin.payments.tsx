import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeDollarSign, Check, ExternalLink, RefreshCw, X } from "lucide-react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { DataState, Panel, Pill, Select, Td, Th, TableWrap } from "@/components/admin/AdminUI";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { notify } from "@/components/common/Toast";
import { useAdminPayments, useApprovePayment, useRejectPayment } from "@/hooks/useAdmin";
import { getApiErrorMessage } from "@/services/apiClient";
import { formatPrice } from "@/types/store";
import { formatOrderDate, shortOrderId } from "@/types/order";
import type { AdminPayment } from "@/types/admin";

export const Route = createFileRoute("/admin/payments")({
  component: AdminPaymentsPage,
});

const STATUS_FILTERS = ["submitted", "pending", "approved", "rejected"];

function AdminPaymentsPage() {
  const [status, setStatus] = useState("submitted");
  const { data, isLoading, isError, error, refetch, isFetching } = useAdminPayments(status);
  const approve = useApprovePayment();
  const reject = useRejectPayment();
  const [preview, setPreview] = useState<AdminPayment | null>(null);

  const payments = data ?? [];

  async function handleApprove(payment: AdminPayment) {
    try {
      await approve.mutateAsync(payment.id);
      notify.success("Payment approved", "The backend is handling the order transition.");
    } catch (err) {
      notify.error("Approval failed", getApiErrorMessage(err, "Could not approve this payment."));
    }
  }

  async function handleReject(payment: AdminPayment) {
    try {
      await reject.mutateAsync({ id: payment.id });
      notify.info("Payment rejected", "The customer will be notified.");
    } catch (err) {
      notify.error("Rejection failed", getApiErrorMessage(err, "Could not reject this payment."));
    }
  }

  return (
    <AdminLayout
      title="Payments"
      description="Review manual payment submissions and screenshots before approval."
      actions={
        <div className="flex items-center gap-2">
          <div className="w-44">
            <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
              {STATUS_FILTERS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </div>
          <Button
            size="sm"
            variant="surface"
            aria-label="Refresh payments"
            onClick={() => refetch()}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      }
    >
      <Panel title={`${payments.length} submission(s)`}>
        <DataState
          isLoading={isLoading}
          isError={isError}
          error={error}
          isEmpty={payments.length === 0}
          emptyTitle="Nothing to review"
          emptyDescription="Payment submissions appear here as customers upload their screenshots."
          emptyIcon={<BadgeDollarSign className="h-6 w-6" />}
          errorFallback="Could not load payment submissions."
        >
          <TableWrap>
            <thead>
              <tr>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Amount</Th>
                <Th>Method</Th>
                <Th>Screenshot</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <Td>
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        {payment.orderId ? shortOrderId(payment.orderId) : "—"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatOrderDate(payment.createdAt ?? undefined)}
                      </span>
                    </div>
                  </Td>
                  <Td className="text-muted-foreground">
                    <div className="flex flex-col">
                      <span className="text-foreground">{payment.customerName ?? "—"}</span>
                      <span className="text-xs">{payment.customerEmail ?? ""}</span>
                    </div>
                  </Td>
                  <Td>{formatPrice(payment.amount)}</Td>
                  <Td>
                    <Pill tone="primary">{payment.paymentMethodName ?? "—"}</Pill>
                  </Td>
                  <Td>
                    {payment.screenshotUrl ? (
                      <button
                        type="button"
                        onClick={() => setPreview(payment)}
                        className="text-primary underline-offset-2 hover:underline"
                      >
                        View
                      </button>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </Td>
                  <Td className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      {payment.orderId ? (
                        <Link to="/admin/orders" className="inline-flex">
                          <Button size="sm" variant="ghost">
                            <ExternalLink className="h-3.5 w-3.5" />
                            Order
                          </Button>
                        </Link>
                      ) : null}
                      <Button
                        size="sm"
                        onClick={() => handleApprove(payment)}
                        isLoading={approve.isPending}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(payment)}
                        isLoading={reject.isPending}
                      >
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </DataState>
      </Panel>

      <Modal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        title="Payment screenshot"
        description={preview?.orderId ? shortOrderId(preview.orderId) : undefined}
      >
        {preview?.screenshotUrl ? (
          <img
            src={preview.screenshotUrl}
            alt="Payment screenshot"
            className="max-h-[60vh] w-full rounded-md border border-border object-contain"
          />
        ) : null}
      </Modal>
    </AdminLayout>
  );
}
