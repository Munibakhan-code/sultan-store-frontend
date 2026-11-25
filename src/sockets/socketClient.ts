import { io, type Socket } from "socket.io-client";
import { API_BASE_URL, tokenStorage } from "@/services/apiClient";

/** Event names as expected by the backend. */
export const SOCKET_EVENTS = {
  joinConversation: "conversation:join",
  leaveConversation: "conversation:leave",
  sendMessage: "message:send",
  newMessage: "message:new",
} as const;

/**
 * Backends differ in the event name they broadcast for a new chat message.
 * We listen to every common variant so realtime delivery works regardless.
 */
export const INBOUND_MESSAGE_EVENTS = [
  "message:new",
  "newMessage",
  "new_message",
  "message",
  "message:received",
  "chat:message",
  "conversation:message",
] as const;

export interface SocketMessagePayload {
  conversationId?: string;
  conversation?: string;
  [key: string]: unknown;
}

let socket: Socket | null = null;
const joinedRooms = new Set<string>();

function getSocketAuth() {
  const token = tokenStorage.get();
  return {
    token,
    auth: token ? { token } : {},
    query: token ? { token } : {},
  };
}

function logSocketAuth(stage: string, token: string | null) {
  console.info(`[Socket] ${stage}`, {
    url: API_BASE_URL.replace(/\/$/, ""),
    credentialMode: token ? "jwt" : "auth_token cookie",
    tokenPresent: Boolean(token),
    tokenLength: token?.length ?? 0,
    cookieCredentialsEnabled: true,
  });
}

/**
 * Single shared Socket.IO connection. `withCredentials` lets the browser send
 * the HttpOnly `auth_token` cookie; a readable JWT remains a fallback for
 * backends that also return one in the login response.
 */
export function getSocket(): Socket | null {
  if (typeof window === "undefined") return null;

  if (!socket) {
    const initial = getSocketAuth();
    logSocketAuth("client created", initial.token);
    socket = io(API_BASE_URL.replace(/\/$/, ""), {
      withCredentials: true,
      transports: ["websocket", "polling"],
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1500,
      auth: initial.auth,
      query: initial.query,
    });

    socket.io.on("reconnect_attempt", () => {
      if (!socket) return;
      const current = getSocketAuth();
      socket.auth = current.auth;
      socket.io.opts.query = current.query;
      logSocketAuth("reconnect attempt", current.token);
    });
    socket.on("connect", () => {
      console.info("[Socket] connected", {
        socketId: socket?.id ?? "unknown",
        transport: socket?.io?.engine?.transport?.name ?? "unknown",
        roomsToRejoin: [...joinedRooms],
      });
      // Re-join every room we were in before the (re)connect.
      for (const id of joinedRooms) joinConversation(id);
    });
    socket.on("disconnect", (reason) => {
      console.warn("[Socket] disconnected", { reason });
    });
    socket.on("connect_error", (error) => {
      const current = getSocketAuth();
      console.error("[Socket] connection error", {
        message: error.message,
        tokenPresent: Boolean(current.token),
        tokenLength: current.token?.length ?? 0,
      });
    });
    socket.on("error", (payload) => {
      console.error("[Socket] server error event", payload);
    });

    // Catch-all: shows the EXACT event names/payloads the backend emits.
    socket.onAny((event, ...args) => {
      console.info("[Socket] <- inbound event", {
        event,
        matchesKnownMessageEvent: (INBOUND_MESSAGE_EVENTS as readonly string[]).includes(event),
        args,
      });
    });
    socket.onAnyOutgoing((event, ...args) => {
      console.info("[Socket] -> outgoing event", { event, args });
    });
  }

  return socket;
}

export function connectSocket(): Socket | null {
  const current = getSocketAuth();
  const s = getSocket();
  if (s && !s.connected) {
    s.auth = current.auth;
    s.io.opts.query = current.query;
    logSocketAuth("connect requested", current.token);
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket) {
    console.info("[Socket] disconnecting client", { socketId: socket.id ?? "unknown" });
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    joinedRooms.clear();
  }
}

export function joinConversation(conversationId: string) {
  const s = getSocket();
  if (!s || !conversationId) return;
  joinedRooms.add(conversationId);
  if (!s.connected) {
    console.warn("[Socket] join deferred — socket not connected yet", { conversationId });
    return;
  }
  console.info("[Socket] joining conversation room", {
    conversationId,
    event: SOCKET_EVENTS.joinConversation,
  });
  // Some backends ack the join; the callback is ignored when they do not.
  s.emit(SOCKET_EVENTS.joinConversation, { conversationId }, (ack: unknown) => {
    console.info("[Socket] join acknowledged", { conversationId, ack });
  });
}

export function leaveConversation(conversationId: string) {
  const s = getSocket();
  joinedRooms.delete(conversationId);
  if (!s || !s.connected || !conversationId) return;
  s.emit(SOCKET_EVENTS.leaveConversation, { conversationId });
}

/** Subscribes one handler to every known inbound message event name. */
export function onAnyNewMessage(handler: (payload: unknown, event: string) => void): () => void {
  const s = getSocket();
  if (!s) return () => {};
  const wrapped = INBOUND_MESSAGE_EVENTS.map((event) => {
    const listener = (payload: unknown) => handler(payload, event);
    s.on(event, listener);
    return { event, listener } as const;
  });
  return () => {
    for (const { event, listener } of wrapped) s.off(event, listener);
  };
}

/**
 * Sends through Socket.IO so the backend persists and broadcasts the message.
 * Returns null before emitting when realtime is unavailable, allowing a safe
 * REST fallback without risking a duplicate database message.
 */
export function sendMessageViaSocket(conversationId: string, body: string): Promise<unknown> | null {
  const s = getSocket();
  if (!s?.connected || !conversationId) {
    console.warn("[Socket] realtime send unavailable — use REST fallback", {
      conversationId,
      socketExists: Boolean(s),
      connected: s?.connected ?? false,
    });
    return null;
  }

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      console.error("[Socket] message confirmation timed out", { conversationId });
      reject(new Error("The message was sent, but the server did not confirm it. Refresh the conversation to check."));
    }, 20_000);

    const onSent = (payload: unknown) => {
      cleanup();
      console.info("[Socket] message confirmed by server", {
        conversationId,
        payloadKeys: payload && typeof payload === "object" ? Object.keys(payload as object) : [],
      });
      resolve(payload);
    };
    const onError = (payload: unknown) => {
      cleanup();
      const message =
        payload && typeof payload === "object" && "message" in payload
          ? String((payload as { message?: unknown }).message ?? "Realtime message failed.")
          : "Realtime message failed.";
      console.error("[Socket] message rejected by server", { conversationId, message });
      reject(new Error(message));
    };
    const cleanup = () => {
      window.clearTimeout(timeout);
      s.off("message:sent", onSent);
      s.off("error", onError);
    };

    s.once("message:sent", onSent);
    s.once("error", onError);
    console.info("[Socket] sending realtime message", {
      conversationId,
      event: SOCKET_EVENTS.sendMessage,
      length: body.length,
    });
    s.emit(SOCKET_EVENTS.sendMessage, { conversationId, message: body });
  });
}
