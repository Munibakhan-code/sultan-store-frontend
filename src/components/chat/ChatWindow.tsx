import { useEffect, useRef } from "react";
import { ShieldCheck } from "lucide-react";
import { ConversationHeader } from "@/components/chat/ConversationHeader";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { MessageInput } from "@/components/chat/MessageInput";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { Skeleton } from "@/components/common/Skeleton";
import { useMessages } from "@/hooks/useConversations";
import { useAuth } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/services/apiClient";
import type { Conversation } from "@/types/chat";

export function ChatWindow({
  conversationId,
  conversation,
}: {
  conversationId: string;
  conversation?: Conversation | undefined;
}) {
  const { user } = useAuth();
  const { messages, isLoading, isError, error, isConnected, sendMessage, isSending } =
    useMessages(conversationId);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  return (
    <div className="flex h-[70vh] min-h-[26rem] flex-col overflow-hidden rounded-xl border border-border bg-gradient-surface">
      <ConversationHeader
        conversation={conversation}
        currentUserId={user?.id}
        isConnected={isConnected}
      />

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-14 w-2/3" />
            <Skeleton className="ml-auto h-14 w-1/2" />
            <Skeleton className="h-14 w-3/5" />
          </div>
        ) : isError ? (
          <ErrorMessage message={getApiErrorMessage(error, "Could not load this conversation.")} />
        ) : messages.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="h-6 w-6" />}
            title="No messages yet"
            description="Send the first message. Account credentials are only ever shared here, privately."
          />
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={Boolean(user?.id) && message.senderId === user?.id}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <MessageInput onSend={(body) => sendMessage(body)} isSending={isSending} disabled={isError} />
    </div>
  );
}
