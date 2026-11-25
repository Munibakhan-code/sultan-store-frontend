import { Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck, Wifi, WifiOff } from "lucide-react";
import { conversationLabel, conversationTitle, type Conversation } from "@/types/chat";
import { Button } from "@/components/common/Button";

export function ConversationHeader({
  conversation,
  currentUserId,
  isConnected,
}: {
  conversation?: Conversation | undefined;
  currentUserId?: string | null | undefined;
  isConnected: boolean;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface/80 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <Link to="/messages" className="lg:hidden">
          <Button variant="ghost" size="icon" aria-label="Back to conversations">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="min-w-0">
          <h1 className="truncate font-display text-base font-bold uppercase text-foreground">
            {conversation ? conversationTitle(conversation, currentUserId) : "Conversation"}
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {conversation ? conversationLabel(conversation) : "Private chat"} · Private
            with our team
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {conversation?.orderId ? (
          <Link to="/orders/$id" params={{ id: conversation.orderId }}>
            <Button variant="outline" size="sm">
              <ShieldCheck className="h-4 w-4" /> View order
            </Button>
          </Link>
        ) : null}
        <span
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
          title={isConnected ? "Realtime connected" : "Reconnecting"}
        >
          {isConnected ? (
            <Wifi className="h-3.5 w-3.5 text-primary" />
          ) : (
            <WifiOff className="h-3.5 w-3.5" />
          )}
          {isConnected ? "Live" : "Offline"}
        </span>
      </div>
    </header>
  );
}
