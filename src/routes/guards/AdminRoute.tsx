import type { ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { FullPageLoader } from "@/components/common/LoadingSpinner";

/**
 * UI-only guard for admin surfaces. Ordinary users are redirected to
 * /unauthorized and never see admin UI through frontend routing.
 */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();

  if (isLoading) return <FullPageLoader label="Verifying permissions" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
}
