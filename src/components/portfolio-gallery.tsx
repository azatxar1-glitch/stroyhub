"use client";

import { useState } from "react";
import { X } from "lucide-react";

type Item = { id: string; title: string; description: string | null; imageUrl: string };

/** Portfolio grid with a lightbox — images are the strongest buying signal here. */
export function PortfolioGallery({ items }: { items: Item[] }) {
  const [active, setActive] = useState<Item | null>(null);

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setActive(item)}
              className="group block w-full overflow-hidden rounded-xl border border-border text-left transition-colors hover:border-accent"
            >
              <span className="block aspect-4/3 overflow-hidden bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </span>
              <span className="block truncate px-3 py-2.5 text-sm font-medium text-foreground">{item.title}</span>
            </button>
          </li>
        ))}
      </ul>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-primary/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
          onClick={() => setActive(null)}
        >
          <button
            type="button"
            onClick={() => setActive(null)}
            aria-label="Закрыть"
            className="absolute right-4 top-4 rounded-lg bg-white/10 p-2.5 text-white transition-colors hover:bg-white/20"
          >
            <X size={20} aria-hidden />
          </button>
          <figure
            className="max-h-full w-full max-w-3xl overflow-hidden rounded-2xl bg-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={active.imageUrl} alt={active.title} className="max-h-[70vh] w-full object-contain bg-surface" />
            <figcaption className="p-5">
              <h3 className="text-base font-bold text-foreground">{active.title}</h3>
              {active.description && (
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{active.description}</p>
              )}
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
}
