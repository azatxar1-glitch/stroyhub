"use client";

import { useEffect, useState } from "react";
import { company, isPlaceholder } from "@/data/kamtehnostroy";
import { Text } from "./frame";
import { Reveal, RevealLines, useInView } from "./reveal";
import { useReducedMotion } from "./use-media-query";

/**
 * Блок масштаба: направления деятельности и показатели компании.
 * Цифр компании нет — в `company.stats` стоят placeholder-ы. Как только
 * там появится число, счётчик начнёт считать при появлении блока в кадре.
 */
export function Directions() {
  return (
    <section aria-labelledby="directions-title">
      <DirectionsMarquee />

      <div className="kt-container kt-section">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <RevealLines
            as="h2"
            id="directions-title"
            lines={company.directionsTitle}
            className="kt-display-md"
          />
          <Reveal delay={160} className="max-w-[38ch] lg:max-w-[26ch] lg:shrink-0">
            <p className="text-sm leading-relaxed" style={{ color: "var(--kt-muted)" }}>
              <Text value={company.directionsNote} />
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4" style={{ backgroundColor: "var(--kt-line)" }}>
          {company.directions.map((item, i) => (
            /* Ячейка непрозрачна и не участвует в появлении: сетка держится
               на однопиксельных зазорах, сквозь которые видно подложку
               контейнера — прозрачная ячейка выглядела бы серым блоком. */
            <div
              key={item.number}
              className="group flex min-h-[10rem] bg-[var(--kt-paper)] p-6 transition-colors duration-500 hover:bg-[var(--kt-paper-2)] sm:min-h-[15rem] lg:min-h-[18rem] lg:p-8"
            >
              <Reveal delay={i * 90} className="flex flex-1 flex-col justify-between">
                <span
                  className="kt-num text-sm font-semibold tracking-[0.16em] transition-colors duration-500 group-hover:text-[var(--kt-accent-text)]"
                  style={{ color: "var(--kt-faint)" }}
                >
                  {item.number}
                </span>
                <div className="mt-10">
                  <h3 className="text-[1.375rem] font-bold uppercase leading-tight tracking-tight lg:text-[1.625rem]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-[0.8125rem] leading-relaxed" style={{ color: "var(--kt-muted)" }}>
                    <Text value={item.note} />
                  </p>
                </div>
              </Reveal>
            </div>
          ))}
        </div>

        <Stats />
      </div>
    </section>
  );
}

/** Тонкая тёмная лента-переход между первым экраном и светлой частью сайта. */
function DirectionsMarquee() {
  const words = company.directions.map((d) => d.title);
  const line = [...words, ...words, ...words];

  return (
    <div className="kt-dark py-4" aria-hidden>
      <div className="kt-marquee">
        <div className="kt-marquee__track">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0">
              {line.map((word, i) => (
                <span
                  key={`${copy}-${word}-${i}`}
                  className="flex items-center gap-8 whitespace-nowrap px-8 text-[0.6875rem] font-semibold uppercase tracking-[0.28em]"
                  style={{ color: "var(--kt-on-dark-muted)" }}
                >
                  {word}
                  <span
                    className="inline-block h-1 w-1 rotate-45"
                    style={{ backgroundColor: "var(--kt-accent-on-dark)" }}
                  />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stats() {
  return (
    <div
      className="mt-20 grid grid-cols-1 gap-px border-t sm:grid-cols-2 lg:grid-cols-4"
      style={{ borderColor: "var(--kt-line)" }}
    >
      {company.stats.map((stat, i) => (
        <Reveal
          key={stat.label}
          delay={i * 80}
          className="border-b py-8 pr-6 lg:border-b-0 lg:py-10"
        >
          <div className="flex items-baseline gap-1">
            <StatValue value={stat.value} />
            {!isPlaceholder(stat.value) && stat.suffix ? (
              <span
                className="text-[1.75rem] font-bold"
                style={{ color: "var(--kt-accent-text)" }}
              >
                {stat.suffix}
              </span>
            ) : null}
          </div>
          <p className="kt-eyebrow mt-3">{stat.label}</p>
        </Reveal>
      ))}
    </div>
  );
}

/**
 * Показатель. Реальное число анимируется от нуля, placeholder остаётся
 * пунктирной «заплаткой» — сайт никогда не покажет выдуманную цифру.
 */
function StatValue({ value }: { value: string }) {
  const { ref, inView } = useInView<HTMLSpanElement>({ threshold: 0.5 });
  const numeric = Number(value.replace(/\s/g, ""));
  const isNumber = !isPlaceholder(value) && Number.isFinite(numeric);

  if (!isNumber) {
    return (
      <span className="text-[1.5rem] font-bold sm:text-[1.75rem]">
        <Text value={value} />
      </span>
    );
  }

  return (
    <span
      ref={ref}
      className="kt-num text-[2.75rem] font-extrabold leading-none tracking-tight lg:text-[3.5rem]"
    >
      <CountUp to={numeric} run={inView} />
    </span>
  );
}

/** Счётчик на requestAnimationFrame — без сторонних библиотек. */
function CountUp({ to, run }: { to: number; run: boolean }) {
  const [shown, setShown] = useState(0);
  const calm = useReducedMotion();

  useEffect(() => {
    if (!run || calm) return;

    const duration = 1400;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutExpo — быстрый старт, мягкая остановка.
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setShown(Math.round(to * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [run, to, calm]);

  return <>{(calm ? to : shown).toLocaleString("ru-RU")}</>;
}
