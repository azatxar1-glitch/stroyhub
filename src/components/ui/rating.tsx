"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({
  value,
  count,
  size = 16,
  showValue = true,
}: {
  value: number;
  count?: number;
  size?: number;
  showValue?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={size}
            className={cn(
              i <= Math.round(value) ? "fill-accent text-accent" : "fill-border text-border"
            )}
          />
        ))}
      </div>
      {showValue && (
        <span className="text-sm text-muted">
          {value > 0 ? value.toFixed(1) : "нет"}
          {count !== undefined ? ` (${count})` : ""}
        </span>
      )}
    </div>
  );
}

export function RatingInput({
  value,
  onChange,
  size = 28,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className="cursor-pointer transition-transform hover:scale-110"
        >
          <Star
            size={size}
            className={cn(i <= value ? "fill-accent text-accent" : "fill-border text-border")}
          />
        </button>
      ))}
    </div>
  );
}
