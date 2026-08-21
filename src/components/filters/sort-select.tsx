"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ArrowUpDown } from "lucide-react";

/**
 * Sorting is a one-interaction control: changing the select navigates
 * immediately, preserving every other active filter in the query string.
 */
export function SortSelect({
  options,
  defaultValue,
}: {
  options: { value: string; label: string }[];
  defaultValue: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="relative">
      <ArrowUpDown
        size={16}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
        aria-hidden
      />
      <select
        aria-label="Сортировка"
        defaultValue={defaultValue}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full appearance-none rounded-xl border border-border bg-card pl-10 pr-9 text-sm font-medium text-foreground transition-colors hover:border-border-strong focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/10"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
