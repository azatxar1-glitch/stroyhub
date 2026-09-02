"use client";

import { useEffect, useRef } from "react";
import { ArrowDown, ArrowRight } from "lucide-react";
import { company } from "@/data/kamtehnostroy";
import { Frame } from "./frame";
import { sx } from "./sx";

/**
 * Первый экран.
 *
 * Появление при загрузке: строки заголовка выезжают из-под масок, следом
 * подзаголовок, кнопки и опорные слова. Параллакс от мыши намеренно очень
 * слабый (единицы пикселей) — кадр должен читаться как живой, а не как эффект.
 */
export function Hero() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    // Параллакс только там, где есть настоящий курсор и разрешено движение.
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || calm) return;

    let frame = 0;
    const onMove = (e: PointerEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.setProperty("--kt-mx", x.toFixed(3));
        el.style.setProperty("--kt-my", y.toFixed(3));
      });
    };
    const onLeave = () => {
      el.style.setProperty("--kt-mx", "0");
      el.style.setProperty("--kt-my", "0");
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const { hero } = company;

  return (
    <section
      id="top"
      ref={sectionRef}
      className="kt-dark relative flex min-h-[100svh] flex-col overflow-hidden"
      style={sx({ "--kt-mx": 0, "--kt-my": 0 })}
    >
      {/* Кадр объекта. Слой немного крупнее экрана, чтобы параллакс не открыл края. */}
      <div
        className="absolute inset-0"
        style={sx({
          transform:
            "translate3d(calc(var(--kt-mx) * -14px), calc(var(--kt-my) * -14px), 0) scale(1.06)",
          transition: "transform .9s cubic-bezier(.22,1,.36,1)",
        })}
      >
        <Frame
          src={hero.image}
          alt={hero.imageAlt}
          label="[ДОБАВИТЬ ФОТО ОБЪЕКТА]"
          dark
          priority
          sizes="100vw"
          className="absolute inset-0"
        />
      </div>

      {/* Затемнение под текстом и чертёжная сетка поверх кадра. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgb(11 12 14 / .78) 0%, rgb(11 12 14 / .40) 34%, rgb(11 12 14 / .62) 72%, rgb(11 12 14 / .93) 100%)",
        }}
      />
      <div aria-hidden className="kt-grid-dark absolute inset-0 opacity-70" />

      <div className="kt-container relative flex flex-1 flex-col pb-8 pt-28 sm:pt-32 lg:pb-12">
        <div
          className="kt-enter flex items-center gap-4 pt-6 sm:pt-10"
          style={sx({ "--kt-delay": "120ms" })}
        >
          <span className="kt-eyebrow shrink-0" style={{ color: "var(--kt-on-dark-muted)" }}>
            {hero.eyebrow}
          </span>
          <span
            aria-hidden
            className="kt-enter-grow hidden h-px flex-1 sm:block"
            style={sx({ backgroundColor: "var(--kt-line-dark)", "--kt-delay": "260ms" })}
          />
        </div>

        <div className="flex flex-1 flex-col justify-end">
          <h1
            className="kt-display mt-16"
            style={{
              transform: "translate3d(calc(var(--kt-mx) * 6px), calc(var(--kt-my) * 6px), 0)",
              transition: "transform 1.1s cubic-bezier(.22,1,.36,1)",
            }}
          >
            {hero.headline.map((line, i) => (
              <span key={line} className="kt-enter-line" style={sx({ "--kt-delay": `${180 + i * 110}ms` })}>
                <span>{line}</span>
              </span>
            ))}
          </h1>

          <div className="mt-10 grid grid-cols-1 gap-10 lg:mt-14 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-16">
            <div>
              <p
                className="kt-enter max-w-[46ch] text-[0.9375rem] leading-relaxed sm:text-base"
                style={sx({ color: "var(--kt-on-dark-muted)", "--kt-delay": "560ms" })}
              >
                {hero.subline}
              </p>

              <div
                className="kt-enter mt-8 flex flex-col gap-3 sm:flex-row"
                style={sx({ "--kt-delay": "680ms" })}
              >
                <a href="#contacts" className="kt-btn kt-btn--light">
                  Обсудить проект
                  <ArrowRight size={16} className="kt-btn__arrow" aria-hidden />
                </a>
                <a href="#projects" className="kt-btn kt-btn--outline-dark kt-btn--down">
                  Наши объекты
                  <ArrowDown size={16} className="kt-btn__arrow" aria-hidden />
                </a>
              </div>
            </div>

            {/* Опорные слова — минималистичный floating-блок. */}
            <div className="kt-enter" style={sx({ "--kt-delay": "820ms" })}>
              <ul
                /* Параллакс живёт на отдельном слое: анимация появления
                   управляет transform родителя и затёрла бы его. */
                style={{
                  transform:
                    "translate3d(calc(var(--kt-mx) * -8px), calc(var(--kt-my) * -8px), 0)",
                  transition: "transform 1.1s cubic-bezier(.22,1,.36,1)",
                  borderColor: "var(--kt-line-dark)",
                }}
                className="flex flex-wrap gap-x-5 gap-y-2 border-t pt-5 sm:gap-x-10 lg:flex-col lg:gap-0 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0"
              >
                {hero.marks.map((mark, i) => (
                  <li
                    key={mark}
                    /* Разделители между словами нужны только в вертикальной
                       колонке на десктопе — в строке они были бы лишними. */
                    className={`lg:py-3.5 ${i > 0 ? "lg:border-t" : ""}`}
                  >
                    <span
                      className="kt-num mr-2 text-[0.625rem] font-semibold tracking-[0.2em]"
                      style={{ color: "var(--kt-accent-on-dark)" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.22em]">
                      {mark}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div
          className="kt-enter mt-12 flex items-center justify-between border-t pt-5"
          style={sx({ borderColor: "var(--kt-line-dark)", "--kt-delay": "980ms" })}
        >
          <span className="kt-eyebrow" style={{ color: "var(--kt-on-dark-faint)" }}>
            Прокрутите вниз
          </span>
          <span
            aria-hidden
            className="kt-scroll-cue flex h-8 w-8 items-center justify-center rounded-full border"
            style={{ borderColor: "var(--kt-line-dark)" }}
          >
            <ArrowDown size={14} />
          </span>
        </div>
      </div>
    </section>
  );
}
