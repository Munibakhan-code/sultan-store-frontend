import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ImageOff, Plus, Upload, Wallet } from "lucide-react";
import { AdminLayout } from "@/layouts/AdminLayout";
import {
  DataState,
  FieldLabel,
  Panel,
  Pill,
  ProgressBar,
  Textarea,
} from "@/components/admin/AdminUI";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Modal } from "@/components/common/Modal";
import { notify } from "@/components/common/Toast";
import {
  useAdminPaymentMethods,
  useCreatePaymentMethod,
  useDeletePaymentMethodLogo,
  useUpdatePaymentMethod,
  useUploadPaymentMethodLogo,
} from "@/hooks/useAdmin";
import { fileToBase64, getApiErrorMessage } from "@/services/apiClient";
import { validateLogoFile } from "@/services/adminService";
import type { PaymentMethod } from "@/types/order";
import type { PaymentMethodFormValues } from "@/types/admin";

export const Route = createFileRoute("/admin/payment-methods")({
  component: AdminPaymentMethodsPage,
});

const LOGO_ACCEPT = "image/png,image/jpeg,image/jpg,image/webp,image/svg+xml";

function detailsToText(details: PaymentMethod["details"]): string {
  return Object.entries(details ?? {})
    .map(([key, value]) => `${key}: ${value ?? ""}`)
    .join("\n");
}

function textToDetails(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const index = line.indexOf(":");
      if (index === -1) return;
      const key = line.slice(0, index).trim();
      const value = line.slice(index + 1).trim();
      if (key) result[key] = value;
    });
  return result;
}

