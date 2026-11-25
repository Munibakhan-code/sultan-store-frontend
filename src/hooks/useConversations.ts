import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { conversationService } from "@/services/conversationService";
import { normaliseMessage } from "@/services/conversationService";
import {
  joinConversation,
  leaveConversation,
  onAnyNewMessage,
  sendMessageViaSocket,
} from "@/sockets/socketClient";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/hooks/useAuth";
import type { Message } from "@/types/chat";


export function useConversations() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["conversations"],
    queryFn: () => conversationService.list(),
    enabled: isAuthenticated,
    retry: 0,
  });
}

export function useConversation(id: string) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["conversation", id],
    queryFn: () => conversationService.getById(id),
    enabled: isAuthenticated && Boolean(id),
    retry: 0,
  });
}

/**
 * Message history from REST + realtime appends from the socket room.
 * History stays in the query cache so messages survive a refresh.
 */
export function useMessages(conversationId: string) {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const { socket, isConnected } = useSocket();

  const query = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => conversationService.messages(conversationId),
    enabled: isAuthenticated && Boolean(conversationId),
    retry: 0,
  });

  useEffect(() => {
    if (!socket || !conversationId || !isConnected) return;
    joinConversation(conversationId);
    return () => leaveConversation(conversationId);
  }, [socket, conversationId, isConnected]);

  useEffect(() => {
    if (!socket || !conversationId) return;

    function onNew(raw: unknown, event: string) {
      const message = normaliseMessage((raw ?? {}) as Record<string, never>);
      console.info("[Chat] realtime message received", {
        event,
        activeConversationId: conversationId,
        payloadConversationId: message.conversationId,
        messageId: message.id,
        senderId: message.senderId,
        bodyLength: message.body.length,
        rawKeys: raw && typeof raw === "object" ? Object.keys(raw as object) : typeof raw,
      });
      if (message.conversationId && message.conversationId !== conversationId) {
        console.warn("[Chat] ignoring message for another conversation", {
          payloadConversationId: message.conversationId,
          activeConversationId: conversationId,
        });
        return;
      }

      queryClient.setQueryData<Message[]>(["messages", conversationId], (prev = []) => {
        if (message.id && prev.some((m) => m.id === message.id)) return prev;
        const withoutOptimistic = prev.filter(
          (m) => !(m.pending && m.body === message.body && m.senderId === message.senderId),
        );
        return [...withoutOptimistic, { ...message, conversationId }];
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }

    return onAnyNewMessage(onNew);
  }, [socket, conversationId, queryClient]);


  const sendMutation = useMutation({
    mutationFn: async (body: string) => {
      console.info("[Chat] sending message", {
        conversationId,
        socketConnected: isConnected,
        length: body.length,
      });

      const realtimeRequest = sendMessageViaSocket(conversationId, body);
      if (realtimeRequest) {
        const response = await realtimeRequest;
        const message = normaliseMessage(response);
        console.info("[Chat] realtime send succeeded", {
          messageId: message.id,
          returnedConversationId: message.conversationId || conversationId,
        });
        return message;
      }

      console.info("[Chat] using REST fallback because socket is disconnected", { conversationId });
      const message = await conversationService.sendMessage(conversationId, body);
      console.info("[Chat] REST send succeeded", {
        messageId: message.id,
        returnedConversationId: message.conversationId,
      });
      return message;
    },
    onMutate: (body) => {
      const optimistic: Message = {
        id: `pending-${Date.now()}`,
        conversationId,
        senderId: user?.id ?? "me",
        senderName: user?.fullName ?? null,
        senderRole: user?.role ?? "user",
        body,
        createdAt: new Date().toISOString(),
        pending: true,
      };
      queryClient.setQueryData<Message[]>(["messages", conversationId], (prev = []) => [
        ...prev,
        optimistic,
      ]);
      return { optimisticId: optimistic.id };
    },
    onSuccess: (message, _body, context) => {
      queryClient.setQueryData<Message[]>(["messages", conversationId], (prev = []) => {
        const cleaned = prev.filter((m) => m.id !== context?.optimisticId);
        if (message.id && cleaned.some((m) => m.id === message.id)) return cleaned;
        return [...cleaned, { ...message, conversationId }];
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error, _body, context) => {
      console.error("[Chat] send failed", error);
      queryClient.setQueryData<Message[]>(["messages", conversationId], (prev = []) =>
        prev.filter((m) => m.id !== context?.optimisticId),
      );
    },
  });



  return {
    messages: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isConnected,
    sendMessage: sendMutation.mutate,
    isSending: sendMutation.isPending,
    sendError: sendMutation.error,
  };
}
