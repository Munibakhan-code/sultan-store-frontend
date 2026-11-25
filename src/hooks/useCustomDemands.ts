import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customDemandService } from "@/services/customDemandService";
import { useAuth } from "@/hooks/useAuth";
import type { CreateCustomDemandPayload } from "@/types/demand";

export function useCustomDemands() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["custom-demands"],
    queryFn: () => customDemandService.list(),
    enabled: isAuthenticated,
    retry: 0,
  });
}

export function useCreateCustomDemand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCustomDemandPayload) => customDemandService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-demands"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
