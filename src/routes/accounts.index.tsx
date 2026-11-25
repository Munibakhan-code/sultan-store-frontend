import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MainLayout } from "@/layouts/MainLayout";
import { AccountFilters } from "@/components/store/AccountFilters";
import { AccountGrid } from "@/components/store/AccountGrid";
import { AccountGridSkeleton } from "@/components/common/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { Button } from "@/components/common/Button";
import { useAccounts } from "@/hooks/useAccounts";
import { getApiErrorMessage } from "@/services/apiClient";
import type { AccountQuery, AccountSort, AccountStatus } from "@/types/store";

interface AccountSearch {
  search?: string | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  minPriceUSD?: number | undefined;
  maxPriceUSD?: number | undefined;
  rank?: string | undefined;
  level?: number | undefined;
  status?: AccountStatus | "all" | undefined;
  sort?: AccountSort | undefined;
  page?: number | undefined;
}

function num(value: unknown): number | undefined {
  const parsed = Number(value);
  return value === undefined || value === "" || Number.isNaN(parsed) ? undefined : parsed;
}

export const Route = createFileRoute("/accounts/")({
  validateSearch: (search: Record<string, unknown>): AccountSearch => ({
    search: (search["search"] as string) || undefined,
    minPrice: num(search["minPrice"]),
    maxPrice: num(search["maxPrice"]),
    minPriceUSD: num(search["minPriceUSD"]),
    maxPriceUSD: num(search["maxPriceUSD"]),
    rank: (search["rank"] as string) || undefined,
    level: num(search["level"]),
    status: (search["status"] as AccountStatus | "all") || "all",
    sort: (search["sort"] as AccountSort) || "newest",
    page: num(search["page"]) ?? 1,
  }),
  head: () => ({
    meta: [
      { title: "Browse PUBG Accounts — Sultan Official PUBG Store" },
      {
        name: "description",
        content:
          "Browse verified PUBG Mobile accounts by price, rank, level and availability. Instant delivery after payment.",
      },
      { property: "og:title", content: "Browse PUBG Accounts — Sultan Official PUBG Store" },
      {
        property: "og:description",
        content: "Filter verified PUBG accounts by price, rank, level and availability.",
      },
    ],
  }),
  component: AccountsPage,
  errorComponent: ({ error }) => (
    <MainLayout>
      <div className="mx-auto max-w-3xl px-4 py-20">
        <ErrorMessage message={error.message} />
      </div>
    </MainLayout>
  ),
});

const PAGE_SIZE = 12;

function AccountsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [draft, setDraft] = useState<AccountQuery>(search);

  /** Debounced URL sync so typing doesn't spam the backend. */
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate({ search: () => ({ ...draft, page: 1 }), replace: true });
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(draft)]);

  const query = useAccounts({ ...search, limit: PAGE_SIZE });
  const accounts = query.data?.accounts ?? [];
  const totalPages = query.data?.totalPages ?? 1;
  const page = search.page ?? 1;

  function reset() {
    setDraft({ status: "all", sort: "newest" });
  }

  function goToPage(next: number) {
    navigate({ search: (prev) => ({ ...prev, page: next }) });
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <header>
          <h1 className="font-display text-3xl font-bold uppercase text-foreground">
            PUBG <span className="text-gradient-gold">Accounts</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {query.data
              ? `${query.data.total} account${query.data.total === 1 ? "" : "s"} matching your filters.`
              : "Search the full verified inventory."}
          </p>
        </header>

        <div className="mt-6">
          <AccountFilters value={draft} onChange={(patch) => setDraft((p) => ({ ...p, ...patch }))} onReset={reset} />
        </div>

        <div className="mt-8">
          {query.isLoading ? (
            <AccountGridSkeleton count={8} />
          ) : query.isError ? (
            <ErrorMessage
              message={getApiErrorMessage(query.error, "Could not load accounts right now.")}
            />
          ) : accounts.length > 0 ? (
            <>
              <AccountGrid accounts={accounts} />
              {totalPages > 1 ? (
                <div className="mt-10 flex items-center justify-center gap-3">
                  <Button
                    variant="surface"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => goToPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="surface"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => goToPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              ) : null}
            </>
          ) : (
            <EmptyState
              title="No accounts match your filters"
              description="Try widening the price range or clearing the rank and level filters."
              action={
                <Button size="sm" onClick={reset}>
                  Reset filters
                </Button>
              }
            />
          )}
        </div>
      </div>
    </MainLayout>
  );
}
