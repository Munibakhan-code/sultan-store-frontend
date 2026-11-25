import { Link, useNavigate } from "@tanstack/react-router";
import { ExternalLink, LogOut, Menu, ShieldCheck } from "lucide-react";
import { Button } from "@/components/common/Button";
import { useAuth } from "@/hooks/useAuth";
import { notify } from "@/components/common/Toast";

export function AdminHeader({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { user, logout, isSubmitting } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    notify.info("Signed out", "You have left the admin panel.");
    navigate({ to: "/login", replace: true });
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/90 px-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle admin navigation"
          className="rounded-md border border-border p-2 text-muted-foreground transition-colors hover:text-primary lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
            Control panel
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link to="/home" className="hidden sm:block">
          <Button variant="ghost" size="sm">
            <ExternalLink className="h-4 w-4" />
            View store
          </Button>
        </Link>
        <span className="hidden text-right text-xs leading-tight md:block">
          <span className="block font-semibold text-foreground">{user?.fullName ?? "Admin"}</span>
          {/* <span className="block text-muted-foreground">{user?.email}</span> */}
        </span>
        <Button variant="outline" size="sm" onClick={handleLogout} isLoading={isSubmitting}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}
