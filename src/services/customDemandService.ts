import { apiClient } from "./apiClient";
import { rowId } from "./accountService";
import type { CreateCustomDemandPayload, CustomDemand, CustomDemandStatus } from "@/types/demand";

type Row = Record<string, unknown>;

function str(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

/** The backend stores skins as an array; the form works with a single string. */
function skinsText(value: unknown): string | null {
  if (Array.isArray(value)) return value.map((entry) => String(entry)).join(", ") || null;
  return str(value) || null;
}

export function normaliseDemand(raw: unknown): CustomDemand {
  const row = (raw ?? {}) as Row;
  return {
    id: rowId(row),
    requirements: str(row["requirements"]),
    desiredRank: str(row["rank"] ?? row["desiredRank"]) || null,
    desiredLevel:
      row["level"] === undefined || row["level"] === null ? null : Number(row["level"]),
    desiredSkins: skinsText(row["skins"] ?? row["desiredSkins"]),
    budget: row["budget"] === undefined || row["budget"] === null ? null : Number(row["budget"]),
    additionalNotes: str(row["additionalInformation"] ?? row["additionalNotes"]) || null,
    status: (str(row["status"]) || "pending") as CustomDemandStatus,
    conversationId: rowId(row["conversation"]) || str(row["conversationId"]) || null,
    createdAt: (row["createdAt"] as string | undefined) ?? null,
  };
}

function toPayload(payload: CreateCustomDemandPayload) {
  const skins = payload.desiredSkins
    ? payload.desiredSkins
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
    : [];
  return {
    requirements: payload.requirements,
    ...(payload.desiredRank ? { rank: payload.desiredRank } : {}),
    ...(payload.desiredLevel ? { level: payload.desiredLevel } : {}),
    ...(skins.length > 0 ? { skins } : {}),
    ...(payload.budget ? { budget: payload.budget } : {}),
    ...(payload.additionalNotes ? { additionalInformation: payload.additionalNotes } : {}),
  };
}

export const customDemandService = {
  async list(): Promise<CustomDemand[]> {
    const { data } = await apiClient.get("/custom-demands");
    const body = (data ?? {}) as Row;
    const rows = Array.isArray(data)
      ? (data as unknown[])
      : ((body["demands"] ?? body["customDemands"] ?? []) as unknown[]);
    return (Array.isArray(rows) ? rows : []).map(normaliseDemand);
  },

  async create(payload: CreateCustomDemandPayload): Promise<CustomDemand> {
    const { data } = await apiClient.post("/custom-demands", toPayload(payload));
    const body = (data ?? {}) as Row;
    return normaliseDemand(body["demand"] ?? body["customDemand"] ?? body);
  },
};
