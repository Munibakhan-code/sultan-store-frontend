import type { Account, AccountStatus } from "./store";
import type { DealStatus, PaymentMethod, PaymentStatus } from "./order";

/** GET /api/admin/analytics (or /api/admin/stats) — all figures are backend-computed. */
export interface AdminStats {
  totalAccounts: number;
  availableAccounts: number;
  soldAccounts: number;
  totalCustomers: number;
  totalOrders: number;
  pendingPayments: number;
  pendingDeals: number;
  completedDeals: number;
  revenue: number;
}

export interface AdminCustomer {
  id: string;
  fullName: string;
  email: string;
  role: string;
  emailVerified?: boolean | null;
  disabled?: boolean | null;
  ordersCount?: number | null;
  totalSpent?: number | null;
  createdAt?: string | null;
}

/** Payment submission awaiting admin review. */
export interface AdminPayment {
  id: string;
  orderId: string;
  customerName?: string | null;
  customerEmail?: string | null;
  amount: number;
  paymentMethodName?: string | null;
  screenshotUrl?: string | null;
  status: PaymentStatus;
  createdAt?: string | null;
}

export interface AdminSettings {
  heroVideoUrl?: string | null;
  themeColor?: string | null;
}

/** Payload for creating/updating an account. Credentials are never part of this. */
export interface AccountFormValues {
  title: string;
  description: string;
  pricePKR: number;
  priceUSD: number;
  level?: number | undefined;
  rank?: string | undefined;
  status: AccountStatus;
  skins: string[];
  weapons: string[];
  outfits: string[];
  images: string[];
}

export type AdminAccount = Account;

export interface PaymentMethodFormValues {
  type: string;
  name: string;
  enabled: boolean;
  instructions?: string | undefined;
  details: Record<string, string>;
  /** Optional data-URL logo sent on create (max 1MB). */
  logoBase64?: string | undefined;
}

/** Cloudinary logo returned by the payment-method logo endpoints. */
export interface PaymentMethodLogo {
  url: string;
  publicId?: string | undefined;
}

export type { PaymentMethod, DealStatus, PaymentStatus };

export const DEAL_STATUS_OPTIONS: { value: DealStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "credentials_sent", label: "Credentials sent" },
  { value: "completed", label: "Completed" },
];

/** Preset accents for the appearance page — all applied through one CSS variable. */
export const THEME_PRESETS: { label: string; value: string }[] = [
  { label: "Sultan Gold", value: "#D4AF37" },
  { label: "Royal Blue", value: "#3B82F6" },
  { label: "Emerald", value: "#10B981" },
  { label: "Crimson", value: "#EF4444" },
  { label: "Violet", value: "#8B5CF6" },
  { label: "Cyan", value: "#06B6D4" },
];

export const DEFAULT_THEME_COLOR = "#D4AF37";
