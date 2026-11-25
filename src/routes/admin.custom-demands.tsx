import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { HandHelping, Sparkles } from "lucide-react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { DataState, Panel, Pill, Td, Th, TableWrap } from "@/components/admin/AdminUI";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { notify } from "@/components/common/Toast";
import { useAdminCustomDemands, useAssistCustomDemand } from "@/hooks/useAdmin";
import { getApiErrorMessage } from "@/services/apiClient";
import { formatPrice } from "@/types/store";
import { DEMAND_STATUS_LABELS } from "@/types/demand";
import type { AdminCustomDemand } from "@/services/adminService";

export const Route = createFileRoute("/admin/custom-demands")({
  component: AdminCustomDemandsPage,
});

function AdminCustomDemandsPage() {
  const { data, isLoading, isError, error } = useAdminCustomDemands();
  const assist = useAssistCustomDemand();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<AdminCustomDemand | null>(null);

  const demands = data ?? [];

  async function handleAssist(demand: AdminCustomDemand) {
    try {
      const result = await assist.mutateAsync(demand.id);
      notify.success("Assisting customer", "A private conversation has been opened.");
      if (result.conversationId) {
        navigate({
          to: "/messages/$conversationId",
          params: { conversationId: result.conversationId },
        });
      }
    } catch (err) {
      notify.error("Could not assist", getApiErrorMessage(err, "The backend rejected this request."));
    }
  }

  return (
    <AdminLayout
      title="Custom demands"
      description="Read customer requirements and open a private conversation to assist them."
    >
      <Panel title={`${demands.length} demand(s)`}>
        <DataState
          isLoading={isLoading}
          isError={isError}
          error={error}
          isEmpty={demands.length === 0}
          emptyTitle="No custom demands"
          emptyDescription="Requests submitted from the store will appear here."
          emptyIcon={<Sparkles className="h-6 w-6" />}
          errorFallback="Could not load custom demands."
        >
          <TableWrap>
            <thead>
              <tr>
                <Th>Customer</Th>
                <Th>Requirements</Th>
                <Th>Budget</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {demands.map((demand) => (
                <tr key={demand.id}>
                  <Td>
                    <div className="flex flex-col">
                      <span className="font-semibold">{demand.customerName ?? "Customer"}</span>
                      <span className="text-xs text-muted-foreground">
                        {demand.customerEmail ?? ""}
                      </span>
                    </div>
                  </Td>
                  <Td className="max-w-[18rem] text-muted-foreground">
                    {demand.requirements || "—"}
                  </Td>
                  <Td>{demand.budget ? formatPrice(demand.budget) : "—"}</Td>
                  <Td>
                    <Pill tone={demand.status === "fulfilled" ? "success" : "primary"}>
                      {DEMAND_STATUS_LABELS[demand.status]}
                    </Pill>
                  </Td>
                  <Td className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button size="sm" variant="surface" onClick={() => setSelected(demand)}>
                        Open
                      </Button>
                      {demand.conversationId ? (
                        <Link
                          to="/messages/$conversationId"
                          params={{ conversationId: demand.conversationId }}
                        >
                          <Button size="sm" variant="ghost">
                            Conversation
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleAssist(demand)}
                          isLoading={assist.isPending}
                        >
                          <HandHelping className="h-3.5 w-3.5" />
                          Assist
                        </Button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </DataState>
      </Panel>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Custom demand"
        description={selected?.customerName ?? undefined}
        className="max-w-xl"
      >
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs uppercase text-muted-foreground">Requirements</dt>
            <dd className="text-foreground">{selected?.requirements || "—"}</dd>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-xs uppercase text-muted-foreground">Desired rank</dt>
              <dd className="text-foreground">{selected?.desiredRank ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-muted-foreground">Desired level</dt>
              <dd className="text-foreground">{selected?.desiredLevel ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-muted-foreground">Skins / features</dt>
              <dd className="text-foreground">{selected?.desiredSkins ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-muted-foreground">Budget</dt>
              <dd className="text-foreground">
                {selected?.budget ? formatPrice(selected.budget) : "—"}
              </dd>
            </div>
          </div>
          <div>
            <dt className="text-xs uppercase text-muted-foreground">Additional notes</dt>
            <dd className="text-foreground">{selected?.additionalNotes ?? "—"}</dd>
          </div>
        </dl>
      </Modal>
    </AdminLayout>
  );
}
