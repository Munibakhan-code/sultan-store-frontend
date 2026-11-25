import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
// import logoAsset from "@/assets/sultan-logo.png.asset.json";
import logo from "../../public/logo.png"

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-gradient-hero" aria-hidden />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link to="/home">
            <img
              src={logo}
              alt="Sultan Official PUBG Store logo"
              className="h-20 w-auto object-contain"
            />
          </Link>
          <h1 className="mt-5 font-display text-2xl font-bold uppercase tracking-wide text-foreground">
            {title}
          </h1>
          {subtitle ? <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>

        <div className="glass-panel rounded-xl p-6 shadow-panel sm:p-8">{children}</div>

        {footer ? <div className="mt-6 text-center text-sm">{footer}</div> : null}
      </div>
    </div>
  );
}
