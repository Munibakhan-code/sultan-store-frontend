import type { ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CustomDemandBar } from "@/components/layout/CustomDemandBar";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useChatNotifications } from "@/hooks/useChatNotifications";
import { useAuth } from "@/hooks/useAuth";

export function MainLayout({
  children,
  showCustomDemand = true,
  allowAdmin = false,
}: {
  children: ReactNode;
  showCustomDemand?: boolean;
  /** Admins are bounced to /admin on customer surfaces unless explicitly allowed. */
  allowAdmin?: boolean;
}) {
  /** Realtime message + order status toasts (no typing/seen indicators). */
  useChatNotifications();

  /** Backend-controlled accent: single source of truth for the brand variable. */
  useThemeColor();

  const { isAdmin, isLoading } = useAuth();

  if (!allowAdmin && !isLoading && isAdmin) return <Navigate to="/admin" replace />;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      {showCustomDemand && !isAdmin ? <CustomDemandBar /> : null}
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
