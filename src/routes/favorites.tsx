import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { MainLayout } from "@/layouts/MainLayout";
import { ProtectedRoute } from "@/routes/guards/ProtectedRoute";
import { AccountGrid } from "@/components/store/AccountGrid";
import { AccountGridSkeleton } from "@/components/common/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { Button } from "@/components/common/Button";
import { useFavorites } from "@/hooks/useFavorites";
import { getApiErrorMessage } from "@/services/apiClient";

export const Route = createFileRoute("/favorites")({
  head: () => ({
    meta: [
      { title: "Your Favorites — Sultan Official PUBG Store" },
      {
        name: "description",
        content: "Saved PUBG Mobile accounts you are watching at Sultan Official PUBG Store.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Your Favorites — Sultan Official PUBG Store" },
      { property: "og:description", content: "The PUBG accounts you saved for later." },
    ],
  }),
  component: () => (
    <ProtectedRoute>
      <FavoritesPage />
    </ProtectedRoute>
  ),
});

function FavoritesPage() {
  const { favorites, isLoading, isError, error } = useFavorites();

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <header className="flex items-center gap-3">
          <Heart className="h-6 w-6 text-primary" />
          <h1 className="font-display text-3xl font-bold uppercase text-foreground">Favorites</h1>
        </header>
        <p className="mt-2 text-sm text-muted-foreground">
          Accounts you saved. Availability can change at any time.
        </p>

        <div className="mt-8">
          {isLoading ? (
            <AccountGridSkeleton count={4} />
          ) : isError ? (
            <ErrorMessage message={getApiErrorMessage(error, "Could not load your favorites.")} />
          ) : favorites.length > 0 ? (
            <AccountGrid accounts={favorites} />
          ) : (
            <EmptyState
              icon={<Heart className="h-6 w-6" />}
              title="No favorites yet"
              description="Tap the heart on any account to keep an eye on it here."
              action={
                <Link to="/accounts">
                  <Button size="sm">Browse accounts</Button>
                </Link>
              }
            />
          )}
        </div>
      </div>
    </MainLayout>
  );
}
