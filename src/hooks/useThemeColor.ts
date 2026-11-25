import { useEffect } from "react";
import { usePublicSettings } from "@/hooks/useSettings";

/**
 * Applies the backend-controlled accent to the single brand CSS variable.
 * Every button, border, badge and highlight reads that one variable, so there
 * is no second color system anywhere in the app.
 */
export function useThemeColor() {
  const { data: settings } = usePublicSettings();
  const themeColor = settings?.themeColor ?? null;

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (themeColor) {
      root.style.setProperty("--brand-gold", themeColor);
      root.style.setProperty("--brand-gold-glow", themeColor);
    } else {
      root.style.removeProperty("--brand-gold");
      root.style.removeProperty("--brand-gold-glow");
    }
  }, [themeColor]);

  return themeColor;
}
