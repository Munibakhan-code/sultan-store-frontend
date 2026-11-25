import { useQuery } from "@tanstack/react-query";
import { paymentMethodService } from "@/services/paymentMethodService";

export function usePaymentMethods() {
  const query = useQuery({
    queryKey: ["payment-methods"],
    queryFn: () => paymentMethodService.list(),
    retry: 0,
  });

  const methods = query.data ?? [];
  return {
    ...query,
    methods,
    enabledMethods: methods.filter((method) => method.enabled),
  };
}
