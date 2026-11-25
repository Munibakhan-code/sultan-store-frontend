import { apiClient, fileToBase64 } from "./apiClient";
import { normaliseAccount, rowId } from "./accountService";
import { normaliseOrder } from "./orderService";
import { normaliseConversation } from "./conversationService";
import { normaliseReview } from "./reviewService";
import { normaliseDemand } from "./customDemandService";
import { normalisePaymentMethod } from "./paymentMethodService";
import { normaliseWhatsApp } from "./settingsService";
import type { Account, WhatsAppSettings } from "@/types/store";
import type { DealStatus, Order, PaymentMethod } from "@/types/order";
import type { Conversation } from "@/types/chat";
import type { Review, ReviewStatus } from "@/types/review";
import type { CustomDemand } from "@/types/demand";
import type {
  AccountFormValues,
  AdminCustomer,
  AdminPayment,
  AdminSettings,
  AdminStats,
  PaymentMethodFormValues,
  PaymentMethodLogo,
} from "@/types/admin";

/** Logo rules shared with the admin UI. */
export const LOGO_MAX_BYTES = 1024 * 1024;
export const LOGO_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
];

export function validateLogoFile(file: File): string | null {
  if (!LOGO_TYPES.includes(file.type)) {
    return "Please choose a PNG, JPG, JPEG, WEBP or SVG image.";
  }
  if (file.size > LOGO_MAX_BYTES) {
    return `Image is ${(file.size / 1024 / 1024).toFixed(2)}MB. Please use an image under 1MB.`;
  }
  return null;
}

async function logoToBase64(file: File): Promise<string> {
  const problem = validateLogoFile(file);
  if (problem) throw new Error(problem);
  return fileToBase64(file);
}

type Row = Record<string, unknown>;

