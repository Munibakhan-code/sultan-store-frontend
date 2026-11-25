import { useQuery } from "@tanstack/react-query";
import { accountService } from "@/services/accountService";
import type { AccountQuery } from "@/types/store";

export function useAccounts(query: AccountQuery = {}) {
  return useQuery({
    queryKey: ["accounts", query],
    queryFn: () => accountService.list(query),
    retry: 0,
  });
}

export function useAccount(id: string) {
  return useQuery({
    queryKey: ["account", id],
    queryFn: () => accountService.getById(id),
    enabled: Boolean(id),
    retry: 0,
  });
}
