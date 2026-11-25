import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminRoute } from "@/routes/guards/AdminRoute";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Control Panel — Sultan Official PUBG Store" },
      { name: "description", content: "Administration area for Sultan Official PUBG Store." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin — Sultan Official PUBG Store" },
      { property: "og:description", content: "Restricted administration area." },
    ],
  }),
  component: AdminShell,
});

function AdminShell() {
  return (
    <AdminRoute>
      <Outlet />
    </AdminRoute>
  );
}
