import type { ReactNode } from "react";
import { Navigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { FullPageLoader } from "@/components/common/LoadingSpinner";

/**
 * UI-only guard: renders children when a session exists, otherwise sends the
 * visitor to /login. Backend authorization is enforced separately.
 */
export function ProtectedRoute({
  children,
  allowAdmin = false,
}: {
  children: ReactNode;
  /** Shared surfaces (e.g. messages) admins are allowed to use. */
  allowAdmin?: boolean;
}) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageLoader label="Checking your session" />;
  if (!isAuthenticated) {
    // Guard against redirect loops if this ever renders on an auth page.
    if (location.pathname === "/login") return null;
    return <Navigate to="/login" search={{ redirect: location.pathname }} replace />;
  }
  // Admins work from the control panel, not the customer surfaces.
  if (isAdmin && !allowAdmin) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}
