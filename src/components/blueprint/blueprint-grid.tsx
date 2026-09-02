import { cn } from "@/lib/utils";

/**
 * Drafting grid layer. Pure CSS gradients — no image request, no DOM cost
 * beyond a single absolutely positioned div.
 *
 * `tone="dark"` draws light lines (for ink sections), `tone="light"` draws
 * ink lines (for white sections). `fade` scales the line opacity so a section
 * can carry less texture than the one above it.
 */
export function BlueprintGrid({
  tone = "light",
  fade = 1,
  size,
  className,
}: {
  tone?: "light" | "dark";
  fade?: number;
  size?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0",
        tone === "dark" ? "blueprint-grid" : "blueprint-grid-light",
        className
      )}
      style={
        {
          ...(size ? { "--bp-size": `${size}px` } : null),
          ...(tone === "light" ? { "--bp-fade": fade } : { opacity: fade }),
        } as React.CSSProperties
      }
    />
  );
}
