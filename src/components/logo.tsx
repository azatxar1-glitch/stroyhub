import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Wordmark + a construction-crane glyph. Drawn inline so it stays crisp,
 * inherits color, and costs no extra request.
 */
export function Logo({ className, onDark = false }: { className?: string; onDark?: boolean }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)} aria-label="СтройХаб — на главную">
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl",
          onDark ? "bg-white/10 text-accent" : "bg-primary text-accent"
        )}
      >
        <CraneGlyph />
      </span>
      <span
        className={cn(
          "text-[17px] font-extrabold leading-none tracking-tight",
          onDark ? "text-white" : "text-foreground"
        )}
      >
        Строй<span className={onDark ? "text-accent" : "text-accent-text"}>Хаб</span>
      </span>
    </Link>
  );
}

function CraneGlyph() {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden>
      {/* mast */}
      <path d="M8 18V5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {/* jib */}
      <path d="M3 5h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      {/* counter-jib brace */}
      <path d="M8 5 4.5 8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.65" />
      {/* hoist line + load */}
      <path d="M14.5 5v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="12.8" y="8.5" width="3.4" height="3" rx="0.8" fill="currentColor" />
      {/* base */}
      <path d="M5 18h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
