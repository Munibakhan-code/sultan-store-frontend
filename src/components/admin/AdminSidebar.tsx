import { Link, useRouterState } from "@tanstack/react-router";
import {
  BadgeDollarSign,
  Gauge,
  Gem,
  MessageCircle,
  MessageSquare,
  Package,
  Palette,
  ReceiptText,
  Sparkles,
  Star,
  Users,
  Video,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

export interface AdminNavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { label: "Dashboard", to: "/admin", icon: Gauge },
  { label: "Accounts", to: "/admin/accounts", icon: Package },
  { label: "Orders", to: "/admin/orders", icon: ReceiptText },
  { label: "Payments", to: "/admin/payments", icon: BadgeDollarSign },
  { label: "Customers", to: "/admin/customers", icon: Users },
  { label: "Reviews", to: "/admin/reviews", icon: Star },
  { label: "Custom Demands", to: "/admin/custom-demands", icon: Sparkles },
  { label: "Conversations", to: "/admin/conversations", icon: MessageSquare },
  { label: "Payment Methods", to: "/admin/payment-methods", icon: Wallet },
  { label: "WhatsApp", to: "/admin/whatsapp", icon: MessageCircle },
  { label: "Hero Video", to: "/admin/hero-video", icon: Video },
  { label: "Appearance", to: "/admin/appearance", icon: Palette },
];

export function AdminSidebar({
  open,
  onNavigate,
}: {
  open: boolean;
  onNavigate?: () => void;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-border bg-surface transition-transform duration-200 lg:static lg:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b border-border px-4">
        <Logo className="h-9 w-auto" />
        <span className="font-display text-sm font-bold uppercase tracking-wider text-primary">
          Admin
        </span>
      </div>

      <nav className="flex flex-col gap-1 overflow-y-auto p-3" aria-label="Admin navigation">
        {ADMIN_NAV.map((item) => {
          const active = item.to === "/admin" ? pathname === "/admin" : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "border border-primary/40 bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto hidden items-center gap-2 border-t border-border p-4 text-xs text-muted-foreground lg:flex">
        <Gem className="h-3.5 w-3.5 text-primary" />
        Sultan Official control panel
      </div>
    </aside>
  );
}
