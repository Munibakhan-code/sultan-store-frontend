import { createFileRoute, Link } from "@tanstack/react-router";
import { MessagesSquare } from "lucide-react";
import { MainLayout } from "@/layouts/MainLayout";
import { ProtectedRoute } from "@/routes/guards/ProtectedRoute";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { Skeleton } from "@/components/common/Skeleton";
import { ConversationList } from "@/components/chat/ConversationList";
import { useConversations } from "@/hooks/useConversations";
import { useAuth } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/services/apiClient";

export const Route = createFileRoute("/messages/")({
  head: () => ({
    meta: [
      { title: "Messages — Sultan Official PUBG Store" },
      {
        name: "description",
        content:
          "Your private conversations with the Sultan Official team for deals and custom demands.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Messages — Sultan Official PUBG Store" },
      {
        property: "og:description",
        content: "Private buyer and support conversations for your PUBG account deals.",
      },
    ],
  }),
  component: () => (
    <ProtectedRoute allowAdmin>
      <MessagesPage />
    </ProtectedRoute>
  ),
});

function MessagesPage() {
  const { user } = useAuth();
  const { data: conversations, isLoading, isError, error } = useConversations();

  return (
    <MainLayout allowAdmin>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <header>
          <h1 className="font-display text-3xl font-bold uppercase text-foreground">
            My <span className="text-gradient-gold">Messages</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Private chats with our team. Account credentials are shared here only — never publicly.
          </p>
        </header>

        <div className="mt-8">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : isError ? (
            <ErrorMessage message={getApiErrorMessage(error, "Could not load your messages.")} />
          ) : conversations && conversations.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-border bg-gradient-surface">
              <ConversationList conversations={conversations} currentUserId={user?.id} />
            </div>
          ) : (
            <EmptyState
              icon={<MessagesSquare className="h-6 w-6" />}
              title="No conversations yet"
              description="A private chat opens once your payment is approved or when our team assists a custom demand."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Link to="/orders">
                    <Button size="sm">View my orders</Button>
                  </Link>
                  <Link to="/custom-demand">
                    <Button size="sm" variant="outline">
                      Submit a custom demand
                    </Button>
                  </Link>
                </div>
              }
            />
          )}
        </div>
      </div>
    </MainLayout>
  );
}
