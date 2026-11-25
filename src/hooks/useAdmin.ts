import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/adminService";
import { fileToBase64 } from "@/services/apiClient";
import { useAuth } from "@/hooks/useAuth";
import type { DealStatus } from "@/types/order";
import type { ReviewStatus } from "@/types/review";
import type { WhatsAppSettings } from "@/types/store";
import type { AccountFormValues, PaymentMethodFormValues } from "@/types/admin";

/** Every admin query only runs for an authenticated admin session. */
function useAdminEnabled() {
  const { isAdmin, isAuthenticated } = useAuth();
  return isAuthenticated && isAdmin;
}

export function useAdminStats() {
  const enabled = useAdminEnabled();
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => adminService.stats(),
    enabled,
    retry: 0,
  });
}

/* --------------------------------- accounts -------------------------------- */

export function useAdminAccounts() {
  const enabled = useAdminEnabled();
  return useQuery({
    queryKey: ["admin", "accounts"],
    queryFn: () => adminService.listAccounts(),
    enabled,
    retry: 0,
  });
}

function useInvalidateAccounts() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "accounts"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
  };
}

export function useCreateAccount() {
  const invalidate = useInvalidateAccounts();
  return useMutation({
    mutationFn: (payload: AccountFormValues) => adminService.createAccount(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateAccount() {
  const invalidate = useInvalidateAccounts();
  return useMutation({
    mutationFn: (vars: { id: string; payload: Partial<AccountFormValues> }) =>
      adminService.updateAccount(vars.id, vars.payload),
    onSuccess: invalidate,
  });
}

export function useDeleteAccount() {
  const invalidate = useInvalidateAccounts();
  return useMutation({
    mutationFn: (id: string) => adminService.deleteAccount(id),
    onSuccess: invalidate,
  });
}

/**
 * Media are read locally as base64 and uploaded ONE file per request once the
 * account exists — batching them is what caused Cloudinary timeouts.
 */
export function useReadAccountImages() {
  return useMutation({
    mutationFn: (files: File[]) => Promise.all(files.map((file) => fileToBase64(file))),
  });
}

export function useUploadAccountMedia() {
  const invalidate = useInvalidateAccounts();
  return useMutation({
    mutationFn: (vars: {
      accountId: string;
      dataUrl: string;
      onProgress?: (percent: number) => void;
    }) => adminService.uploadAccountMedia(vars.accountId, vars.dataUrl, vars.onProgress),
    onSuccess: invalidate,
  });
}

export function useDeleteAccountMedia() {
  const invalidate = useInvalidateAccounts();
  return useMutation({
    mutationFn: (vars: { accountId: string; publicId: string }) =>
      adminService.deleteAccountMedia(vars.accountId, vars.publicId),
    onSuccess: invalidate,
  });
}

/* --------------------------------- payments -------------------------------- */

export function useAdminPayments(status = "submitted") {
  const enabled = useAdminEnabled();
  return useQuery({
    queryKey: ["admin", "payments", status],
    queryFn: () => adminService.listPayments(status),
    enabled,
    retry: 0,
    // Keep rows on screen when coming back from a detail page.
    gcTime: 30 * 60_000,
    staleTime: 30_000,
    refetchOnMount: "always",
    placeholderData: (previous: unknown) => previous as never,
  });
}

function useInvalidatePayments() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
  };
}

export function useApprovePayment() {
  const invalidate = useInvalidatePayments();
  return useMutation({
    mutationFn: (id: string) => adminService.approvePayment(id),
    onSuccess: invalidate,
  });
}

export function useRejectPayment() {
  const invalidate = useInvalidatePayments();
  return useMutation({
    mutationFn: (vars: { id: string; reason?: string }) =>
      adminService.rejectPayment(vars.id, vars.reason),
    onSuccess: invalidate,
  });
}

/* ------------------------------ orders / deals ----------------------------- */

export function useAdminOrders(status?: string) {
  const enabled = useAdminEnabled();
  return useQuery({
    queryKey: ["admin", "orders", status ?? "all"],
    queryFn: () => adminService.listOrders(status),
    enabled,
    retry: 0,
    // Keep rows on screen when coming back from an order detail page.
    gcTime: 30 * 60_000,
    staleTime: 30_000,
    refetchOnMount: "always",
    placeholderData: (previous: unknown) => previous as never,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; dealStatus: DealStatus }) =>
      adminService.updateOrderStatus(vars.id, vars.dealStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

/* -------------------------------- customers ------------------------------- */

export function useAdminCustomers() {
  const enabled = useAdminEnabled();
  return useQuery({
    queryKey: ["admin", "customers"],
    queryFn: () => adminService.listCustomers(),
    enabled,
    retry: 0,
  });
}

export function useCustomerOrders(customerId: string | null) {
  const enabled = useAdminEnabled();
  return useQuery({
    queryKey: ["admin", "customer-orders", customerId],
    queryFn: () => adminService.customerOrders(customerId as string),
    enabled: enabled && Boolean(customerId),
    retry: 0,
  });
}

export function useSetCustomerDisabled() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; disabled: boolean }) =>
      adminService.setCustomerDisabled(vars.id, vars.disabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "customers"] }),
  });
}

