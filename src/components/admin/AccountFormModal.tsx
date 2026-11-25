import { useEffect, useState } from "react";
import { Film, ImagePlus, Trash2 } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { FieldLabel, ProgressBar, Select, Textarea } from "@/components/admin/AdminUI";
import { notify } from "@/components/common/Toast";
import {
  useDeleteAccountMedia,
  useReadAccountImages,
  useUploadAccountMedia,
} from "@/hooks/useAdmin";
import { getApiErrorMessage, getUploadErrorMessage } from "@/services/apiClient";
import { RANK_OPTIONS, type Account, type AccountMedia, type AccountStatus } from "@/types/store";
import type { AccountFormValues } from "@/types/admin";

const STATUS_OPTIONS: AccountStatus[] = ["available", "reserved", "sold"];

type PendingMedia = { id: string; dataUrl: string; kind: "image" | "video" };

function toList(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

/**
 * Create/edit form for a marketplace account. Details are saved first, then each
 * media file is uploaded one request at a time with visible progress.
 * Credentials are intentionally absent — they are backend-only.
 */
export function AccountFormModal({
  open,
  account,
  onClose,
  onSubmit,
  isSaving,
  error,
}: {
  open: boolean;
  account?: Account | null;
  onClose: () => void;
  /** Saves the details and resolves with the persisted account (needs its id). */
  onSubmit: (values: AccountFormValues) => Promise<Account | null | undefined>;
  isSaving?: boolean;
  error?: unknown;
}) {
  const readFiles = useReadAccountImages();
  const uploadMedia = useUploadAccountMedia();
  const deleteMedia = useDeleteAccountMedia();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pricePKR, setPricePKR] = useState("");
  const [priceUSD, setPriceUSD] = useState("");
  const [level, setLevel] = useState("");
  const [rank, setRank] = useState("");
  const [status, setStatus] = useState<AccountStatus>("available");
  const [skins, setSkins] = useState("");
  const [weapons, setWeapons] = useState("");
  const [outfits, setOutfits] = useState("");
  const [existing, setExisting] = useState<AccountMedia[]>([]);
  const [pending, setPending] = useState<PendingMedia[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [filePercent, setFilePercent] = useState(0);
  const [busy, setBusy] = useState(false);

  const existingVideo = existing.find((entry) => entry.type === "video") ?? null;
  const pendingVideo = pending.find((entry) => entry.kind === "video") ?? null;
  const hasVideo = Boolean(existingVideo || pendingVideo);

  useEffect(() => {
    if (!open) return;
    setTitle(account?.title ?? "");
    setDescription(account?.description ?? "");
    setPricePKR(account ? String(account.pricePKR ?? account.price ?? "") : "");
    setPriceUSD(account?.priceUSD ? String(account.priceUSD) : "");
    setLevel(account?.level ? String(account.level) : "");
    setRank(account?.rank ?? "");
    setStatus(account?.status ?? "available");
    setSkins((account?.skins ?? []).join(", "));
    setWeapons((account?.weapons ?? []).join(", "));
    setOutfits((account?.outfits ?? []).join(", "));
    setExisting(
      account?.media ?? (account?.images ?? []).map((url) => ({ url, type: "image" as const })),
    );
    setPending([]);
    setFormError(null);
    setUploaded(0);
    setUploadTotal(0);
    setFilePercent(0);
    setBusy(false);
  }, [open, account]);

  async function handleFiles(files: FileList | null, kind: "image" | "video") {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    if (kind === "video") {
      if (hasVideo) {
        notify.error("Video limit reached", "Remove the current video before adding another.");
        return;
      }
      list.splice(1);
    }
    try {
      const dataUrls = await readFiles.mutateAsync(list);
      setPending((prev) => [
        ...prev,
        ...dataUrls
          .filter(Boolean)
          .map((dataUrl, index) => ({ id: `${Date.now()}-${index}-${kind}`, dataUrl, kind })),
      ]);
    } catch (err) {
      notify.error("Could not read files", getApiErrorMessage(err, "Please try smaller files."));
    }
  }

  async function removeExisting(media: AccountMedia) {
    if (!account?.id || !media.publicId) {
      setExisting((prev) => prev.filter((entry) => entry.url !== media.url));
      return;
    }
    try {
      await deleteMedia.mutateAsync({ accountId: account.id, publicId: media.publicId });
      setExisting((prev) => prev.filter((entry) => entry.url !== media.url));
      notify.success(media.type === "video" ? "Video deleted" : "Image deleted");
    } catch (err) {
      notify.error("Delete failed", getUploadErrorMessage(err, "Could not delete this media."));
    }
  }

  /** Uploads the queue sequentially — one request per file prevents timeouts. */
  async function uploadQueue(accountId: string, queue: PendingMedia[]) {
    setUploadTotal(queue.length);
    setUploaded(0);
    let failed = 0;
    for (let index = 0; index < queue.length; index += 1) {
      const item = queue[index]!;
      setFilePercent(0);
      try {
        await uploadMedia.mutateAsync({
          accountId,
          dataUrl: item.dataUrl,
          onProgress: setFilePercent,
        });
      } catch (err) {
        failed += 1;
        notify.error(
          `Media ${index + 1} not uploaded`,
          getUploadErrorMessage(err, "This file could not be uploaded."),
        );
      }
      setUploaded(index + 1);
      setPending((prev) => prev.filter((entry) => entry.id !== item.id));
    }
    setFilePercent(0);
    return failed;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const pkrValue = Number(pricePKR);
    const usdValue = Number(priceUSD);
    if (!title.trim()) return setFormError("Title is required.");
    if (!Number.isFinite(pkrValue) || pkrValue <= 0)
      return setFormError("Enter a valid PKR price.");
    if (!Number.isFinite(usdValue) || usdValue <= 0)
      return setFormError("Enter a valid USD price.");
    setFormError(null);
    setBusy(true);
    try {
      const saved = await onSubmit({
        title: title.trim(),
        description: description.trim(),
        pricePKR: pkrValue,
        priceUSD: usdValue,
        level: level ? Number(level) : undefined,
        rank: rank || undefined,
        status,
        skins: toList(skins),
        weapons: toList(weapons),
        outfits: toList(outfits),
        images: [],
      });
      const accountId = saved?.id ?? account?.id ?? "";
      const queue = [...pending];
      if (accountId && queue.length > 0) {
        const failed = await uploadQueue(accountId, queue);
        if (failed === 0)
          notify.success("Media uploaded", `${queue.length} file(s) added to this account.`);
      }
      onClose();
    } catch {
      /* the parent surfaces save errors through the `error` prop */
    } finally {
      setBusy(false);
    }
  }

  const working = busy || Boolean(isSaving) || uploadMedia.isPending;
  const remaining = Math.max(0, uploadTotal - uploaded);

  return (
    <Modal
      open={open}
      onClose={working ? () => undefined : onClose}
      title={account ? "Edit account" : "Create account"}
      description="Public listing details only. Login credentials are never stored here."
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorMessage message={formError ?? (error ? getApiErrorMessage(error) : null)} />

        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />

        <div className="space-y-1.5">
          <FieldLabel>Description</FieldLabel>
          <Textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What makes this account valuable?"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Price (PKR)"
            type="number"
            min={0}
            value={pricePKR}
            onChange={(e) => setPricePKR(e.target.value)}
            required
          />
          <Input
            label="Price (USD)"
            type="number"
            min={0}
            step="0.01"
            value={priceUSD}
            onChange={(e) => setPriceUSD(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Level"
            type="number"
            min={0}
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          />
          <div className="space-y-1.5">
            <FieldLabel>Rank</FieldLabel>
            <Select value={rank} onChange={(e) => setRank(e.target.value)}>
              <option value="">Unranked</option>
              {RANK_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <FieldLabel>Status</FieldLabel>
          <Select value={status} onChange={(e) => setStatus(e.target.value as AccountStatus)}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </div>

        <Input
          label="Skins (comma separated)"
          value={skins}
          onChange={(e) => setSkins(e.target.value)}
        />
        <Input
          label="Weapons (comma separated)"
          value={weapons}
          onChange={(e) => setWeapons(e.target.value)}
        />
        <Input
          label="Outfits (comma separated)"
          value={outfits}
          onChange={(e) => setOutfits(e.target.value)}
        />

        <div className="space-y-3">
          <FieldLabel>Media</FieldLabel>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 py-3 text-sm text-muted-foreground hover:border-primary/60 hover:text-primary">
              <ImagePlus className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {readFiles.isPending ? "Reading…" : "Add images (multiple)"}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  void handleFiles(e.target.files, "image");
                  e.target.value = "";
                }}
              />
            </label>
            <label
              className={`flex items-center gap-2 rounded-md border border-dashed px-3 py-3 text-sm ${
                hasVideo
                  ? "cursor-not-allowed border-border text-muted-foreground/50"
                  : "cursor-pointer border-border text-muted-foreground hover:border-primary/60 hover:text-primary"
              }`}
            >
              <Film className="h-4 w-4 shrink-0" />
              <span className="truncate">{hasVideo ? "Video added (max 1)" : "Add 1 video"}</span>
              <input
                type="file"
                accept="video/*"
                disabled={hasVideo}
                className="hidden"
                onChange={(e) => {
                  void handleFiles(e.target.files, "video");
                  e.target.value = "";
                }}
              />
            </label>
          </div>

          {existing.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {existing.map((media) => (
                <div
                  key={media.url}
                  className="relative h-16 w-24 overflow-hidden rounded-md border border-border bg-black"
                >
                  {media.type === "video" ? (
                    <video src={media.url} muted className="h-full w-full object-cover" />
                  ) : (
                    <img src={media.url} alt="Account media" className="h-full w-full object-cover" />
                  )}
                  <button
                    type="button"
                    aria-label={media.type === "video" ? "Delete video" : "Delete image"}
                    onClick={() => void removeExisting(media)}
                    className="absolute right-1 top-1 rounded bg-background/80 p-1 text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                  {media.type === "video" ? (
                    <span className="absolute bottom-1 left-1 rounded bg-background/80 px-1 text-[10px] text-primary">
                      Video
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {pending.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {pending.length} file(s) queued — uploaded one by one when you save.
              </p>
              <div className="flex flex-wrap gap-2">
                {pending.map((item) => (
                  <div
                    key={item.id}
                    className="relative h-16 w-24 overflow-hidden rounded-md border border-primary/40 bg-black"
                  >
                    {item.kind === "video" ? (
                      <video src={item.dataUrl} muted className="h-full w-full object-cover" />
                    ) : (
                      <img
                        src={item.dataUrl}
                        alt="Queued media"
                        className="h-full w-full object-cover"
                      />
                    )}
                    <button
                      type="button"
                      aria-label="Remove from queue"
                      onClick={() => setPending((prev) => prev.filter((e) => e.id !== item.id))}
                      className="absolute right-1 top-1 rounded bg-background/80 p-1 text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {uploadTotal > 0 ? (
            <div className="space-y-2 rounded-md border border-border bg-surface p-3">
              <ProgressBar
                value={(uploaded / uploadTotal) * 100}
                label={`Uploading ${Math.min(uploaded + 1, uploadTotal)} of ${uploadTotal}`}
              />
              <ProgressBar value={filePercent} label="Current file" />
              <p className="text-xs text-muted-foreground">
                {uploaded} uploaded · {remaining} pending
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose} disabled={working}>
            Cancel
          </Button>
          <Button type="submit" isLoading={working}>
            {account ? "Save changes" : "Create account"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
