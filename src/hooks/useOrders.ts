import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orderService, type CreateOrderPayload } from "@/services/orderService";
import { useAuth } from "@/hooks/useAuth";

export function useOrders() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["orders"],
    queryFn: () => orderService.list(),
    enabled: isAuthenticated,
    retry: 0,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: () => orderService.getById(id),
    enabled: Boolean(id),
    retry: 0,
  });
}

/** Creates an order (Buy Now or cart checkout). Backend validates availability + price. */
export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => orderService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useSubmitPayment(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { paymentMethod: string; screenshot: File; reference?: string }) =>
      orderService.submitPayment(orderId, input),
    onSuccess: (order) => {
      queryClient.setQueryData(["order", orderId], order);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
