import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reviewService } from "@/services/reviewService";
import { useAuth } from "@/hooks/useAuth";
import type { CreateReviewPayload } from "@/types/review";

/** Published reviews only — safe for the public home page. */
export function usePublicReviews() {
  return useQuery({
    queryKey: ["reviews", "public"],
    queryFn: () => reviewService.listPublic(),
    retry: 0,
  });
}

export function useMyReviews() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["reviews", "mine"],
    queryFn: () => reviewService.listMine(),
    enabled: isAuthenticated,
    retry: 0,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReviewPayload) => reviewService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
