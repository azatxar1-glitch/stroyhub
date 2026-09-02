"use client";

import { useEffect, useRef, useState } from "react";
import { processSteps, processTitle } from "@/data/kamtehnostroy";
import { Text } from "./frame";
import { RevealLines } from "./reveal";
import { sx } from "./sx";

/**
 * Таймлайн процесса. Вертикальная линия заполняется по мере прокрутки,
 * шаги проявляются по одному.
 *
 * Это визуальная модель, а не описание формального регламента компании —
 * содержимое берётся из `process.ts` и заменяется на реальные этапы.
 */
export function Process() {
  const trackRef = useRef<HTMLOListElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // Линия заполняется, пока секция проходит через середину экрана.
      const start = vh * 0.72;
      const done = Math.max(1, rect.height - vh * 0.28);
      const value = (start - rect.top) / done;
      const clamped = Math.max(0, Math.min(1, value));
      setProgress(clamped);
      setActive(Math.floor(clamped * processSteps.length + 0.0001) - 1);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section aria-labelledby="process-title" style={{ backgroundColor: "var(--kt-paper-2)" }}>
      <div className="kt-container kt-section">
        <RevealLines
          as="h2"
          id="process-title"
          lines={processTitle}
          className="kt-display-md"
        />

        <ol ref={trackRef} className="relative mt-16 lg:mt-24">
          {/* Направляющая и заполняемая линия. */}
          <span
            aria-hidden
            className="absolute bottom-0 left-[0.4375rem] top-0 w-px lg:left-[0.5625rem]"
            style={{ backgroundColor: "var(--kt-line)" }}
          />
          <span
            aria-hidden
            className="kt-timeline__progress absolute bottom-0 left-[0.4375rem] top-0 w-px lg:left-[0.5625rem]"
            style={sx({ backgroundColor: "var(--kt-accent)", "--kt-progress": progress })}
          />

          {processSteps.map((step, i) => {
            const reached = i <= active;
            return (
              <li
                key={step.number}
                className="relative grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 pb-12 last:pb-0 lg:grid-cols-[auto_10rem_minmax(0,1fr)] lg:gap-x-10 lg:pb-16"
                style={{
                  opacity: reached ? 1 : 0.32,
                  transform: reached ? "none" : "translateY(10px)",
                  transition:
                    "opacity .7s cubic-bezier(.22,1,.36,1), transform .7s cubic-bezier(.22,1,.36,1)",
                }}
              >
                <span
                  aria-hidden
                  className="mt-2 h-[0.9375rem] w-[0.9375rem] shrink-0 rounded-full border-[3px] lg:h-[1.1875rem] lg:w-[1.1875rem]"
                  style={{
                    backgroundColor: "var(--kt-paper-2)",
                    borderColor: reached ? "var(--kt-accent)" : "var(--kt-line)",
                    transition: "border-color .5s ease",
                  }}
                />
                <span className="kt-num self-start text-xs font-semibold tracking-[0.16em] lg:mt-2.5" style={{ color: "var(--kt-faint)" }}>
                  {step.number}
                </span>
                <div className="col-start-2 lg:col-start-3">
                  <h3 className="text-xl font-semibold tracking-tight lg:text-2xl">{step.title}</h3>
                  <p className="mt-2 max-w-[52ch] text-sm leading-relaxed" style={{ color: "var(--kt-muted)" }}>
                    <Text value={step.text} />
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
