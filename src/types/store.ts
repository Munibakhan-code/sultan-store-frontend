export type AccountStatus = "available" | "reserved" | "sold";

/** A single Cloudinary asset attached to an account (image or the one video). */
export interface AccountMedia {
  url: string;
  publicId?: string;
  type: "image" | "video";
}

/** Public-safe account shape. Login credentials are never part of this payload. */
export interface Account {
  id: string;
  title: string;
  description?: string;
  /** Image URLs supplied by the backend (videos excluded). */
  images: string[];
  /** Full media list with publicIds, used by the admin media manager. */
  media?: AccountMedia[];
  /** Convenience pointer to the single account video, when present. */
  videoUrl?: string;
  level?: number;
  rank?: string;
  /** Legacy single price — older accounts only have this. */
  price: number;
  /** New dual pricing (may be missing on older accounts). */
  pricePKR?: number;
  priceUSD?: number;
  status: AccountStatus;
  category?: string;
  skins?: string[];
  weapons?: string[];
  outfits?: string[];
  createdAt?: string;
}


export type AccountSort =
  | "newest"
  | "price-asc"
  | "price-desc"
  | "usd-asc"
  | "usd-desc"
  | "level-desc";

export interface AccountQuery {
  search?: string | undefined;
  /** PKR range (also sent as minPricePKR/maxPricePKR). */
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  minPriceUSD?: number | undefined;
  maxPriceUSD?: number | undefined;
  rank?: string | undefined;
  level?: number | undefined;
  status?: AccountStatus | "all" | undefined;
  sort?: AccountSort | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}


export interface AccountListResponse {
  accounts: Account[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CartItem {
  id?: string;
  account: Account;
  quantity?: number;
}

export interface PublicSettings {
  heroVideoUrl?: string | null;
  themeColor?: string | null;
}

/** GET /api/settings/whatsapp — floating WhatsApp button configuration. */
export interface WhatsAppSettings {
  phoneNumber?: string | null;
  isEnabled?: boolean | null;
  messageTemplate?: string | null;
}

export const RANK_OPTIONS = [
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Diamond",
  "Crown",
  "Ace",
  "Conqueror",
] as const;

export const SORT_OPTIONS: { value: AccountSort; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "price-asc", label: "PKR: low to high" },
  { value: "price-desc", label: "PKR: high to low" },
  { value: "usd-asc", label: "USD: low to high" },
  { value: "usd-desc", label: "USD: high to low" },
  { value: "level-desc", label: "Level: high to low" },
];

export function formatPrice(price: number): string {
  return `Rs. ${new Intl.NumberFormat("en-PK").format(price)}`;
}

export function formatPKR(price: number): string {
  return `Rs. ${new Intl.NumberFormat("en-PK").format(price)}`;
}

export function formatUSD(price: number): string {
  return `$${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price)}`;
}

function positive(value?: number | null): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
}

/**
 * Dual pricing with a safe fallback: newer accounts carry pricePKR/priceUSD,
 * older ones only the legacy `price` field.
 */
export function accountPrices(account: Pick<Account, "price" | "pricePKR" | "priceUSD">): {
  pkr?: string;
  usd?: string;
  /** Set only when neither new field exists — shows the legacy price. */
  legacy?: string;
} {
  const pkr = positive(account.pricePKR);
  const usd = positive(account.priceUSD);
  if (pkr === undefined && usd === undefined) {
    const legacy = positive(account.price);
    return legacy === undefined ? {} : { legacy: formatPKR(legacy) };
  }
  return {
    ...(pkr === undefined ? {} : { pkr: formatPKR(pkr) }),
    ...(usd === undefined ? {} : { usd: formatUSD(usd) }),
  };
}

