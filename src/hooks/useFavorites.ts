import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { favoritesService } from "@/services/favoritesService";
import { getApiErrorMessage } from "@/services/apiClient";
import { notify } from "@/components/common/Toast";
import { useAuth } from "@/hooks/useAuth";

export function useFavorites() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["favorites"],
    queryFn: () => favoritesService.list(),
    enabled: isAuthenticated,
    retry: 0,
  });

  const favoriteIds = new Set((query.data ?? []).map((a) => a.id));

  const mutation = useMutation({
    mutationFn: async ({ accountId, next }: { accountId: string; next: boolean }) => {
      if (next) await favoritesService.add(accountId);
      else await favoritesService.remove(accountId);
      return next;
    },
    onSuccess: (next) => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      notify.success(next ? "Added to favorites" : "Removed from favorites");
    },
    onError: (error) => notify.error("Favorites", getApiErrorMessage(error)),
  });

  const toggleFavorite = useCallback(
    (accountId: string) => {
      if (!isAuthenticated) {
        notify.info("Sign in required", "Log in to save accounts to your favorites.");
        return;
      }
      mutation.mutate({ accountId, next: !favoriteIds.has(accountId) });
    },
    [isAuthenticated, mutation, favoriteIds],
  );

  return {
    favorites: query.data ?? [],
    favoriteIds,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    toggleFavorite,
    isMutating: mutation.isPending,
    isFavorite: (accountId: string) => favoriteIds.has(accountId),
  };
}
