import { apiClient, fileToBase64 } from "./apiClient";
import { normaliseAccount, rowId } from "./accountService";
import type { DealStatus, Order, OrderItem, PaymentStatus } from "@/types/order";

type Row = Record<string, unknown>;

function str(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

function normaliseItems(row: Row): OrderItem[] {
  if (Array.isArray(row["items"])) {
    return (row["items"] as unknown[])
      .map((entry) => {
        const item = (entry ?? {}) as Row;
        const account = normaliseAccount(item["account"] ?? item);
        const price = Number(item["price"] ?? account.price);
        return { account, ...(Number.isFinite(price) ? { price } : {}) };
      })
      .filter((item) => item.account.id.length > 0);
  }
  if (row["account"]) return [{ account: normaliseAccount(row["account"]) }];
  return [];
}

export function normaliseOrder(raw: unknown): Order {
  const row = (raw ?? {}) as Row;
  const method = (row["paymentMethod"] ?? null) as Row | string | null;
  const methodObj = method && typeof method === "object" ? method : null;
  const screenshot = (row["paymentScreenshot"] ?? null) as Row | string | null;

  return {
    id: rowId(row),
    items: normaliseItems(row),
    amount: Number(row["amount"] ?? row["total"] ?? 0),
    paymentMethod: typeof method === "string" ? method : rowId(methodObj) || null,
    paymentMethodName: methodObj ? str(methodObj["name"]) || null : null,
    paymentStatus: (str(row["paymentStatus"]) || "pending") as PaymentStatus,
    dealStatus: (str(row["dealStatus"]) || "pending") as DealStatus,
    paymentScreenshotUrl:
      (typeof screenshot === "string" ? screenshot : str(screenshot?.["url"])) || null,
    reviewNote: (row["reviewNote"] as string | undefined) ?? null,
    conversationId: rowId(row["conversation"]) || str(row["conversationId"]) || null,
    canReview: (row["canReview"] as boolean | undefined) ?? null,
    hasReview: (row["hasReview"] as boolean | undefined) ?? null,
    ...(row["createdAt"] ? { createdAt: String(row["createdAt"]) } : {}),
  };
}

export interface CreateOrderPayload {
  /** Buy Now sends a single id; cart checkout sends every selected account. */
  accountIds: string[];
  paymentMethod?: string | undefined;
  /** Set when the order is created from the stored cart. */
  fromCart?: boolean | undefined;
}

/**
 * Order APIs. The backend validates availability and computes the authoritative
 * price/total — the frontend only displays what it receives.
 */
export const orderService = {
  /** Buy Now creates one order; cart checkout creates one order per cart item. */
  async create(payload: CreateOrderPayload): Promise<Order> {
    const paymentMethodId = payload.paymentMethod;
    if (payload.fromCart) {
      const { data } = await apiClient.post<Row>("/orders/cart/checkout", {
        ...(paymentMethodId ? { paymentMethodId } : {}),
      });
      const body = (data ?? {}) as Row;
      const orders = Array.isArray(body["orders"]) ? (body["orders"] as unknown[]) : [];
      return normaliseOrder(orders[0] ?? body["order"] ?? body);
    }

    const { data } = await apiClient.post<Row>("/orders", {
      accountId: payload.accountIds[0],
      ...(paymentMethodId ? { paymentMethodId } : {}),
    });
    const body = (data ?? {}) as Row;
    return normaliseOrder(body["order"] ?? body);
  },

  async list(): Promise<Order[]> {
    const { data } = await apiClient.get<Row | unknown[]>("/orders");
    const body = (data ?? {}) as Row;
    const rows = Array.isArray(data) ? (data as unknown[]) : (body["orders"] as unknown[]) ?? [];
    return (Array.isArray(rows) ? rows : []).map(normaliseOrder);
  },

  async getById(id: string): Promise<Order> {
    const { data } = await apiClient.get<Row>(`/orders/${id}`);
    const body = (data ?? {}) as Row;
    return normaliseOrder(body["order"] ?? body);
  },

  /**
   * POST /api/orders/:orderId/payment — the screenshot is sent as base64 so the
   * backend can forward it to Cloudinary; no Cloudinary secret hits the browser.
   */
  async submitPayment(
    orderId: string,
    input: { paymentMethod: string; screenshot: File; reference?: string },
  ): Promise<Order> {
    const screenshotBase64 = await fileToBase64(input.screenshot);
    const { data } = await apiClient.post<Row>(`/orders/${orderId}/payment`, {
      paymentMethodId: input.paymentMethod,
      screenshotBase64,
      ...(input.reference ? { reference: input.reference } : {}),
    });
    const body = (data ?? {}) as Row;
    return normaliseOrder(body["order"] ?? body);
  },
};
