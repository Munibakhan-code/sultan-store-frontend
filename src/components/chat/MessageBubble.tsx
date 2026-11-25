import { cn } from "@/lib/utils";
import { formatMessageTime, type Message } from "@/types/chat";

export function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  const isAdmin = message.senderRole === "admin";

  return (
    <div className={cn("flex w-full", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm sm:max-w-[65%]",
          isOwn
            ? "bg-gradient-gold text-primary-foreground"
            : "border border-border bg-surface-elevated text-foreground",
          message.pending && "opacity-70",
        )}
      >
        {!isOwn ? (
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">
            {message.senderName ?? (isAdmin ? "Support" : "User")}
          </p>
        ) : null}
        <p className="whitespace-pre-wrap break-words">{message.body}</p>
        <p
          className={cn(
            "mt-1 text-right text-[10px] tabular-nums",
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          {message.pending ? "Sending…" : formatMessageTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}
