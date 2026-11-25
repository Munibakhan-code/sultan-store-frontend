import { Link } from "@tanstack/react-router";
import { MessagesSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  conversationLabel,
  conversationTitle,
  formatConversationTime,
  type Conversation,
} from "@/types/chat";

export function ConversationList({
  conversations,
  currentUserId,
  activeId,
}: {
  conversations: Conversation[];
  currentUserId?: string | null | undefined;
  activeId?: string | undefined;
}) {
  return (
    <ul className="divide-y divide-border">
      {conversations.map((conversation) => {
        const active = conversation.id === activeId;
        return (
          <li key={conversation.id}>
            <Link
              to="/messages/$conversationId"
              params={{ conversationId: conversation.id }}
              className={cn(
                "flex gap-3 px-4 py-3 transition-colors hover:bg-primary/5",
                active && "bg-primary/10",
              )}
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
                <MessagesSquare className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-display text-sm font-bold uppercase text-foreground">
                    {conversationTitle(conversation, currentUserId)}
                  </span>
                  <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                    {formatConversationTime(conversation.lastMessageAt)}
                  </span>
                </span>
                <span className="mt-1 block truncate text-xs text-muted-foreground">
                  {conversation.lastMessage ?? "No messages yet"}
                </span>
                <span className="mt-1.5 inline-block rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {conversationLabel(conversation)}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
