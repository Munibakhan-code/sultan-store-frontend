import { apiClient } from "./apiClient";
import { rowId } from "./accountService";
import type { Conversation, ConversationKind, Message } from "@/types/chat";

type Row = Record<string, unknown>;

function str(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

function normaliseKind(value: unknown): ConversationKind {
  const raw = str(value);
  if (raw === "deal" || raw === "support") return raw;
  if (raw === "custom-demand" || raw === "custom_demand" || raw === "customDemand") {
    return "custom_demand";
  }
  return "support";
}

export function normaliseConversation(raw: unknown): Conversation {
  const row = (raw ?? {}) as Row;
  const last = (row["lastMessage"] ?? null) as Row | string | null;
  const lastObj = last && typeof last === "object" ? last : null;
  const order = (row["order"] ?? null) as Row | string | null;
  const orderAccount =
    order && typeof order === "object" ? ((order["account"] ?? {}) as Row) : ({} as Row);

  return {
    id: rowId(row),
    kind: normaliseKind(row["type"] ?? row["kind"]),
    subject: str(row["subject"] ?? orderAccount["title"]) || null,
    orderId: rowId(row["order"]) || str(row["orderId"]) || null,
    customDemandId: rowId(row["customDemand"]) || str(row["customDemandId"]) || null,
    accountTitle:
      str(orderAccount["title"] ?? (row["account"] as Row | undefined)?.["title"]) || null,
    participants: (Array.isArray(row["participants"]) ? (row["participants"] as unknown[]) : [])
      .map((entry) => {
        const p = (entry ?? {}) as Row;
        return {
          id: rowId(p),
          fullName: str(p["name"] ?? p["fullName"]) || null,
          role: str(p["role"]) || null,
          avatarUrl: str(p["avatarUrl"]) || null,
        };
      }),
    lastMessage:
      (typeof last === "string" ? last : str(lastObj?.["message"] ?? lastObj?.["body"])) || null,
    lastMessageAt:
      str(lastObj?.["createdAt"]) || str(row["lastMessageAt"] ?? row["updatedAt"]) || null,
    createdAt: (row["createdAt"] as string | undefined) ?? null,
  };
}

export function normaliseMessage(raw: unknown): Message {
  const envelope = (raw ?? {}) as Row;
  const nestedMessage = envelope["message"];
  const row =
    nestedMessage && typeof nestedMessage === "object"
      ? (nestedMessage as Row)
      : envelope;
  const sender = (row["sender"] ?? null) as Row | string | null;
  const senderObj = sender && typeof sender === "object" ? sender : null;
  return {
    id: rowId(row) || `tmp-${Math.random().toString(36).slice(2)}`,
    conversationId:
      rowId(row["conversation"]) || str(row["conversationId"]) || str(envelope["conversationId"]),
    senderId: rowId(sender) || str(row["senderId"]),
    senderName: str(senderObj?.["name"] ?? senderObj?.["fullName"]) || null,
    senderRole: str(senderObj?.["role"]) || null,
    body: str(row["message"] ?? row["body"] ?? row["text"] ?? row["content"]),
    createdAt: (row["createdAt"] as string | undefined) ?? null,
  };
}

/** REST layer for chat history. Realtime delivery lives in src/sockets. */
export const conversationService = {
  async list(): Promise<Conversation[]> {
    const { data } = await apiClient.get("/conversations");
    const body = (data ?? {}) as Row;
    const rows = Array.isArray(data)
      ? (data as unknown[])
      : (body["conversations"] as unknown[]) ?? [];
    return (Array.isArray(rows) ? rows : []).map(normaliseConversation);
  },

  async getById(id: string): Promise<Conversation> {
    const { data } = await apiClient.get(`/conversations/${id}`);
    const body = (data ?? {}) as Row;
    return normaliseConversation(body["conversation"] ?? body);
  },

  async messages(id: string): Promise<Message[]> {
    const { data } = await apiClient.get(`/conversations/${id}/messages`, {
      params: { page: 1, limit: 100 },
    });
    const body = (data ?? {}) as Row;
    const rows = Array.isArray(data) ? (data as unknown[]) : (body["messages"] as unknown[]) ?? [];
    return (Array.isArray(rows) ? rows : []).map(normaliseMessage);
  },

  async sendMessage(id: string, body: string): Promise<Message> {
    const { data } = await apiClient.post(`/conversations/${id}/messages`, { message: body });
    const payload = (data ?? {}) as Row;
    /** The send response nests the created message under `data`. */
    const raw =
      payload["data"] && typeof payload["data"] === "object" ? payload["data"] : payload;
    return normaliseMessage(raw);
  },
};
