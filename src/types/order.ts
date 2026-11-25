import type { Account } from "./store";

/** Payment lifecycle controlled by the backend/admin review. */
export type PaymentStatus = "pending" | "submitted" | "approved" | "rejected";

/** Deal (handover) lifecycle controlled by the backend/admin. */
export type DealStatus = "pending" | "credentials_sent" | "completed";

/** A payment method row served by GET /api/payment-methods. Nothing is hardcoded here. */
export interface PaymentMethod {
  id: string;
  /** e.g. "binance" | "bank_transfer" — backend supplied. */
  type: string;
  name: string;
  enabled: boolean;
  /** Free-form instructions text from the backend. */
  instructions?: string;
  /** Arbitrary key/value payment info (Binance ID, bank name, IBAN, ...). */
  details?: Record<string, string | number | null>;
  logoUrl?: string;
  logoPublicId?: string;
  note?: string;
}

export interface OrderItem {
  account: Account;
  /** Authoritative per-item price from the backend. */
  price?: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  /** Authoritative order total from the backend. */
  amount: number;
  paymentMethod?: string | null;
  paymentMethodName?: string | null;
  paymentStatus: PaymentStatus;
  dealStatus: DealStatus;
  paymentScreenshotUrl?: string | null;
  reviewNote?: string | null;
  createdAt?: string;
  /** Private deal conversation, opened by the backend once payment is approved. */
  conversationId?: string | null;
  /** Backend-decided review eligibility; frontend falls back to deal status. */
  canReview?: boolean | null;
  /** True once the customer already reviewed this order. */
  hasReview?: boolean | null;
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Payment pending",
  submitted: "Under review",
  approved: "Approved",
  rejected: "Rejected",
};

export const DEAL_STATUS_LABELS: Record<DealStatus, string> = {
  pending: "Deal pending",
  credentials_sent: "Credentials sent",
  completed: "Completed",
};

export function formatOrderDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/** Short, human-friendly order reference for display. */
export function shortOrderId(id: string): string {
  return id.length > 10 ? `#${id.slice(-8).toUpperCase()}` : `#${id.toUpperCase()}`;
}
