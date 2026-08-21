import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
  basePath,
  searchParams,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  function hrefFor(p: number) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (v) params.set(k, v);
    }
    params.set("page", String(p));
    return `${basePath}?${params.toString()}`;
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  return (
    <div className="mt-8 flex items-center justify-center gap-1.5">
      <Link
        href={hrefFor(Math.max(1, page - 1))}
        aria-disabled={page === 1}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground hover:bg-surface",
          page === 1 && "pointer-events-none opacity-40"
        )}
      >
        <ChevronLeft size={16} />
      </Link>
      {pages.map((p, i) => (
        <span key={p} className="flex items-center">
          {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1 text-muted">…</span>}
          <Link
            href={hrefFor(p)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md border text-sm font-medium",
              p === page
                ? "border-primary bg-primary text-white"
                : "border-border text-foreground hover:bg-surface"
            )}
          >
            {p}
          </Link>
        </span>
      ))}
      <Link
        href={hrefFor(Math.min(totalPages, page + 1))}
        aria-disabled={page === totalPages}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground hover:bg-surface",
          page === totalPages && "pointer-events-none opacity-40"
        )}
      >
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}