function rows(data: unknown, ...keys: string[]): unknown[] {
  if (Array.isArray(data)) return data;
  const obj = (data ?? {}) as Row;
  for (const key of keys) {
    const value = obj[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function one(data: unknown, ...keys: string[]): Row {
  const obj = (data ?? {}) as Row;
  for (const key of keys) {
    const value = obj[key];
    if (value && typeof value === "object") return value as Row;
  }
  return obj;
}

function str(value: unknown, fallback = ""): string {
  return value === null || value === undefined ? fallback : String(value);
}

function num(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/* ------------------------------- normalisers ------------------------------ */

function normaliseStats(row: Row): AdminStats {
  return {
    totalAccounts: num(row["totalAccounts"]),
    availableAccounts: num(row["availableAccounts"]),
    soldAccounts: num(row["soldAccounts"]),
    totalCustomers: num(row["totalUsers"] ?? row["totalCustomers"]),
    totalOrders: num(row["totalOrders"]),
    pendingPayments: num(row["pendingPayments"]),
    pendingDeals: num(row["pendingDeals"]),
    completedDeals: num(row["completedDeals"]),
    revenue: num(row["totalRevenue"] ?? row["revenue"]),
  };
}

function normaliseCustomer(raw: unknown): AdminCustomer {
  const row = (raw ?? {}) as Row;
  return {
    id: rowId(row),
    fullName: str(row["name"] ?? row["fullName"], "Customer"),
    email: str(row["email"]),
    role: str(row["role"], "user"),
    emailVerified: (row["isEmailVerified"] as boolean | undefined) ?? null,
    disabled: ((row["disabled"] ?? row["isDisabled"] ?? row["blocked"]) as boolean | null) ?? null,
    ordersCount:
      row["orderCount"] === undefined && row["ordersCount"] === undefined
        ? null
        : num(row["orderCount"] ?? row["ordersCount"]),
    totalSpent: row["totalSpent"] === undefined ? null : num(row["totalSpent"]),
    createdAt: (row["createdAt"] as string | undefined) ?? null,
  };
}

/** Payments are the payment side of an order — the backend has no payment collection. */
function paymentFromOrder(order: Order, raw: unknown): AdminPayment {
  const row = (raw ?? {}) as Row;
  const buyer = (row["buyer"] ?? row["user"] ?? {}) as Row;
  return {
    id: order.id,
    orderId: order.id,
    customerName: str(buyer["name"] ?? buyer["fullName"]) || null,
    customerEmail: str(buyer["email"]) || null,
    amount: order.amount,
    paymentMethodName: order.paymentMethodName ?? null,
    screenshotUrl: order.paymentScreenshotUrl ?? null,
    status: order.paymentStatus,
    createdAt: order.createdAt ?? null,
  };
}

export type AdminCustomDemand = CustomDemand & {
  customerName?: string | null;
  customerEmail?: string | null;
};

function normaliseAdminDemand(raw: unknown): AdminCustomDemand {
  const row = (raw ?? {}) as Row;
  const user = (row["user"] ?? {}) as Row;
  return {
    ...normaliseDemand(row),
    customerName: str(user["name"] ?? user["fullName"]) || null,
    customerEmail: str(user["email"]) || null,
  };
}

/** Media never travels with the account body — it has its own endpoint. */
function accountPayload(payload: Partial<AccountFormValues>) {
  const { images: _images, ...rest } = payload;
  return rest;
}

/** Long uploads must never abort client-side, so media requests have no timeout. */
const UPLOAD_CONFIG = { timeout: 0 } as const;

/* --------------------------------- service -------------------------------- */

/**
 * Admin REST layer. Every mutation is authorised server-side; the frontend
 * guard is UI-only. No payment credentials, hero URLs or theme colors are
 * hardcoded here — the backend owns all of it.
 */
export const adminService = {
  async stats(): Promise<AdminStats> {
    const { data } = await apiClient.get("/admin/analytics");
    const body = (data ?? {}) as Row;
    return normaliseStats((body["analytics"] ?? body["stats"] ?? body) as Row);
  },

  /* accounts */
  async listAccounts(): Promise<Account[]> {
    const { data } = await apiClient.get("/admin/accounts", { params: { limit: 100 } });
    return rows(data, "accounts").map(normaliseAccount);
  },
  /** Details only — media is uploaded one file at a time afterwards. */
  async createAccount(payload: AccountFormValues): Promise<Account> {
    const { data } = await apiClient.post("/admin/accounts", accountPayload(payload));
    return normaliseAccount(one(data, "account"));
  },
  async updateAccount(accountId: string, payload: Partial<AccountFormValues>): Promise<Account> {
    const { data } = await apiClient.patch(`/admin/accounts/${accountId}`, accountPayload(payload));
    return normaliseAccount(one(data, "account"));
  },
  async deleteAccount(accountId: string): Promise<void> {
    await apiClient.delete(`/admin/accounts/${accountId}`);
  },
  /**
   * POST /admin/accounts/:id/images with ONE base64 asset. Uploading a single
   * file per request is what keeps Cloudinary from timing out.
   */
  async uploadAccountMedia(
    accountId: string,
    dataUrl: string,
    onProgress?: (percent: number) => void,
  ): Promise<string[]> {
    const { data } = await apiClient.post(
      `/admin/accounts/${accountId}/images`,
      { images: dataUrl },
      {
        ...UPLOAD_CONFIG,
        onUploadProgress: (event) => {
          if (!onProgress) return;
          const total = event.total ?? 0;
          onProgress(total > 0 ? Math.round((event.loaded / total) * 100) : 100);
        },
      },
    );
    return rows(data, "images")
      .map((entry) => (typeof entry === "string" ? entry : str((entry as Row)["url"])))
      .filter(Boolean);
  },
  /** DELETE /admin/accounts/:id/images/:publicId */
  async deleteAccountMedia(accountId: string, publicId: string): Promise<void> {
    await apiClient.delete(
      `/admin/accounts/${accountId}/images/${encodeURIComponent(publicId)}`,
    );
  },

  /* payments (order payment submissions) */
  async listPayments(status = "submitted"): Promise<AdminPayment[]> {
    const { data } = await apiClient.get("/admin/orders", {
      params: { status, limit: 100 },
    });
    return rows(data, "orders").map((row) => paymentFromOrder(normaliseOrder(row), row));
  },
  async approvePayment(orderId: string): Promise<void> {
    await apiClient.post(`/admin/orders/${orderId}/approve`);
  },
  async rejectPayment(orderId: string, reason?: string): Promise<void> {
    await apiClient.post(`/admin/orders/${orderId}/reject`, reason ? { reason } : {});
  },

  /* orders / deals */
  async listOrders(status?: string): Promise<Order[]> {
    const { data } = await apiClient.get("/admin/orders", {
      params: { limit: 100, ...(status ? { status } : {}) },
    });
    return rows(data, "orders").map(normaliseOrder);
  },
  async updateOrderStatus(orderId: string, dealStatus: DealStatus): Promise<Order> {
    const { data } = await apiClient.patch(`/admin/orders/${orderId}/status`, { dealStatus });
    return normaliseOrder(one(data, "order"));
  },

  /* customers */
  async listCustomers(): Promise<AdminCustomer[]> {
    const { data } = await apiClient.get("/admin/customers", { params: { limit: 100 } });
    return rows(data, "customers", "users").map(normaliseCustomer);
  },
  /** The customer detail endpoint returns the recent order history inline. */
  async customerOrders(customerId: string): Promise<Order[]> {
    const { data } = await apiClient.get(`/admin/customers/${customerId}`);
    const customer = one(data, "customer");
    return rows(customer, "recentOrders", "orders").map(normaliseOrder);
  },
  async setCustomerDisabled(customerId: string, disabled: boolean): Promise<void> {
    await apiClient.patch(`/admin/customers/${customerId}/status`, { disabled });
  },

  /* reviews */
  async listReviews(status?: string): Promise<Review[]> {
    const { data } = await apiClient.get("/admin/reviews", {
      params: status && status !== "all" ? { status } : {},
    });
    return rows(data, "reviews").map(normaliseReview);
  },
  async setReviewStatus(reviewId: string, status: ReviewStatus): Promise<void> {
    await apiClient.patch(`/admin/reviews/${reviewId}/status`, { status });
  },
  async deleteReview(reviewId: string): Promise<void> {
    await apiClient.delete(`/admin/reviews/${reviewId}`);
  },

  /* custom demands */
  async listCustomDemands(): Promise<AdminCustomDemand[]> {
    const { data } = await apiClient.get("/admin/custom-demands");
    return rows(data, "demands", "customDemands").map(normaliseAdminDemand);
  },
  async assistCustomDemand(demandId: string): Promise<{ conversationId: string | null }> {
    const { data } = await apiClient.post(`/admin/custom-demands/${demandId}/assist`);
    const conversation = one(data, "conversation");
    return { conversationId: rowId(conversation) || null };
  },

  /* conversations */
  async listConversations(): Promise<Conversation[]> {
    const { data } = await apiClient.get("/admin/conversations");
    return rows(data, "conversations").map(normaliseConversation);
  },

  /* payment methods */
  async listPaymentMethods(): Promise<PaymentMethod[]> {
    const { data } = await apiClient.get("/admin/payment-methods");
    return rows(data, "methods", "paymentMethods").map(normalisePaymentMethod);
  },
  async createPaymentMethod(payload: PaymentMethodFormValues): Promise<PaymentMethod> {
    const { data } = await apiClient.post("/admin/payment-methods", payload);
    return normalisePaymentMethod(one(data, "method", "paymentMethod"));
  },
  async updatePaymentMethod(
    methodId: string,
    payload: Partial<PaymentMethodFormValues>,
  ): Promise<PaymentMethod> {
    const { data } = await apiClient.patch(`/admin/payment-methods/${methodId}`, payload);
    return normalisePaymentMethod(one(data, "method", "paymentMethod"));
  },
  /** One logo at a time, base64 (max 1MB), with upload progress. */
  async uploadPaymentMethodLogo(
    methodId: string,
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<PaymentMethodLogo> {
    const logoBase64 = await logoToBase64(file);
    const { data } = await apiClient.post(
      `/admin/payment-methods/${methodId}/logo`,
      { logoBase64 },
      {
        ...UPLOAD_CONFIG,
        onUploadProgress: (event) => {
          if (!onProgress) return;
          const total = event.total ?? 0;
          onProgress(total > 0 ? Math.round((event.loaded / total) * 100) : 100);
        },
      },
    );
    const logo = one(data, "logo");
    return {
      url: str(logo["url"]),
      publicId: str(logo["publicId"] ?? logo["public_id"]) || undefined,
    };
  },
  async deletePaymentMethodLogo(methodId: string): Promise<void> {
    await apiClient.delete(`/admin/payment-methods/${methodId}/logo`);
  },

  /* settings */
  async settings(): Promise<AdminSettings> {
    const { data } = await apiClient.get("/admin/settings");
    const row = one(data, "settings");
    return {
      heroVideoUrl: str(row["heroVideoUrl"]) || null,
      themeColor: str(row["themeColor"]) || null,
    };
  },
  /** Base64 upload — the backend owns the Cloudinary credentials. */
  async uploadHeroVideo(
    file: File,
    onProgress?: (percent: number) => void,
  ): Promise<AdminSettings> {
    const videoBase64 = await fileToBase64(file);
    const { data } = await apiClient.post(
      "/admin/settings/hero-video",
      { videoBase64 },
      {
        ...UPLOAD_CONFIG,
        onUploadProgress: (event) => {
          if (!onProgress) return;
          const total = event.total ?? 0;
          onProgress(total > 0 ? Math.round((event.loaded / total) * 100) : 100);
        },
      },
    );
    const body = (data ?? {}) as Row;
    const row = one(data, "settings");
    return {
      heroVideoUrl: str(body["heroVideoUrl"] ?? row["heroVideoUrl"]) || null,
      themeColor: str(row["themeColor"]) || null,
    };
  },
  /* whatsapp */
  async whatsappSettings(): Promise<WhatsAppSettings> {
    const { data } = await apiClient.get("/admin/settings/whatsapp");
    return normaliseWhatsApp(data);
  },
  async updateWhatsapp(payload: Partial<WhatsAppSettings>): Promise<WhatsAppSettings> {
    const { data } = await apiClient.patch("/admin/settings/whatsapp", payload);
    return normaliseWhatsApp(data);
  },
  async updateTheme(themeColor: string): Promise<AdminSettings> {
    const { data } = await apiClient.patch("/admin/settings/theme", { themeColor });
    const body = (data ?? {}) as Row;
    const row = one(data, "settings");
    return {
      heroVideoUrl: str(row["heroVideoUrl"]) || null,
      themeColor: str(body["themeColor"] ?? row["themeColor"] ?? themeColor) || null,
    };
  },
};
