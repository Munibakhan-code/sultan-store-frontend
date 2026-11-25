import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cartService } from "@/services/cartService";
import { getApiErrorMessage } from "@/services/apiClient";
import { notify } from "@/components/common/Toast";
import { useAuth } from "@/hooks/useAuth";

export function useCart() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["cart"],
    queryFn: () => cartService.list(),
    enabled: isAuthenticated,
    retry: 0,
  });

  const items = query.data ?? [];
  const total = items.reduce((sum, item) => sum + (item.account?.price ?? 0), 0);
  const accountIds = new Set(items.map((item) => item.account?.id));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["cart"] });

  const addMutation = useMutation({
    mutationFn: (accountId: string) => cartService.add(accountId),
    onSuccess: () => {
      invalidate();
      notify.success("Added to cart");
    },
    onError: (error) => notify.error("Cart", getApiErrorMessage(error)),
  });

  const removeMutation = useMutation({
    mutationFn: (accountId: string) => cartService.remove(accountId),
    onSuccess: () => {
      invalidate();
      notify.success("Removed from cart");
    },
    onError: (error) => notify.error("Cart", getApiErrorMessage(error)),
  });

  const clearMutation = useMutation({
    mutationFn: () => cartService.clear(),
    onSuccess: () => {
      invalidate();
      notify.success("Cart cleared");
    },
    onError: (error) => notify.error("Cart", getApiErrorMessage(error)),
  });

  const addToCart = useCallback(
    (accountId: string) => {
      if (!isAuthenticated) {
        notify.info("Sign in required", "Log in to add accounts to your cart.");
        return;
      }
      addMutation.mutate(accountId);
    },
    [isAuthenticated, addMutation],
  );

  return {
    items,
    total,
    count: items.length,
    accountIds,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    addToCart,
    removeFromCart: removeMutation.mutate,
    clearCart: clearMutation.mutate,
    isMutating: addMutation.isPending || removeMutation.isPending || clearMutation.isPending,
    inCart: (accountId: string) => accountIds.has(accountId),
  };
}
