"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * One filter form, two presentations: a docked sidebar on desktop and a
 * bottom drawer on mobile. The children are the actual fields, so pages stay
 * server-rendered and filtering keeps working as a plain GET form.
 */
export function FilterShell({
  children,
  action,
  activeCount,
  resetHref,
}: {
  children: React.ReactNode;
  action: string;
  activeCount: number;
  resetHref: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* Mobile trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm font-semibold text-foreground transition-colors hover:border-border-strong lg:hidden"
      >
        <SlidersHorizontal size={16} aria-hidden />
        Фильтры
        {activeCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-accent-foreground">
            {activeCount}
          </span>
        )}
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block">
        <form action={action} className="sticky top-24 rounded-2xl border border-border bg-card p-5">
          <FilterHeader activeCount={activeCount} resetHref={resetHref} />
          <div className="mt-4 space-y-5">{children}</div>
          <button
            type="submit"
            className="mt-6 h-11 w-full rounded-xl bg-accent text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover"
          >
            Применить
          </button>
        </form>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Фильтры">
          <div className="absolute inset-0 bg-primary/50" onClick={() => setOpen(false)} aria-hidden />
          <form
            action={action}
            className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-3xl bg-card"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-base font-bold text-foreground">Фильтры</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-muted hover:bg-surface"
                aria-label="Закрыть фильтры"
              >
                <X size={20} aria-hidden />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 scrollbar-thin">{children}</div>

            <div className="flex gap-2.5 border-t border-border px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <a
                href={resetHref}
                className="flex h-11 flex-1 items-center justify-center rounded-xl border border-border text-sm font-semibold text-foreground"
              >
                Сбросить
              </a>
              <button
                type="submit"
                className="h-11 flex-[2] rounded-xl bg-accent text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover"
              >
                Показать результаты
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function FilterHeader({ activeCount, resetHref }: { activeCount: number; resetHref: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-bold text-foreground">Фильтры</h2>
      {activeCount > 0 && (
        <a href={resetHref} className="text-xs font-semibold text-accent-text hover:underline">
          Сбросить ({activeCount})
        </a>
      )}
    </div>
  );
}

/** Labelled group inside the filter form. */
export function FilterGroup({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cn("border-0 p-0", className)}>
      <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-faint">{label}</legend>
      {children}
    </fieldset>
  );
}
