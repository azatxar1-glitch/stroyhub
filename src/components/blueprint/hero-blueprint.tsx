import { cn } from "@/lib/utils";

/**
 * Abstract architectural line work for the hero: an isometric building massing
 * with dimension lines, a radius arc and survey marks.
 *
 * Drawn with `currentColor` at a low opacity so it reads as part of the
 * background rather than an illustration. Strokes are non-scaling so the
 * hairlines stay crisp at any size. Hidden below `lg` by the caller.
 */
export function HeroBlueprint({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 420 420"
      fill="none"
      aria-hidden
      focusable="false"
      className={cn("pointer-events-none select-none", className)}
    >
      <g
        stroke="currentColor"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* --- isometric massing: three stacked volumes --- */}
        {/* base volume */}
        <path d="M60 300 L200 380 L340 300 L200 220 Z" />
        <path d="M60 300 V236 L200 156 L340 236 V300" />
        <path d="M200 220 V156" />
        <path d="M60 236 L200 316 L340 236" opacity="0.75" />
        <path d="M200 316 V380" opacity="0.75" />

        {/* mid volume */}
        <path d="M108 208 L200 261 L292 208 L200 155 Z" opacity="0.9" />
        <path d="M108 208 V150 L200 97 L292 150 V208" opacity="0.9" />
        <path d="M200 155 V97" opacity="0.9" />

        {/* crown */}
        <path d="M152 128 L200 156 L248 128 L200 100 Z" opacity="0.8" />
        <path d="M152 128 V92 L200 64 L248 92 V128" opacity="0.8" />
        <path d="M200 100 V64" opacity="0.8" />

        {/* mast */}
        <path d="M200 64 V24" opacity="0.6" />
        <circle cx="200" cy="20" r="3.5" opacity="0.6" />

        {/* --- dimension line along the base --- */}
        <path d="M46 316 L46 392" opacity="0.5" />
        <path d="M354 316 L354 392" opacity="0.5" />
        <path d="M46 384 H354" opacity="0.5" />
        <path d="M52 379 L46 384 L52 389" opacity="0.5" />
        <path d="M348 379 L354 384 L348 389" opacity="0.5" />

        {/* --- radius arc, as on a site plan --- */}
        <path d="M340 236 A140 140 0 0 1 200 376" opacity="0.35" strokeDasharray="5 7" />

        {/* --- survey / setting-out marks --- */}
        <g opacity="0.55">
          <path d="M28 120 h18 M37 111 v18" />
          <circle cx="37" cy="120" r="7" />
        </g>
        <g opacity="0.45">
          <path d="M380 96 h14 M387 89 v14" />
        </g>
        <g opacity="0.45">
          <path d="M366 340 h14 M373 333 v14" />
        </g>

        {/* --- plan fragment, top-left --- */}
        <g opacity="0.4">
          <rect x="24" y="196" width="64" height="46" rx="2" />
          <path d="M24 219 h64" />
          <path d="M56 196 v46" />
        </g>

        {/* --- level markers on the right --- */}
        <g opacity="0.4">
          <path d="M356 168 h44" />
          <path d="M356 200 h34" />
          <path d="M356 232 h44" />
        </g>
      </g>
    </svg>
  );
}

/**
 * Smaller counterpart used low on the opposite side of the hero — a floor-plan
 * fragment rather than a massing, so the two do not read as a mirrored pair.
 */
export function PlanFragment({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 260 200"
      fill="none"
      aria-hidden
      focusable="false"
      className={cn("pointer-events-none select-none", className)}
    >
      <g
        stroke="currentColor"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* outer walls */}
        <path d="M20 24 H240 V176 H20 Z" />
        <path d="M32 36 H228 V164 H32 Z" opacity="0.55" />

        {/* partitions */}
        <path d="M116 36 V164" opacity="0.7" />
        <path d="M116 100 H228" opacity="0.7" />
        <path d="M172 100 V164" opacity="0.5" />

        {/* door swing */}
        <path d="M116 68 h26" opacity="0.6" />
        <path d="M142 68 A26 26 0 0 1 116 94" opacity="0.35" strokeDasharray="4 6" />

        {/* window openings */}
        <path d="M52 24 h32" strokeWidth="3" opacity="0.35" />
        <path d="M156 24 h40" strokeWidth="3" opacity="0.35" />
        <path d="M20 108 v34" strokeWidth="3" opacity="0.35" />

        {/* grid reference bubbles */}
        <g opacity="0.5">
          <circle cx="20" cy="10" r="8" />
          <circle cx="116" cy="10" r="8" />
          <circle cx="240" cy="10" r="8" />
        </g>

        {/* dimension line */}
        <g opacity="0.45">
          <path d="M20 190 H240" />
          <path d="M26 185 L20 190 L26 195" />
          <path d="M234 185 L240 190 L234 195" />
          <path d="M116 184 v12" />
        </g>
      </g>
    </svg>
  );
}
