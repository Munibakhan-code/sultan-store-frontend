import { usePublicWhatsApp } from "@/hooks/useSettings";

/** Builds a wa.me link from the admin-configured number and template. */
function buildLink(phone: string, template?: string | null, accountTitle?: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  const text = (template ?? "Hello, I would like to know more about your PUBG accounts.").replace(
    /\{\{\s*accountTitle\s*\}\}/g,
    accountTitle ?? "your accounts",
  );
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/** Floating WhatsApp button, bottom-right. Fully backend-controlled. */
export function WhatsAppButton({ accountTitle }: { accountTitle?: string }) {
  const { data } = usePublicWhatsApp();
  const phone = data?.phoneNumber ?? "";
  if (!data || data.isEnabled === false || !phone) return null;

  return (
    <a
      href={buildLink(phone, data.messageTemplate, accountTitle)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <svg viewBox="0 0 32 32" aria-hidden className="h-7 w-7 fill-white">
        <path d="M16.04 3.2c-7.05 0-12.77 5.72-12.77 12.77 0 2.25.59 4.45 1.71 6.39L3.2 28.8l6.62-1.74a12.72 12.72 0 0 0 6.22 1.6h.01c7.04 0 12.77-5.73 12.77-12.77 0-3.41-1.33-6.62-3.74-9.03a12.68 12.68 0 0 0-9.04-3.66Zm0 23.03h-.01a10.6 10.6 0 0 1-5.4-1.48l-.39-.23-4.01 1.05 1.07-3.91-.25-.4a10.55 10.55 0 0 1-1.62-5.63c0-5.85 4.76-10.61 10.61-10.61 2.84 0 5.5 1.11 7.5 3.11a10.54 10.54 0 0 1 3.1 7.51c0 5.85-4.76 10.59-10.6 10.59Zm5.82-7.94c-.32-.16-1.96-.97-2.27-1.08-.3-.11-.52-.16-.74.16-.22.32-.85 1.08-1.04 1.3-.19.22-.38.24-.7.08-.32-.16-1.36-.5-2.58-1.6-.95-.85-1.6-1.9-1.79-2.22-.19-.32-.02-.5.14-.66.15-.15.32-.38.48-.57.16-.19.22-.32.32-.54.11-.22.05-.4-.03-.57-.08-.16-.72-1.8-.99-2.44-.26-.63-.53-.55-.73-.56h-.62c-.22 0-.57.08-.86.4-.3.32-1.13 1.1-1.13 2.68s1.15 3.11 1.31 3.32c.16.22 2.26 3.6 5.5 4.9.77.33 1.37.53 1.84.68.77.24 1.48.21 2.03.13.62-.09 2.03-.83 2.32-1.63.29-.8.29-1.49.2-1.63-.08-.14-.3-.22-.62-.38Z" />
      </svg>
    </a>
  );
}
