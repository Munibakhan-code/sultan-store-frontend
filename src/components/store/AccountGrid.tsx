import { useNavigate } from "@tanstack/react-router";
import { AccountCard } from "@/components/store/AccountCard";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import type { Account } from "@/types/store";

/** Grid of AccountCards wired to the favorites, cart and checkout flows. */
export function AccountGrid({ accounts }: { accounts: Account[] }) {
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { addToCart, inCart } = useCart();
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {accounts.map((account) => (
        <AccountCard
          key={account.id}
          account={account}
          isFavorite={favoriteIds.has(account.id)}
          inCart={inCart(account.id)}
          onToggleFavorite={toggleFavorite}
          onAddToCart={addToCart}
          onBuyNow={(target) =>
            navigate({ to: "/checkout", search: { accountId: target.id } })
          }
        />
      ))}
    </div>
  );
}
