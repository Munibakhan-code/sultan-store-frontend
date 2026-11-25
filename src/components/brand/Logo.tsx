import { Link } from "@tanstack/react-router";
// import logoAsset from "@/assets/sultan-logo.png.asset.json";
import { cn } from "@/lib/utils";
import logo from "../../../public/logo.png"

export function Logo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link to="/home" className={cn("flex items-center gap-3", className)}>
      <img
        src={logo}
        alt="Sultan Official PUBG Store logo"
        className={cn("w-auto object-contain", compact ? "h-20" : "h-28")}
      />
    </Link>
  );
}
