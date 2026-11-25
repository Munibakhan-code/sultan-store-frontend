import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/common/Button";
import heroVideo from "@/assets/hero-pubg.mp4.asset.json";

/**
 * Cinematic hero. The backend settings API can override the background video;
 * otherwise we play the bundled PUBG hero clip.
 */
export function HeroSection({ videoUrl }: { videoUrl?: string | null }) {
  const source = videoUrl || heroVideo.url;

  return (
    <section className="relative isolate overflow-hidden border-b border-border/70">
      {source ? (
        <video
          key={source}
          src={source}
          autoPlay
          // muted
          loop
          playsInline
          preload="auto"
          aria-hidden
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 -z-10 bg-gradient-hero bg-surface" aria-hidden />
      )}

      <div className="absolute inset-0 -z-10 bg-background/25" aria-hidden />
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-t from-background/80 via-background/20 to-transparent"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:py-72">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
          <ShieldCheck className="h-3.5 w-3.5" /> Verified &amp; secure marketplace
        </span>
        <h1 className="mx-auto mt-6 max-w-4xl font-display text-4xl font-bold uppercase leading-tight text-foreground sm:text-5xl lg:text-6xl">
          Sultan Official <span className="text-gradient-gold">PUBG Store</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Premium PUBG Mobile accounts — Mythic fashion, Glacier sets, maxed levels and Conqueror
          ranks. Verified ownership, secure payment and instant handover.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link to="/accounts">
            <Button size="lg">Browse Accounts</Button>
          </Link>
          <Link to="/custom-demand">
            <Button size="lg" variant="outline">
              Custom Demand
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
