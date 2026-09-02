import { BlueprintGrid } from "./blueprint-grid";
import { PlanFragment } from "./hero-blueprint";
import { cn } from "@/lib/utils";

/**
 * Section-level decorative layer. Intensity steps down as the page progresses
 * (hero → categories → listings → footer) so the drafting texture fades out
 * instead of competing with content all the way down.
 *
 * Renders only background layers; the caller keeps its own content above it.
 * The parent needs `relative` and, for bleeding elements, `overflow-hidden`.
 */
export function ArchitecturalBackground({
  intensity = "medium",
  showPlan = false,
  className,
}: {
  intensity?: "medium" | "subtle" | "faint";
  showPlan?: boolean;
  className?: string;
}) {
  const fade = intensity === "medium" ? 1 : intensity === "subtle" ? 0.5 : 0.28;

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <BlueprintGrid tone="light" fade={fade} />

      {/* Corner plan fragment — desktop only, and only where asked for. */}
      {showPlan && (
        <PlanFragment className="absolute -right-14 bottom-6 hidden w-72 text-foreground/[0.055] lg:block" />
      )}

      {/* Soft wash that lets the grid dissolve toward the section edges. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,var(--card)_88%)] opacity-70" />
    </div>
  );
}
