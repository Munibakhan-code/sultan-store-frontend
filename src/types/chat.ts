/** Realtime chat domain types. Buyer ↔ Admin private conversations only. */

export type ConversationKind = "deal" | "custom_demand" | "support";

export interface ConversationParticipant {
  id: string;
  fullName?: string | null;
  role?: string | null;
  avatarUrl?: string | null;
}

export interface Conversation {
  id: string;
  /** What the conversation was opened for — deal handover, custom demand, support. */
  kind: ConversationKind;
  subject?: string | null;
  /** Present when the conversation belongs to an approved order/deal. */
  orderId?: string | null;
  customDemandId?: string | null;
  /** Title of the account the deal is about, when the backend sends it. */
  accountTitle?: string | null;
  participants: ConversationParticipant[];
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  createdAt?: string | null;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string | null;
  senderRole?: string | null;
  body: string;
  createdAt?: string | null;
  /** Optimistic messages awaiting server acknowledgement. */
  pending?: boolean;
}

export const CONVERSATION_KIND_LABELS: Record<ConversationKind, string> = {
  deal: "Deal",
  custom_demand: "Custom demand",
  support: "Support",
};

export function formatMessageTime(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-PK", { hour: "2-digit", minute: "2-digit" }).format(date);
}

export function formatConversationTime(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const sameDay = new Date().toDateString() === date.toDateString();
  return new Intl.DateTimeFormat("en-PK",
    sameDay ? { hour: "2-digit", minute: "2-digit" } : { dateStyle: "medium" },
  ).format(date);
}

/** A generic backend subject like "Deal" should never win over a real title. */
function meaningfulSubject(subject?: string | null): string | null {
  if (!subject) return null;
  const normalized = subject.trim().toLowerCase();
  if (!normalized || normalized === "deal" || normalized === "conversation") return null;
  return subject;
}

export function conversationTitle(
  conversation: Conversation,
  currentUserId?: string | null,
): string {
  if (conversation.kind === "deal" && conversation.accountTitle) return conversation.accountTitle;
  const subject = meaningfulSubject(conversation.subject);
  if (subject) return subject;
  const other = conversation.participants.find((p) => p.id !== currentUserId);
  if (other?.fullName) return other.fullName;
  if (conversation.kind === "custom_demand") return "Custom demand";
  return CONVERSATION_KIND_LABELS[conversation.kind] ?? "Conversation";
}

/**
 * Label shown in conversation lists: the account title for deals (falling back
 * to "Deal"), and "Custom demand" for demand chats.
 */
export function conversationLabel(conversation: Conversation): string {
  if (conversation.kind === "custom_demand") return "Custom demand";
  if (conversation.kind === "deal") {
    return (
      conversation.accountTitle ||
      meaningfulSubject(conversation.subject) ||
      CONVERSATION_KIND_LABELS.deal
    );
  }
  return CONVERSATION_KIND_LABELS[conversation.kind];
}