/* --------------------------------- reviews -------------------------------- */

export function useAdminReviews(status?: string) {
  const enabled = useAdminEnabled();
  return useQuery({
    queryKey: ["admin", "reviews", status ?? "all"],
    queryFn: () => adminService.listReviews(status),
    enabled,
    retry: 0,
  });
}

function useInvalidateReviews() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
    queryClient.invalidateQueries({ queryKey: ["reviews"] });
  };
}

export function useSetReviewStatus() {
  const invalidate = useInvalidateReviews();
  return useMutation({
    mutationFn: (vars: { id: string; status: ReviewStatus }) =>
      adminService.setReviewStatus(vars.id, vars.status),
    onSuccess: invalidate,
  });
}

export function useDeleteReview() {
  const invalidate = useInvalidateReviews();
  return useMutation({
    mutationFn: (id: string) => adminService.deleteReview(id),
    onSuccess: invalidate,
  });
}

/* ----------------------------- custom demands ----------------------------- */

export function useAdminCustomDemands() {
  const enabled = useAdminEnabled();
  return useQuery({
    queryKey: ["admin", "custom-demands"],
    queryFn: () => adminService.listCustomDemands(),
    enabled,
    retry: 0,
  });
}

export function useAssistCustomDemand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.assistCustomDemand(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "custom-demands"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "conversations"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

/* ----------------------------- conversations ------------------------------ */

export function useAdminConversations() {
  const enabled = useAdminEnabled();
  return useQuery({
    queryKey: ["admin", "conversations"],
    queryFn: () => adminService.listConversations(),
    enabled,
    retry: 0,
  });
}

/* ---------------------------- payment methods ----------------------------- */

export function useAdminPaymentMethods() {
  const enabled = useAdminEnabled();
  return useQuery({
    queryKey: ["admin", "payment-methods"],
    queryFn: () => adminService.listPaymentMethods(),
    enabled,
    retry: 0,
  });
}

function useInvalidatePaymentMethods() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "payment-methods"] });
    queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
  };
}

export function useCreatePaymentMethod() {
  const invalidate = useInvalidatePaymentMethods();
  return useMutation({
    mutationFn: (payload: PaymentMethodFormValues) => adminService.createPaymentMethod(payload),
    onSuccess: invalidate,
  });
}

export function useUpdatePaymentMethod() {
  const invalidate = useInvalidatePaymentMethods();
  return useMutation({
    mutationFn: (vars: { id: string; payload: Partial<PaymentMethodFormValues> }) =>
      adminService.updatePaymentMethod(vars.id, vars.payload),
    onSuccess: invalidate,
  });
}

export function useUploadPaymentMethodLogo() {
  const invalidate = useInvalidatePaymentMethods();
  return useMutation({
    mutationFn: (vars: { id: string; file: File; onProgress?: (percent: number) => void }) =>
      adminService.uploadPaymentMethodLogo(vars.id, vars.file, vars.onProgress),
    onSuccess: invalidate,
  });
}

export function useDeletePaymentMethodLogo() {
  const invalidate = useInvalidatePaymentMethods();
  return useMutation({
    mutationFn: (id: string) => adminService.deletePaymentMethodLogo(id),
    onSuccess: invalidate,
  });
}

/* --------------------------------- settings ------------------------------- */

export function useAdminSettings() {
  const enabled = useAdminEnabled();
  return useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => adminService.settings(),
    enabled,
    retry: 0,
  });
}

function useInvalidateSettings() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
    queryClient.invalidateQueries({ queryKey: ["settings", "public"] });
  };
}

export function useUploadHeroVideo() {
  const invalidate = useInvalidateSettings();
  return useMutation({
    mutationFn: (vars: { file: File; onProgress?: (percent: number) => void }) =>
      adminService.uploadHeroVideo(vars.file, vars.onProgress),
    onSuccess: invalidate,
  });
}

export function useUpdateTheme() {
  const invalidate = useInvalidateSettings();
  return useMutation({
    mutationFn: (themeColor: string) => adminService.updateTheme(themeColor),
    onSuccess: invalidate,
  });
}

/* --------------------------------- whatsapp ------------------------------- */

export function useAdminWhatsapp() {
  const enabled = useAdminEnabled();
  return useQuery({
    queryKey: ["admin", "whatsapp"],
    queryFn: () => adminService.whatsappSettings(),
    enabled,
    retry: 0,
  });
}

export function useUpdateWhatsapp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<WhatsAppSettings>) => adminService.updateWhatsapp(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "whatsapp"] });
      queryClient.invalidateQueries({ queryKey: ["settings", "whatsapp"] });
    },
  });
}
