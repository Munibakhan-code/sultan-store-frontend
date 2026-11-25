import { apiClient } from "./apiClient";
import { normaliseAccount } from "./accountService";
import type { Account } from "@/types/store";

/**
 * GET /api/accounts/favorites
 * POST /api/accounts/favorites/:accountId   (toggle → added)
 * DELETE /api/accounts/favorites/:accountId
 */
export const favoritesService = {
  async list(): Promise<Account[]> {
    const { data } = await apiClient.get<unknown>("/accounts/favorites");
    const body = (data ?? {}) as Record<string, unknown>;
    const rows = Array.isArray(data)
      ? (data as unknown[])
      : ((body["accounts"] ?? body["favorites"] ?? []) as unknown[]);
    return (Array.isArray(rows) ? rows : []).map(normaliseAccount);
  },

  async add(accountId: string): Promise<void> {
    await apiClient.post(`/accounts/favorites/${accountId}`);
  },

  async remove(accountId: string): Promise<void> {
    await apiClient.delete(`/accounts/favorites/${accountId}`);
  },
};
