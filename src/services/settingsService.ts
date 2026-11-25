import { apiClient } from "./apiClient";
import type { PublicSettings, WhatsAppSettings } from "@/types/store";

type Row = Record<string, unknown>;

export function normaliseWhatsApp(raw: unknown): WhatsAppSettings {
  const body = (raw ?? {}) as Row;
  const row = (body["settings"] && typeof body["settings"] === "object"
    ? body["settings"]
    : body) as Row;
  const phone = row["phoneNumber"] ?? row["phone"] ?? row["number"];
  return {
    phoneNumber: phone ? String(phone) : null,
    isEnabled:
      row["isEnabled"] === undefined && row["enabled"] === undefined
        ? null
        : Boolean(row["isEnabled"] ?? row["enabled"]),
    messageTemplate: row["messageTemplate"] ? String(row["messageTemplate"]) : null,
  };
}

/** GET /api/settings/public — hero video URL & theme color come from the backend. */
export const settingsService = {
  async getPublic(): Promise<PublicSettings> {
    const { data } = await apiClient.get<PublicSettings | { settings: PublicSettings }>(
      "/settings/public",
    );
    return "settings" in (data as { settings?: PublicSettings })
      ? (data as { settings: PublicSettings }).settings
      : (data as PublicSettings);
  },

  /** GET /api/settings/whatsapp — floating WhatsApp button config. */
  async getWhatsApp(): Promise<WhatsAppSettings> {
    const { data } = await apiClient.get("/settings/whatsapp");
    return normaliseWhatsApp(data);
  },
};
