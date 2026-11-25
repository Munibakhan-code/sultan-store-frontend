import { useQuery } from "@tanstack/react-query";
import { settingsService } from "@/services/settingsService";

/** Public store settings (hero video URL, theme color) served by the backend. */
export function usePublicSettings() {
  return useQuery({
    queryKey: ["settings", "public"],
    queryFn: () => settingsService.getPublic(),
    staleTime: 5 * 60_000,
    retry: 0,
  });
}

/** Public WhatsApp settings that drive the floating chat button. */
export function usePublicWhatsApp() {
  return useQuery({
    queryKey: ["settings", "whatsapp"],
    queryFn: () => settingsService.getWhatsApp(),
    staleTime: 5 * 60_000,
    retry: 0,
  });
}
