import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { DataState, Panel, Pill, Td, Th, TableWrap } from "@/components/admin/AdminUI";
import { Button } from "@/components/common/Button";
import { useAdminConversations } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import {
  conversationLabel,
  conversationTitle,
  formatConversationTime,
} from "@/types/chat";
import { shortOrderId } from "@/types/order";

export const Route = createFileRoute("/admin/conversations")({
  component: AdminConversationsPage,
});

function AdminConversationsPage() {
  const { data, isLoading, isError, error } = useAdminConversations();
  const { user } = useAuth();
  const conversations = data ?? [];

  return (
    <AdminLayout
      title="Conversations"
      description="Every buyer conversation, powered by the existing realtime chat."
    >
      <Panel title={`${conversations.length} conversation(s)`}>
        <DataState
          isLoading={isLoading}
          isError={isError}
          error={error}
          isEmpty={conversations.length === 0}
          emptyTitle="No conversations yet"
          emptyDescription="Deal and custom-demand chats appear here once the backend opens them."
          emptyIcon={<MessageSquare className="h-6 w-6" />}
          errorFallback="Could not load conversations."
        >
          <TableWrap>
            <thead>
              <tr>
                <Th>Customer</Th>
                <Th>Type</Th>
                <Th>Related</Th>
                <Th>Last message</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {conversations.map((conversation) => (
                <tr key={conversation.id}>
                  <Td className="font-semibold">
                    {conversationTitle(conversation, user?.id)}
                  </Td>
                  <Td>
                    <Pill tone="primary">{conversationLabel(conversation)}</Pill>
                  </Td>
                  <Td className="text-muted-foreground">
                    {conversation.kind === "custom_demand" || conversation.customDemandId
                      ? "Custom demand"
                      : conversation.accountTitle ||
                        (conversation.orderId ? shortOrderId(conversation.orderId) : "—")}
                  </Td>
                  <Td className="max-w-[18rem] text-muted-foreground">
                    <span className="block truncate">{conversation.lastMessage ?? "—"}</span>
                    <span className="text-xs">
                      {formatConversationTime(conversation.lastMessageAt)}
                    </span>
                  </Td>
                  <Td className="text-right">
                    <Link
                      to="/messages/$conversationId"
                      params={{ conversationId: conversation.id }}
                    >
                      <Button size="sm" variant="surface">
                        Open conversation
                      </Button>
                    </Link>
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
