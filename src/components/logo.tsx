import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Wordmark + the brand cube mark. Drawn inline so it stays crisp, follows the
 * palette, and costs no extra request.
 *
 * Знак повторяет public/logo.svg из фирменного набора. Обводка идёт
 * currentColor, а грань — var(--accent): при смене палитры логотип поедет
 * за ней сам, отдельной правки не потребуется.
 */
export function Logo({ className, onDark = false }: { className?: string; onDark?: boolean }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)} aria-label="СтройХаб — на главную">
      <CubeMark className={cn("h-9 w-9 shrink-0", onDark ? "text-white" : "text-foreground")} />
      <span
        className={cn(
          "text-[17px] font-extrabold leading-none tracking-tight",
          onDark ? "text-white" : "text-foreground"
        )}
      >
        {/* На светлом фоне «Хаб» идёт затемнённым оранжевым: чистый #f97316
            даёт 2.8:1 и читается плохо. */}
        Строй<span className={onDark ? "text-accent" : "text-accent-text"}>Хаб</span>
      </span>
    </Link>
  );
}

function CubeMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
      <path d="M24,8 L37.86,16 L37.86,32 L24,24 Z" fill="var(--accent)" />
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <path d="M24,8 L37.86,16 L37.86,32 L24,40 L10.14,32 L10.14,16 Z" />
        <path d="M24,8 L24,24 M24,24 L10.14,32 M24,24 L37.86,32" />
      </g>
      <g fill="currentColor">
        <circle cx="24" cy="24" r="2.9" />
        <circle cx="24" cy="8" r="2.9" />
        <circle cx="10.14" cy="32" r="2.9" />
        <circle cx="37.86" cy="32" r="2.9" />
      </g>
    </svg>
  );
}
