import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Palette } from "lucide-react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { FieldLabel, Panel } from "@/components/admin/AdminUI";
import { Button } from "@/components/common/Button";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { Input } from "@/components/common/Input";
import { notify } from "@/components/common/Toast";
import { useAdminSettings, useUpdateTheme } from "@/hooks/useAdmin";
import { usePublicSettings } from "@/hooks/useSettings";
import { getApiErrorMessage } from "@/services/apiClient";
import { DEFAULT_THEME_COLOR, THEME_PRESETS } from "@/types/admin";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/appearance")({
  component: AdminAppearancePage,
});

function AdminAppearancePage() {
  const { data: adminSettings, isError, error } = useAdminSettings();
  const { data: publicSettings } = usePublicSettings();
  const updateTheme = useUpdateTheme();

  const current =
    adminSettings?.themeColor ?? publicSettings?.themeColor ?? DEFAULT_THEME_COLOR;
  const [color, setColor] = useState(current);

  useEffect(() => setColor(current), [current]);

  /** Live preview: writes the one brand variable the whole UI reads. */
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.style.setProperty("--brand-gold", color);
    document.documentElement.style.setProperty("--brand-gold-glow", color);
  }, [color]);

  async function save() {
    try {
      await updateTheme.mutateAsync(color);
      notify.success("Theme updated", "The new accent is live across the store.");
    } catch (err) {
      notify.error("Save failed", getApiErrorMessage(err, "Could not save the theme color."));
    }
  }

  return (
    <AdminLayout
      title="Appearance"
      description="One global primary color drives every button, link, border, badge and highlight."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Primary color">
          <div className="space-y-4">
            {isError ? (
              <ErrorMessage message={getApiErrorMessage(error, "Could not load current theme.")} />
            ) : null}

            <div className="space-y-2">
              <FieldLabel>Presets</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setColor(preset.value)}
                    className={cn(
                      "flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition-colors",
                      color.toLowerCase() === preset.value.toLowerCase()
                        ? "border-primary text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50",
                    )}
                  >
                    <span
                      className="h-4 w-4 rounded-full border border-border"
                      style={{ backgroundColor: preset.value }}
                    />
                    {preset.label}
                    {color.toLowerCase() === preset.value.toLowerCase() ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : null}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Input
                  label="Hex value"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder={DEFAULT_THEME_COLOR}
                />
              </div>
              <input
                type="color"
                aria-label="Pick primary color"
                value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : DEFAULT_THEME_COLOR}
                onChange={(e) => setColor(e.target.value)}
                className="h-11 w-14 cursor-pointer rounded-md border border-input bg-surface"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={save} isLoading={updateTheme.isPending}>
                <Palette className="h-4 w-4" />
                Save theme
              </Button>
              <Button variant="ghost" onClick={() => setColor(current)}>
                Reset
              </Button>
            </div>
          </div>
        </Panel>

        <Panel title="Live preview">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button size="sm">Primary</Button>
              <Button size="sm" variant="outline">
                Outline
              </Button>
              <Button size="sm" variant="surface">
                Surface
              </Button>
            </div>
            <div className="rounded-xl border border-primary/40 bg-primary/10 p-4">
              <p className="font-display text-sm font-bold uppercase text-primary">
                Highlighted panel
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Accent borders, badges and links all follow the same variable.
              </p>
            </div>
            <span className="inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Badge sample
            </span>
          </div>
        </Panel>
      </div>
    </AdminLayout>
  );
}
