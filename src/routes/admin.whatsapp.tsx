import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Save } from "lucide-react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { FieldLabel, Panel, Textarea } from "@/components/admin/AdminUI";
import { Button } from "@/components/common/Button";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { Input } from "@/components/common/Input";
import { notify } from "@/components/common/Toast";
import { useAdminWhatsapp, useUpdateWhatsapp } from "@/hooks/useAdmin";
import { getApiErrorMessage } from "@/services/apiClient";

export const Route = createFileRoute("/admin/whatsapp")({
  component: AdminWhatsappPage,
});

function AdminWhatsappPage() {
  const { data, isError, error } = useAdminWhatsapp();
  const update = useUpdateWhatsapp();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [messageTemplate, setMessageTemplate] = useState("");

  useEffect(() => {
    if (!data) return;
    setPhoneNumber(data.phoneNumber ?? "");
    setIsEnabled(data.isEnabled !== false);
    setMessageTemplate(data.messageTemplate ?? "");
  }, [data]);

  async function save() {
    try {
      await update.mutateAsync({
        phoneNumber: phoneNumber.trim(),
        isEnabled,
        messageTemplate: messageTemplate.trim(),
      });
      notify.success("WhatsApp updated", "The floating button now uses these settings.");
    } catch (err) {
      notify.error("Save failed", getApiErrorMessage(err, "Could not save WhatsApp settings."));
    }
  }

  return (
    <AdminLayout
      title="WhatsApp"
      description="Show a floating WhatsApp button on the store and control its number and message."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Settings">
          <div className="space-y-4">
            {isError ? (
              <ErrorMessage
                message={getApiErrorMessage(error, "Could not load WhatsApp settings.")}
              />
            ) : null}

            <Input
              label="Phone number (with country code)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+923001234567"
            />

            <label className="flex items-center gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="h-4 w-4 accent-[color:var(--brand-gold)]"
              />
              Show the WhatsApp button on the store
            </label>

            <div className="space-y-1.5">
              <FieldLabel>Message template</FieldLabel>
              <Textarea
                rows={3}
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                placeholder="Hello, I am interested in your account: {{accountTitle}}"
              />
              <p className="text-xs text-muted-foreground">
                Use {"{{accountTitle}}"} to insert the account name the buyer is viewing.
              </p>
            </div>

            <Button onClick={save} isLoading={update.isPending}>
              <Save className="h-4 w-4" /> Save settings
            </Button>
          </div>
        </Panel>

        <Panel title="Preview">
          <div className="relative h-48 rounded-xl border border-border bg-surface-elevated">
            {isEnabled && phoneNumber.trim() ? (
              <span className="absolute bottom-4 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg">
                <MessageCircle className="h-7 w-7 text-white" />
              </span>
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                Button hidden
              </span>
            )}
          </div>
        </Panel>
      </div>
    </AdminLayout>
  );
}
