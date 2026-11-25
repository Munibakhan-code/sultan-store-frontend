import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/common/Button";

/** Sits directly below the navbar on every store page. */
export function CustomDemandBar() {
  return (
    <div className="border-b border-border/70 bg-surface/70">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 px-4 py-3 sm:px-6">
        <p className="text-sm text-muted-foreground">
          Can&apos;t find the account you want? Tell us exactly what you need.
        </p>
        <Link to="/custom-demand">
          <Button size="sm">
            <Sparkles className="h-4 w-4" /> Custom Demand
          </Button>
        </Link>
      </div>
    </div>
  );
}
