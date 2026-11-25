import { useState, type ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useChatNotifications } from "@/hooks/useChatNotifications";

/** Desktop + tablet shell for every admin surface. */
export function AdminLayout({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useThemeColor();
  useChatNotifications();

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      {sidebarOpen ? (
        <div
          className="fixed inset-0 z-30 bg-background/70 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader onToggleSidebar={() => setSidebarOpen((v) => !v)} />
        <main className="flex-1 px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl font-bold uppercase text-foreground sm:text-3xl">
                  {title}
                </h1>
                {description ? (
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
                ) : null}
              </div>
              {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
            </div>
            <div className="mt-6">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
