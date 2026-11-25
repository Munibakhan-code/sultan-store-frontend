import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { RANK_OPTIONS, SORT_OPTIONS, type AccountQuery } from "@/types/store";

const selectClass =
  "h-11 w-full rounded-md border border-input bg-surface px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring";

const labelClass = "block text-xs font-semibold uppercase tracking-wider text-muted-foreground";

export interface AccountFiltersProps {
  value: AccountQuery;
  onChange: (patch: Partial<AccountQuery>) => void;
  onReset: () => void;
}

export function AccountFilters({ value, onChange, onReset }: AccountFiltersProps) {
  return (
    <section
      aria-label="Search and filter accounts"
      className="rounded-xl border border-border bg-gradient-surface p-4 sm:p-5"
    >
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-primary" />
        <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
          Search &amp; filters
        </h2>
        <Button variant="ghost" size="sm" className="ml-auto" onClick={onReset}>
          <X className="h-4 w-4" /> Reset
        </Button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="md:col-span-2">
          <Input
            label="Search by title"
            placeholder="Mythic fashion, Glacier, Conqueror…"
            leadingIcon={<Search className="h-4 w-4" />}
            value={value.search ?? ""}
            onChange={(e) => onChange({ search: e.target.value || undefined })}
          />
        </div>

        <Input
          label="Min price (PKR)"
          type="number"
          min={0}
          placeholder="0"
          value={value.minPrice ?? ""}
          onChange={(e) =>
            onChange({ minPrice: e.target.value === "" ? undefined : Number(e.target.value) })
          }
        />
        <Input
          label="Max price (PKR)"
          type="number"
          min={0}
          placeholder="100000"
          value={value.maxPrice ?? ""}
          onChange={(e) =>
            onChange({ maxPrice: e.target.value === "" ? undefined : Number(e.target.value) })
          }
        />

        <Input
          label="Min price (USD)"
          type="number"
          min={0}
          placeholder="0"
          value={value.minPriceUSD ?? ""}
          onChange={(e) =>
            onChange({ minPriceUSD: e.target.value === "" ? undefined : Number(e.target.value) })
          }
        />
        <Input
          label="Max price (USD)"
          type="number"
          min={0}
          placeholder="1000"
          value={value.maxPriceUSD ?? ""}
          onChange={(e) =>
            onChange({ maxPriceUSD: e.target.value === "" ? undefined : Number(e.target.value) })
          }
        />

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="filter-rank">
            Rank
          </label>
          <select
            id="filter-rank"
            className={selectClass}
            value={value.rank ?? ""}
            onChange={(e) => onChange({ rank: e.target.value || undefined })}
          >
            <option value="">Any rank</option>
            {RANK_OPTIONS.map((rank) => (
              <option key={rank} value={rank}>
                {rank}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Minimum level"
          type="number"
          min={1}
          placeholder="Any"
          value={value.level ?? ""}
          onChange={(e) =>
            onChange({ level: e.target.value === "" ? undefined : Number(e.target.value) })
          }
        />

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="filter-status">
            Availability
          </label>
          <select
            id="filter-status"
            className={selectClass}
            value={value.status ?? "all"}
            onChange={(e) => onChange({ status: e.target.value as AccountQuery["status"] })}
          >
            <option value="all">All</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="sold">Sold</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="filter-sort">
            Sort by
          </label>
          <select
            id="filter-sort"
            className={selectClass}
            value={value.sort ?? "newest"}
            onChange={(e) => onChange({ sort: e.target.value as AccountQuery["sort"] })}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
