import { apiClient } from "./apiClient";
import { normaliseAccount } from "./accountService";
import type { CartItem } from "@/types/store";

type Row = Record<string, unknown>;

/** The backend returns `{ cart: { items: [{ account }] } }`. */
function normalise(data: unknown): CartItem[] {
  const body = (data ?? {}) as Row;
  const cart = (body["cart"] ?? body) as Row;
  const rawItems = Array.isArray(data) ? (data as unknown[]) : (cart["items"] as unknown[]) ?? [];
  return (Array.isArray(rawItems) ? rawItems : [])
    .map((entry) => {
      const item = (entry ?? {}) as Row;
      const account = normaliseAccount(item["account"] ?? item);
      return { account } satisfies CartItem;
    })
    .filter((item) => item.account.id.length > 0);
}

/**
 * GET /api/cart
 * POST /api/cart/:accountId
 * DELETE /api/cart/:accountId
 * DELETE /api/cart
 */
export const cartService = {
  async list(): Promise<CartItem[]> {
    const { data } = await apiClient.get<unknown>("/cart");
    return normalise(data);
  },

  async add(accountId: string): Promise<void> {
    await apiClient.post(`/cart/${accountId}`);
  },

  async remove(accountId: string): Promise<void> {
    await apiClient.delete(`/cart/${accountId}`);
  },

  async clear(): Promise<void> {
    await apiClient.delete("/cart");
  },
};
