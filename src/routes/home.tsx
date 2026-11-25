import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, Sparkles, Zap } from "lucide-react";
import { MainLayout } from "@/layouts/MainLayout";
import { Button } from "@/components/common/Button";
import { HeroSection } from "@/components/store/HeroSection";
import { AccountGrid } from "@/components/store/AccountGrid";
import { AccountGridSkeleton } from "@/components/common/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { PublicReviews } from "@/components/reviews/PublicReviews";
import { usePublicSettings } from "@/hooks/useSettings";
import { useAccounts } from "@/hooks/useAccounts";
import { getApiErrorMessage } from "@/services/apiClient";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Sultan Official PUBG Store — Verified PUBG Accounts" },
      {
        name: "description",
        content:
          "Buy verified PUBG Mobile accounts from Sultan Official PUBG Store. Secure payments, instant delivery and 24/7 support.",
      },
      { property: "og:title", content: "Sultan Official PUBG Store" },
      {
        property: "og:description",
        content: "Premium marketplace for verified PUBG Mobile accounts. Secure and instant.",
      },
    ],
  }),
  component: HomePage,
});

const highlights = [
  {
    icon: Lock,
    title: "Verified Accounts",
    body: "Every account is checked and ownership-cleared before listing.",
  },
  {
    icon: Zap,
    title: "Instant Delivery",
    body: "Credentials handed over immediately after payment confirmation.",
  },
  {
    icon: Sparkles,
    title: "Premium Inventory",
    body: "Mythic fashion, Glacier sets, Conqueror and max-level accounts.",
  },
];

function HomePage() {
  const { data: settings } = usePublicSettings();
  const featured = useAccounts({ status: "available", sort: "newest", limit: 8 });

  return (
    <MainLayout allowAdmin>
      <HeroSection videoUrl={settings?.heroVideoUrl ?? null} />

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-5 md:grid-cols-3">
          {highlights.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-gradient-surface p-6 transition-colors hover:border-primary/50"
            >
              <Icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 text-lg font-bold text-foreground">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold uppercase text-foreground">
              Featured Accounts
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Freshly listed, ready for instant handover.
            </p>
          </div>
          <Link to="/accounts">
            <Button variant="outline" size="sm">
              View all accounts
            </Button>
          </Link>
        </div>

        <div className="mt-6">
          {featured.isLoading ? (
            <AccountGridSkeleton count={4} />
          ) : featured.isError ? (
            <ErrorMessage
              message={getApiErrorMessage(featured.error, "Could not load featured accounts.")}
            />
          ) : featured.data && featured.data.accounts.length > 0 ? (
            <AccountGrid accounts={featured.data.accounts} />
          ) : (
            <EmptyState
              title="No accounts listed yet"
              description="New verified PUBG accounts are added regularly — check back shortly."
              action={
                <Link to="/custom-demand">
                  <Button size="sm">Submit a custom demand</Button>
                </Link>
              }
            />
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <h2 className="font-display text-2xl font-bold uppercase text-foreground">
          Buyer <span className="text-gradient-gold">Reviews</span>
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Verified feedback from customers who completed a deal with us.
        </p>
        <div className="mt-6">
          <PublicReviews />
        </div>
      </section>
    </MainLayout>
  );
}
