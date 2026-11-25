import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Package, Pencil, Plus, Trash2 } from "lucide-react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { AccountFormModal } from "@/components/admin/AccountFormModal";
import { DataState, Panel, Pill, Td, Th, TableWrap } from "@/components/admin/AdminUI";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { notify } from "@/components/common/Toast";
import {
  useAdminAccounts,
  useCreateAccount,
  useDeleteAccount,
  useUpdateAccount,
} from "@/hooks/useAdmin";
import { getApiErrorMessage } from "@/services/apiClient";
import { PriceTag } from "@/components/store/PriceTag";
import type { Account } from "@/types/store";
import type { AccountFormValues } from "@/types/admin";

export const Route = createFileRoute("/admin/accounts")({
  component: AdminAccountsPage,
});

function AdminAccountsPage() {
  const { data, isLoading, isError, error } = useAdminAccounts();
  const create = useCreateAccount();
  const update = useUpdateAccount();
  const remove = useDeleteAccount();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState<Account | null>(null);

  const accounts = data ?? [];

  /** Saves details only and hands the persisted account back for media uploads. */
  async function handleSubmit(values: AccountFormValues): Promise<Account | null> {
    try {
      const saved = editing
        ? await update.mutateAsync({ id: editing.id, payload: values })
        : await create.mutateAsync(values);
      notify.success(editing ? "Account updated" : "Account created");
      return saved ?? null;
    } catch (err) {
      notify.error("Save failed", getApiErrorMessage(err, "Could not save the account."));
      throw err;
    }
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await remove.mutateAsync(deleting.id);
      notify.success("Account deleted");
      setDeleting(null);
    } catch (err) {
      notify.error("Delete failed", getApiErrorMessage(err, "Could not delete the account."));
    }
  }

  return (
    <AdminLayout
      title="Accounts"
      description="Create, edit and remove marketplace listings. Credentials stay backend-only."
      actions={
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          New account
        </Button>
      }
    >
      <Panel title={`${accounts.length} listing(s)`}>
        <DataState
          isLoading={isLoading}
          isError={isError}
          error={error}
          isEmpty={accounts.length === 0}
          emptyTitle="No accounts yet"
          emptyDescription="Create your first listing to populate the marketplace."
          emptyIcon={<Package className="h-6 w-6" />}
          errorFallback="Could not load accounts."
        >
          <TableWrap>
            <thead>
              <tr>
                <Th>Account</Th>
                <Th>Price</Th>
                <Th>Rank / Level</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      {account.images[0] ? (
                        <img
                          src={account.images[0]}
                          alt={account.title}
                          className="h-10 w-14 rounded object-cover"
                        />
                      ) : (
                        <span className="flex h-10 w-14 items-center justify-center rounded bg-surface-elevated text-muted-foreground">
                          <Package className="h-4 w-4" />
                        </span>
                      )}
                      <span className="font-semibold">{account.title}</span>
                    </div>
                  </Td>
                  <Td>
                    <PriceTag account={account} size="sm" />
                  </Td>
                  <Td className="text-muted-foreground">
                    {account.rank ?? "—"} · Lv {account.level ?? "—"}
                  </Td>
                  <Td>
                    <Pill
                      tone={
                        account.status === "available"
                          ? "success"
                          : account.status === "sold"
                            ? "danger"
                            : "primary"
                      }
                    >
                      {account.status}
                    </Pill>
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="surface"
                        onClick={() => {
                          setEditing(account);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleting(account)}>
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </DataState>
      </Panel>

      <AccountFormModal
        open={formOpen}
        account={editing}
        onClose={closeForm}
        onSubmit={handleSubmit}
        isSaving={create.isPending || update.isPending}
        error={create.error ?? update.error}
      />

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete account"
        description={`"${deleting?.title ?? ""}" will be removed from the marketplace.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} isLoading={remove.isPending}>
              Delete
            </Button>
          </>
        }
      />
    </AdminLayout>
  );
}
