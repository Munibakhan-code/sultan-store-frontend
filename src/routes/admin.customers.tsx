import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Ban, ShieldCheck, Users } from "lucide-react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { DataState, Panel, Pill, Td, Th, TableWrap } from "@/components/admin/AdminUI";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { Skeleton } from "@/components/common/Skeleton";
import { notify } from "@/components/common/Toast";
import { useAdminCustomers, useCustomerOrders, useSetCustomerDisabled } from "@/hooks/useAdmin";
import { getApiErrorMessage } from "@/services/apiClient";
import { formatPrice } from "@/types/store";
import { PAYMENT_STATUS_LABELS, formatOrderDate, shortOrderId } from "@/types/order";
import type { AdminCustomer } from "@/types/admin";

export const Route = createFileRoute("/admin/customers")({
  component: AdminCustomersPage,
});

function AdminCustomersPage() {
  const { data, isLoading, isError, error } = useAdminCustomers();
  const setDisabled = useSetCustomerDisabled();
  const [selected, setSelected] = useState<AdminCustomer | null>(null);

  const customers = data ?? [];

  async function toggleDisabled(customer: AdminCustomer) {
    try {
      await setDisabled.mutateAsync({ id: customer.id, disabled: !customer.disabled });
      notify.success(customer.disabled ? "Customer re-enabled" : "Customer restricted");
    } catch (err) {
      notify.error(
        "Action unavailable",
        getApiErrorMessage(err, "The backend did not accept this change."),
      );
    }
  }

  return (
    <AdminLayout title="Customers" description="Browse buyers, their spend and their order history.">
      <Panel title={`${customers.length} customer(s)`}>
        <DataState
          isLoading={isLoading}
          isError={isError}
          error={error}
          isEmpty={customers.length === 0}
          emptyTitle="No customers yet"
          emptyDescription="Registered buyers will appear here."
          emptyIcon={<Users className="h-6 w-6" />}
          errorFallback="Could not load customers."
        >
          <TableWrap>
            <thead>
              <tr>
                <Th>Customer</Th>
                <Th>Orders</Th>
                <Th>Spent</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <Td>
                    <div className="flex flex-col">
                      <span className="font-semibold">{customer.fullName}</span>
                      <span className="text-xs text-muted-foreground">{customer.email}</span>
                    </div>
                  </Td>
                  <Td>{customer.ordersCount ?? "—"}</Td>
                  <Td>{customer.totalSpent === null || customer.totalSpent === undefined ? "—" : formatPrice(customer.totalSpent)}</Td>
                  <Td>
                    {customer.disabled ? (
                      <Pill tone="danger">Restricted</Pill>
                    ) : customer.emailVerified === false ? (
                      <Pill tone="muted">Unverified</Pill>
                    ) : (
                      <Pill tone="success">Active</Pill>
                    )}
                  </Td>
                  <Td className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button size="sm" variant="surface" onClick={() => setSelected(customer)}>
                        View details
                      </Button>
                      <Button
                        size="sm"
                        variant={customer.disabled ? "ghost" : "destructive"}
                        onClick={() => toggleDisabled(customer)}
                        isLoading={setDisabled.isPending}
                      >
                        {customer.disabled ? (
                          <ShieldCheck className="h-3.5 w-3.5" />
                        ) : (
                          <Ban className="h-3.5 w-3.5" />
                        )}
                        {customer.disabled ? "Enable" : "Restrict"}
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </DataState>
      </Panel>

      <CustomerDetailModal customer={selected} onClose={() => setSelected(null)} />
    </AdminLayout>
  );
}

function CustomerDetailModal({
  customer,
  onClose,
}: {
  customer: AdminCustomer | null;
  onClose: () => void;
}) {
  const { data, isLoading, isError, error } = useCustomerOrders(customer?.id ?? null);
  const orders = data ?? [];

  return (
    <Modal
      open={Boolean(customer)}
      onClose={onClose}
      title={customer?.fullName ?? "Customer"}
      description={customer?.email}
      className="max-w-2xl"
    >
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs uppercase text-muted-foreground">Role</dt>
          <dd className="text-foreground">{customer?.role ?? "user"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-muted-foreground">Joined</dt>
          <dd className="text-foreground">{formatOrderDate(customer?.createdAt ?? undefined)}</dd>
        </div>
      </dl>

      <h4 className="mt-5 font-display text-sm font-bold uppercase tracking-wider text-foreground">
        Orders
      </h4>
      <div className="mt-2 space-y-2">
        {isLoading ? (
          <>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </>
        ) : isError ? (
          <p className="text-sm text-destructive">
            {getApiErrorMessage(error, "Could not load this customer's orders.")}
          </p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2 text-sm"
            >
              <span className="font-semibold text-foreground">{shortOrderId(order.id)}</span>
              <span className="text-muted-foreground">
                {PAYMENT_STATUS_LABELS[order.paymentStatus]}
              </span>
              <span className="text-foreground">{formatPrice(order.amount)}</span>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}
