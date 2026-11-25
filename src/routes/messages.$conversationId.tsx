import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { MainLayout } from "@/layouts/MainLayout";
import { ProtectedRoute } from "@/routes/guards/ProtectedRoute";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ConversationList } from "@/components/chat/ConversationList";
import { useConversation, useConversations } from "@/hooks/useConversations";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/messages/$conversationId")({
  head: () => ({
    meta: [
      { title: "Conversation — Sultan Official PUBG Store" },
      {
        name: "description",
        content: "Private realtime conversation with the Sultan Official PUBG Store team.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Conversation — Sultan Official PUBG Store" },
      {
        property: "og:description",
        content: "Realtime private chat for your PUBG account deal.",
      },
    ],
  }),
  component: () => (
    <ProtectedRoute allowAdmin>
      <ConversationPage />
    </ProtectedRoute>
  ),
});

function ConversationPage() {
  const { conversationId } = Route.useParams();
  const { user } = useAuth();
  const { data: conversations } = useConversations();
  const { data: conversation } = useConversation(conversationId);

  return (
    <MainLayout showCustomDemand={false} allowAdmin>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Link
          to="/messages"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> All conversations
        </Link>

        <div className="mt-5 grid gap-5 lg:grid-cols-[20rem_1fr]">
          <aside className="hidden overflow-hidden rounded-xl border border-border bg-gradient-surface lg:block">
            <ConversationList
              conversations={conversations ?? []}
              currentUserId={user?.id}
              activeId={conversationId}
            />
          </aside>

          <ChatWindow conversationId={conversationId} conversation={conversation} />
        </div>
      </div>
    </MainLayout>
  );
}
