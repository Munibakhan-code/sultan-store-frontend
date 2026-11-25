import { apiClient } from "./apiClient";
import { rowId } from "./accountService";
import type { CreateReviewPayload, Review, ReviewStatus } from "@/types/review";

type Row = Record<string, unknown>;

function str(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

export function normaliseReview(raw: unknown): Review {
  const row = (raw ?? {}) as Row;
  const user = (row["user"] ?? {}) as Row;
  const order = (row["order"] ?? {}) as Row;
  const account = (order["account"] ?? row["account"] ?? {}) as Row;
  return {
    id: rowId(row),
    orderId: rowId(row["order"]) || str(row["orderId"]) || null,
    accountId: rowId(account) || null,
    accountTitle: str(account["title"]) || null,
    authorName: str(user["name"] ?? user["fullName"]) || null,
    authorAvatarUrl: str(user["avatarUrl"]) || null,
    rating: Number(row["rating"] ?? 0),
    comment: str(row["comment"]) || null,
    status: (str(row["status"]) || "pending") as ReviewStatus,
    createdAt: (row["createdAt"] as string | undefined) ?? null,
  };
}

function list(data: unknown): Review[] {
  const body = (data ?? {}) as Row;
  const rows = Array.isArray(data) ? (data as unknown[]) : (body["reviews"] as unknown[]) ?? [];
  return (Array.isArray(rows) ? rows : []).map(normaliseReview);
}

/**
 * Reviews. Publishing is admin-only on the backend — the frontend never sends
 * or changes a review status.
 */
export const reviewService = {
  async listPublic(): Promise<Review[]> {
    const { data } = await apiClient.get("/reviews/public");
    return list(data);
  },

  async listMine(): Promise<Review[]> {
    const { data } = await apiClient.get("/reviews/my");
    return list(data);
  },

  async create(payload: CreateReviewPayload): Promise<Review> {
    const { data } = await apiClient.post("/reviews", payload);
    const body = (data ?? {}) as Row;
    return normaliseReview(body["review"] ?? body);
  },
};
