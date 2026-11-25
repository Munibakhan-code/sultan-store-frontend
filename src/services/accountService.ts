import { apiClient } from "./apiClient";
import type { Account, AccountListResponse, AccountMedia, AccountQuery } from "@/types/store";

type Row = Record<string, unknown>;

/** Backend ids are Mongo `_id`s. */
export function rowId(row: unknown): string {
  if (!row) return "";
  if (typeof row === "string") return row;
  const obj = row as Row;
  return String(obj["_id"] ?? obj["id"] ?? "");
}

function isVideoUrl(url: string, row?: Row): boolean {
  const kind = String(row?.["resourceType"] ?? row?.["resource_type"] ?? row?.["type"] ?? "");
  if (/video/i.test(kind)) return true;
  return /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(url) || /\/video\/upload\//i.test(url);
}

/** Media arrive as `{ url, publicId }` objects; keep publicIds for admin deletes. */
export function accountMedia(value: unknown): AccountMedia[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      const row = typeof entry === "string" ? undefined : (entry as Row);
      const url = typeof entry === "string" ? entry : String(row?.["url"] ?? "");
      if (!url) return null;
      const publicId = row?.["publicId"] ?? row?.["public_id"];
      return {
        url,
        ...(publicId ? { publicId: String(publicId) } : {}),
        type: isVideoUrl(url, row) ? ("video" as const) : ("image" as const),
      };
    })
    .filter((entry): entry is AccountMedia => Boolean(entry));
}

/** Images arrive as `{ url, publicId }` objects; the UI only needs the URL. */
export function imageUrls(value: unknown): string[] {
  return accountMedia(value)
    .filter((entry) => entry.type === "image")
    .map((entry) => entry.url);
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => String(entry)).filter(Boolean);
}

export function normaliseAccount(raw: unknown): Account {
  const row = (raw ?? {}) as Row;
  return {
    id: rowId(row),
    title: String(row["title"] ?? "Untitled account"),
    description: String(row["description"] ?? ""),
    images: imageUrls(row["images"]),
    media: accountMedia(row["images"]),
    ...(() => {
      const video = accountMedia(row["images"]).find((entry) => entry.type === "video");
      const direct = row["videoUrl"] ? String(row["videoUrl"]) : "";
      const url = video?.url ?? direct;
      return url ? { videoUrl: url } : {};
    })(),
    ...(row["level"] === undefined || row["level"] === null
      ? {}
      : { level: Number(row["level"]) }),
    ...(row["rank"] ? { rank: String(row["rank"]) } : {}),
    price: Number(row["pricePKR"] ?? row["price"] ?? 0),
    ...(row["pricePKR"] === undefined || row["pricePKR"] === null
      ? {}
      : { pricePKR: Number(row["pricePKR"]) }),
    ...(row["priceUSD"] === undefined || row["priceUSD"] === null
      ? {}
      : { priceUSD: Number(row["priceUSD"]) }),
    status: (String(row["status"] ?? "available") as Account["status"]),
    skins: stringList(row["skins"]),
    weapons: stringList(row["weapons"]),
    outfits: stringList(row["outfits"]),
    ...(row["createdAt"] ? { createdAt: String(row["createdAt"]) } : {}),
  };
}

/** `sort` in the UI maps to the backend's sortBy/sortOrder pair. */
function sortParams(sort: AccountQuery["sort"]): Record<string, string> {
  switch (sort) {
    case "price-asc":
      return { sortBy: "pricePKR", sortOrder: "asc" };
    case "price-desc":
      return { sortBy: "pricePKR", sortOrder: "desc" };
    case "usd-asc":
      return { sortBy: "priceUSD", sortOrder: "asc" };
    case "usd-desc":
      return { sortBy: "priceUSD", sortOrder: "desc" };
    case "level-desc":
      return { sortBy: "level", sortOrder: "desc" };
    case "newest":
    default:
      return { sortBy: "createdAt", sortOrder: "desc" };
  }
}

function toParams(query: AccountQuery): Record<string, string | number> {
  const params: Record<string, string | number> = { ...sortParams(query.sort) };
  if (query.search) params["search"] = query.search;
  if (typeof query.minPrice === "number") params["minPricePKR"] = query.minPrice;
  if (typeof query.maxPrice === "number") params["maxPricePKR"] = query.maxPrice;
  if (typeof query.minPriceUSD === "number") params["minPriceUSD"] = query.minPriceUSD;
  if (typeof query.maxPriceUSD === "number") params["maxPriceUSD"] = query.maxPriceUSD;
  if (query.rank) params["rank"] = query.rank;
  if (typeof query.level === "number") params["minLevel"] = query.level;
  if (query.status && query.status !== "all") params["status"] = query.status;
  if (query.page) params["page"] = query.page;
  if (query.limit) params["limit"] = query.limit;
  return params;
}


/** GET /api/accounts and GET /api/accounts/:id */
export const accountService = {
  async list(query: AccountQuery = {}): Promise<AccountListResponse> {
    const { data } = await apiClient.get<Row | unknown[]>("/accounts", {
      params: toParams(query),
    });
    if (Array.isArray(data)) {
      const accounts = data.map(normaliseAccount);
      return { accounts, total: accounts.length, page: 1, totalPages: 1 };
    }
    const body = (data ?? {}) as Row;
    const accounts = Array.isArray(body["accounts"])
      ? (body["accounts"] as unknown[]).map(normaliseAccount)
      : [];
    const pagination = (body["pagination"] ?? {}) as Row;
    return {
      accounts,
      total: Number(pagination["total"] ?? body["total"] ?? accounts.length),
      page: Number(pagination["page"] ?? body["page"] ?? 1),
      totalPages: Number(pagination["pages"] ?? body["totalPages"] ?? 1),
    };
  },

  async getById(id: string): Promise<Account> {
    const { data } = await apiClient.get<Row>(`/accounts/${id}`);
    const body = (data ?? {}) as Row;
    return normaliseAccount(body["account"] ?? body);
  },
};
