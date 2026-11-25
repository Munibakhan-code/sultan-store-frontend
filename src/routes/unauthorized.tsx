import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { MainLayout } from "@/layouts/MainLayout";
import { Button } from "@/components/common/Button";

export const Route = createFileRoute("/unauthorized")({
  head: () => ({
    meta: [
      { title: "Access Denied — Sultan Official PUBG Store" },
      {
        name: "description",
        content: "You don't have permission to view this area of Sultan Official PUBG Store.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Access Denied — Sultan Official PUBG Store" },
      { property: "og:description", content: "This area requires elevated permissions." },
    ],
  }),
  component: UnauthorizedPage,
});

function UnauthorizedPage() {
  return (
    <MainLayout>
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
        <ShieldAlert className="h-14 w-14 text-primary" />
        <h1 className="mt-6 font-display text-3xl font-bold uppercase text-foreground">
          Access denied
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your account doesn't have permission to open this page. If you believe this is a mistake,
          contact support.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/home">
            <Button>Back to home</Button>
          </Link>
          <Link to="/login">
            <Button variant="outline">Switch account</Button>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
