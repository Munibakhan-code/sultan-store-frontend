import { Link } from "@tanstack/react-router";
import { Clock, ShieldCheck, Truck, BadgeCheck } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

const trustItems = [
  { icon: ShieldCheck, label: "100% Secure Transactions" },
  { icon: Truck, label: "Fast & Instant Delivery" },
  { icon: BadgeCheck, label: "Verified & Trusted Accounts" },
  { icon: Clock, label: "24/7 Live Support" },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/70 bg-surface">
      <div className="border-b border-border/70">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {trustItems.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <Icon className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div className="space-y-3">
          <Logo compact />
          <p className="max-w-xs text-sm text-muted-foreground">
            Sultan Official PUBG Store — the trusted marketplace for verified PUBG Mobile accounts,
            delivered instantly and backed by real support.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">Account</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/login" className="hover:text-primary">
                Login
              </Link>
            </li>
            <li>
              <Link to="/register" className="hover:text-primary">
                Create account
              </Link>
            </li>
            <li>
              <Link to="/forgot-password" className="hover:text-primary">
                Forgot password
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">Support</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>Live chat — coming soon</li>
            <li>support@sultanstore.pk</li>
            <li>Mon–Sun, 24 hours</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/70 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Sultan Official PUBG Store. Not affiliated with PUBG
        Corporation.
      </div>
    </footer>
  );
}
