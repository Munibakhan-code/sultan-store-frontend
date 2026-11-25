import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Heart,
  LogOut,
  Menu,
  MessageSquare,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  User as UserIcon,
  X,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/common/Button";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { notify } from "@/components/common/Toast";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Home", to: "/home" },
  { label: "Accounts", to: "/accounts" },
  { label: "Favorites", to: "/favorites" },
  { label: "Cart", to: "/cart" },
  { label: "Orders", to: "/orders" },
  { label: "Messages", to: "/messages" },
  { label: "Custom Demand", to: "/custom-demand" },
] as const;

export function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { count: cartCount } = useCart();
  const { favorites } = useFavorites();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await logout();
    notify.success("Signed out", "You have been logged out of your account.");
    navigate({ to: "/login", replace: true });
  }

  // Admins get a minimal bar: Home + Admin panel (+ sign out).
  if (isAdmin) {
    return (
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-lg">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <Logo compact />
          <div className="flex items-center gap-2">
            <Link to="/home">
              <Button variant="ghost" size="sm">
                Home
              </Button>
            </Link>
            <Link to="/messages">
              <Button variant="ghost" size="sm">
                <MessageSquare className="h-4 w-4" /> Messages
              </Button>
            </Link>
            <Link to="/admin">
              <Button size="sm">
                <ShieldCheck className="h-4 w-4" /> Admin Panel
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout} aria-label="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-lg">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo compact />

        <nav className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              activeProps={{ className: "!text-primary" }}
              className="text-sm font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>


        <div className="hidden items-center gap-2 lg:flex">
          <Link to="/favorites" aria-label="Favorites" className="relative p-2">
            <Heart className="h-5 w-5 text-muted-foreground transition-colors hover:text-primary" />
            {favorites.length > 0 ? <Badge value={favorites.length} /> : null}
          </Link>
          <Link to="/cart" aria-label="Cart" className="relative p-2">
            <ShoppingCart className="h-5 w-5 text-muted-foreground transition-colors hover:text-primary" />
            {cartCount > 0 ? <Badge value={cartCount} /> : null}
          </Link>

          {isAuthenticated ? (
            <>
              {isAdmin ? (
                <Link to="/admin">
                  <Button variant="outline" size="sm">
                    <ShieldCheck className="h-4 w-4" /> Admin
                  </Button>
                </Link>
              ) : null}
              <span className="ml-1 flex items-center gap-2 text-sm text-muted-foreground">
                <UserIcon className="h-4 w-4 text-primary" />
                {user?.fullName ?? user?.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" /> Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Register</Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="text-foreground lg:hidden"
          aria-label="Toggle navigation"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-border/70 bg-surface lg:hidden",
          open ? "max-h-[32rem]" : "max-h-0 border-t-0",
        )}
      >
        <div className="space-y-1 px-4 py-4">
          {navLinks.map((link) => (
            <Link
              key={`m-${link.label}`}
              to={link.to}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-semibold uppercase text-muted-foreground hover:bg-primary/10 hover:text-primary"
            >
              {link.label === "Custom Demand" ? (
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4" /> {link.label}
                </span>
              ) : (
                link.label
              )}
            </Link>
          ))}
          {isAuthenticated ? (
            <div className="space-y-2 pt-3">
              <p className="px-3 text-sm text-muted-foreground">
                Signed in as {user?.fullName ?? user?.email}
              </p>
              {isAdmin ? (
                <Link to="/admin" className="block" onClick={() => setOpen(false)}>
                  <Button variant="outline" size="sm" full>
                    <ShieldCheck className="h-4 w-4" /> Admin
                  </Button>
                </Link>
              ) : null}
              <Button variant="ghost" size="sm" full onClick={handleLogout}>
                <LogOut className="h-4 w-4" /> Logout
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 pt-3">
              <Link to="/login" className="flex-1" onClick={() => setOpen(false)}>
                <Button variant="outline" size="sm" full>
                  Login
                </Button>
              </Link>
              <Link to="/register" className="flex-1" onClick={() => setOpen(false)}>
                <Button size="sm" full>
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function Badge({ value }: { value: number }) {
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
      {value > 99 ? "99+" : value}
    </span>
  );
}
