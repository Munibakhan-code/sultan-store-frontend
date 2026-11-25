/** Custom demand request lifecycle — backend owns the status. */
export type CustomDemandStatus = "pending" | "in_review" | "assisted" | "fulfilled" | "rejected";

export interface CustomDemand {
  id: string;
  requirements: string;
  desiredRank?: string | null;
  desiredLevel?: number | null;
  desiredSkins?: string | null;
  budget?: number | null;
  additionalNotes?: string | null;
  status: CustomDemandStatus;
  /** Set once an admin starts assisting and the backend opens a private chat. */
  conversationId?: string | null;
  createdAt?: string | null;
}

export interface CreateCustomDemandPayload {
  requirements: string;
  desiredRank?: string | undefined;
  desiredLevel?: number | undefined;
  desiredSkins?: string | undefined;
  budget?: number | undefined;
  additionalNotes?: string | undefined;
}

export const DEMAND_STATUS_LABELS: Record<CustomDemandStatus, string> = {
  pending: "Pending review",
  in_review: "In review",
  assisted: "Admin assisting",
  fulfilled: "Fulfilled",
  rejected: "Declined",
};

export const DEMAND_STATUS_CLASSES: Record<CustomDemandStatus, string> = {
  pending: "border-muted-foreground/40 bg-muted/20 text-muted-foreground",
  in_review: "border-primary/40 bg-primary/10 text-primary",
  assisted: "border-primary/60 bg-primary/15 text-primary",
  fulfilled: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  rejected: "border-destructive/40 bg-destructive/10 text-destructive",
};
