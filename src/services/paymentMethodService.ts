import { apiClient } from "./apiClient";
import { rowId } from "./accountService";
import type { PaymentMethod } from "@/types/order";

type Row = Record<string, unknown>;

function str(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

export function normalisePaymentMethod(raw: unknown): PaymentMethod {
  const row = (raw ?? {}) as Row;
  const id = rowId(row) || str(row["type"]);
  const details = (row["details"] ?? row["info"] ?? {}) as Record<string, string>;
  const logo = (row["logo"] ?? null) as Row | string | null;
  const logoUrl =
    typeof logo === "string" ? logo : str(logo?.["url"] ?? row["logoUrl"] ?? row["logo_url"]);
  const logoPublicId = typeof logo === "string" ? "" : str(logo?.["publicId"] ?? logo?.["public_id"]);
  const instructions = str(row["instructions"] ?? details["instructions"]);

  return {
    id,
    type: str(row["type"]) || id,
    name: str(row["name"] ?? row["label"]) || id,
    enabled: Boolean(row["enabled"] ?? row["isEnabled"] ?? true),
    ...(instructions ? { instructions } : {}),
    ...(logoUrl ? { logoUrl } : {}),
    ...(logoPublicId ? { logoPublicId } : {}),
    details,
  };
}

/** GET /api/payment-methods — backend owns which methods exist and are enabled. */
export const paymentMethodService = {
  async list(): Promise<PaymentMethod[]> {
    const { data } = await apiClient.get("/payment-methods");
    const body = (data ?? {}) as Row;
    const rows = Array.isArray(data)
      ? (data as unknown[])
      : ((body["methods"] ?? body["paymentMethods"] ?? []) as unknown[]);
    return (Array.isArray(rows) ? rows : [])
      .map(normalisePaymentMethod)
      .filter((method) => method.id.length > 0);
  },
};
