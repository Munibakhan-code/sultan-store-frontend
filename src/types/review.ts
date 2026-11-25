/** Review moderation is backend-owned: customers can never publish their own review. */
export type ReviewStatus = "pending" | "published" | "private";

export interface Review {
  id: string;
  orderId?: string | null;
  accountId?: string | null;
  accountTitle?: string | null;
  authorName?: string | null;
  authorAvatarUrl?: string | null;
  rating: number;
  comment?: string | null;
  status: ReviewStatus;
  createdAt?: string | null;
}

export interface CreateReviewPayload {
  orderId: string;
  rating: number;
  comment: string;
}

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: "Awaiting approval",
  published: "Published",
  private: "Private",
};

export function formatReviewDate(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-PK", { dateStyle: "medium" }).format(date);
}