function AdminPaymentMethodsPage() {
  const { data, isLoading, isError, error } = useAdminPaymentMethods();
  const update = useUpdatePaymentMethod();
  const create = useCreatePaymentMethod();
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [creating, setCreating] = useState(false);

  const methods = data ?? [];

  async function toggle(method: PaymentMethod) {
    try {
      await update.mutateAsync({ id: method.id, payload: { enabled: !method.enabled } });
      notify.success(method.enabled ? "Method disabled" : "Method enabled");
    } catch (err) {
      notify.error("Update failed", getApiErrorMessage(err, "Could not update this method."));
    }
  }

  async function save(values: PaymentMethodFormValues) {
    try {
      if (editing) {
        const { logoBase64: _logo, ...rest } = values;
        await update.mutateAsync({ id: editing.id, payload: rest });
      } else {
        await create.mutateAsync(values);
      }
      notify.success(editing ? "Payment method updated" : "Payment method added");
      setEditing(null);
      setCreating(false);
    } catch (err) {
      notify.error("Save failed", getApiErrorMessage(err, "Could not save this payment method."));
    }
  }

  return (
    <AdminLayout
      title="Payment methods"
      description="Enable, disable and edit the details customers see at checkout. Values live in the backend."
      actions={
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          Add method
        </Button>
      }
    >
      <Panel title={`${methods.length} method(s)`}>
        <DataState
          isLoading={isLoading}
          isError={isError}
          error={error}
          isEmpty={methods.length === 0}
          emptyTitle="No payment methods"
          emptyDescription="Add Binance or Bank Transfer details so customers can pay."
          emptyIcon={<Wallet className="h-6 w-6" />}
          errorFallback="Could not load payment methods."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {methods.map((method) => (
              <div key={method.id} className="rounded-xl border border-border bg-gradient-surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <LogoPreview url={method.logoUrl} />
                    <div>
                      <h3 className="font-display text-base font-bold uppercase text-foreground">
                        {method.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">{method.type}</p>
                    </div>
                  </div>
                  <Pill tone={method.enabled ? "success" : "muted"}>
                    {method.enabled ? "Enabled" : "Disabled"}
                  </Pill>
                </div>

                {method.instructions ? (
                  <p className="mt-3 text-sm text-muted-foreground">{method.instructions}</p>
                ) : null}

                <dl className="mt-3 space-y-1 text-sm">
                  {Object.entries(method.details ?? {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">{key}</dt>
                      <dd className="text-right text-foreground">{String(value ?? "")}</dd>
                    </div>
                  ))}
                </dl>

                <LogoManager method={method} />

                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="surface" onClick={() => setEditing(method)}>
                    Edit details
                  </Button>
                  <Button
                    size="sm"
                    variant={method.enabled ? "ghost" : "primary"}
                    onClick={() => toggle(method)}
                    isLoading={update.isPending}
                  >
                    {method.enabled ? "Disable" : "Enable"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DataState>
      </Panel>

      <PaymentMethodModal
        open={creating || Boolean(editing)}
        method={editing}
        isSaving={create.isPending || update.isPending}
        onClose={() => {
          setEditing(null);
          setCreating(false);
        }}
        onSubmit={save}
      />
    </AdminLayout>
  );
}

function LogoPreview({ url, size = "h-10 w-10" }: { url?: string | undefined; size?: string }) {
  return (
    <span
      className={`flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-elevated`}
    >
      {url ? (
        <img src={url} alt="" className="h-full w-full object-contain p-1" />
      ) : (
        <ImageOff className="h-4 w-4 text-muted-foreground" />
      )}
    </span>
  );
}

/** Upload / replace / remove the Cloudinary logo for one payment method. */
function LogoManager({ method }: { method: PaymentMethod }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadPaymentMethodLogo();
  const remove = useDeletePaymentMethodLogo();
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File | null | undefined) {
    if (!file) return;
    const problem = validateLogoFile(file);
    if (problem) {
      notify.error("Image not accepted", problem);
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      await upload.mutateAsync({ id: method.id, file, onProgress: setProgress });
      notify.success("Logo uploaded");
    } catch (err) {
      notify.error("Upload failed", getApiErrorMessage(err, "Could not upload this logo."));
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    try {
      await remove.mutateAsync(method.id);
      notify.success("Logo removed");
    } catch (err) {
      notify.error("Remove failed", getApiErrorMessage(err, "Could not remove this logo."));
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-border bg-surface p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <LogoPreview url={method.logoUrl} size="h-12 w-12" />
          <p className="text-xs text-muted-foreground">
            {method.logoUrl ? "Logo shown at checkout" : "No logo yet"}
            <br />
            Max 1MB · PNG, JPG, WEBP, SVG
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          <Button
            size="sm"
            variant="surface"
            onClick={() => inputRef.current?.click()}
            isLoading={uploading}
          >
            <Upload className="h-4 w-4" />
            {method.logoUrl ? "Replace" : "Upload"}
          </Button>
          {method.logoUrl ? (
            <Button size="sm" variant="ghost" onClick={handleRemove} isLoading={remove.isPending}>
              Remove
            </Button>
          ) : null}
        </div>
      </div>

      {uploading ? (
        <div className="mt-3">
          <ProgressBar value={progress} label="Uploading logo" />
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept={LOGO_ACCEPT}
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
    </div>
  );
}

function PaymentMethodModal({
  open,
  method,
  onClose,
  onSubmit,
  isSaving,
}: {
  open: boolean;
  method: PaymentMethod | null;
  onClose: () => void;
  onSubmit: (values: PaymentMethodFormValues) => void;
  isSaving?: boolean;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [instructions, setInstructions] = useState("");
  const [details, setDetails] = useState("");
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [logoName, setLogoName] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(method?.name ?? "");
    setType(method?.type ?? "");
    setEnabled(method?.enabled ?? true);
    setInstructions(method?.instructions ?? "");
    setDetails(detailsToText(method?.details));
    setLogoBase64(null);
    setLogoName("");
  }, [open, method]);

  async function pickLogo(file: File | null | undefined) {
    if (!file) return;
    const problem = validateLogoFile(file);
    if (problem) {
      notify.error("Image not accepted", problem);
      return;
    }
    try {
      setLogoBase64(await fileToBase64(file));
      setLogoName(file.name);
    } catch {
      notify.error("Could not read the image", "Please try another file.");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={method ? `Edit ${method.name}` : "Add payment method"}
      description="One detail per line, written as “Label: value”."
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit({
            name: name.trim(),
            type: type.trim() || name.trim().toLowerCase().replace(/\s+/g, "_"),
            enabled,
            instructions: instructions.trim() || undefined,
            details: textToDetails(details),
            ...(logoBase64 ? { logoBase64 } : {}),
          });
        }}
      >
        <Input label="Display name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input
          label="Type key"
          value={type}
          onChange={(e) => setType(e.target.value)}
          hint="e.g. binance, bank_transfer"
        />
        <div className="space-y-1.5">
          <FieldLabel>Instructions</FieldLabel>
          <Textarea
            rows={3}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="How should the customer pay?"
          />
        </div>
        <div className="space-y-1.5">
          <FieldLabel>Details</FieldLabel>
          <Textarea
            rows={5}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder={"Binance ID: 123456789\nBank: Meezan\nIBAN: PK00..."}
          />
        </div>

        {method ? null : (
          <div className="space-y-1.5">
            <FieldLabel>Logo (optional)</FieldLabel>
            <div className="flex items-center gap-3">
              <LogoPreview url={logoBase64 ?? undefined} size="h-12 w-12" />
              <label className="cursor-pointer rounded-md border border-border bg-surface px-3 py-2 text-xs font-semibold uppercase tracking-wider text-foreground hover:border-primary/50">
                Choose image
                <input
                  type="file"
                  accept={LOGO_ACCEPT}
                  className="hidden"
                  onChange={(event) => pickLogo(event.target.files?.[0])}
                />
              </label>
              <p className="text-xs text-muted-foreground">
                {logoName || "Max 1MB · PNG, JPG, WEBP, SVG"}
              </p>
            </div>
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          Enabled for customers
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
