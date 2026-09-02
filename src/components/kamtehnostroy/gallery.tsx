"use client";

import { useState } from "react";
import { gallery, galleryCategories, type GalleryCategory } from "@/data/kamtehnostroy";
import { Frame } from "./frame";
import { Reveal, RevealLines } from "./reveal";

const RATIO: Record<string, string> = {
  tall: "aspect-[3/4]",
  wide: "aspect-[16/10]",
  default: "aspect-[4/3]",
};

/**
 * Masonry-галерея на CSS-колонках: плитки разной высоты, без библиотек
 * и без скачков раскладки. Пока в `gallery.ts` нет путей к фотографиям,
 * каждая плитка показывает чертёжный placeholder.
 */
export function Gallery() {
  const [filter, setFilter] = useState<GalleryCategory | "Все">("Все");
  const items = filter === "Все" ? gallery : gallery.filter((i) => i.category === filter);

  return (
    <section aria-labelledby="gallery-title">
      <div className="kt-container kt-section">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <RevealLines as="h2" id="gallery-title" lines={["ФОТОГАЛЕРЕЯ"]} className="kt-display-md" />

          <Reveal delay={120}>
            <div
              className="no-scrollbar -mx-[var(--kt-gutter)] flex gap-2 overflow-x-auto px-[var(--kt-gutter)] lg:mx-0 lg:flex-wrap lg:px-0"
              role="group"
              aria-label="Фильтр галереи"
            >
              {(["Все", ...galleryCategories] as const).map((category) => {
                const active = filter === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setFilter(category)}
                    aria-pressed={active}
                    className="shrink-0 whitespace-nowrap border px-4 py-2.5 text-[0.75rem] font-semibold uppercase tracking-[0.12em] transition-colors duration-300"
                    style={{
                      borderColor: active ? "var(--kt-ink)" : "var(--kt-line)",
                      backgroundColor: active ? "var(--kt-ink)" : "transparent",
                      color: active ? "var(--kt-paper)" : "var(--kt-muted)",
                    }}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </Reveal>
        </div>

        <div className="mt-12 gap-5 [column-count:1] sm:[column-count:2] lg:[column-count:3]">
          {items.map((item, i) => (
            <div key={item.id} className="mb-5 break-inside-avoid">
              <Reveal delay={(i % 3) * 80} className="kt-zoom">
                <Frame
                  src={item.src}
                  alt={item.alt}
                  label={item.alt}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className={`w-full ${RATIO[item.span ?? "default"]}`}
                />
                <p className="kt-eyebrow mt-3">{item.category}</p>
              </Reveal>
            </div>
          ))}
        </div>

        {items.length === 0 ? (
          <p className="mt-12 text-sm" style={{ color: "var(--kt-muted)" }}>
            В этой категории пока нет фотографий.
          </p>
        ) : null}
      </div>
    </section>
  );
}
