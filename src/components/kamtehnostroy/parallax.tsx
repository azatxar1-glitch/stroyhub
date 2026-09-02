"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Лёгкий параллакс для изображений.
 *
 * Контейнер обрезает содержимое, внутренний слой чуть крупнее и медленно
 * смещается по мере прохода секции через экран. Считается один раз за кадр
 * через requestAnimationFrame и меняет только transform — никакого layout.
 */
export function Parallax({
  children,
  className = "",
  /** Амплитуда смещения в процентах от высоты кадра. */
  amount = 7,
}: {
  children: ReactNode;
  className?: string;
  amount?: number;
}) {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = outer.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      if (rect.bottom < -200 || rect.top > vh + 200) return;
      // -1 — секция ниже экрана, 1 — уже над ним.
      const progress = (rect.top + rect.height / 2 - vh / 2) / (vh / 2 + rect.height / 2);
      const clamped = Math.max(-1, Math.min(1, progress));
      inner.style.transform = `translate3d(0, ${(clamped * amount).toFixed(2)}%, 0)`;
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
  }, [amount]);

  return (
    <div ref={outerRef} className={`relative overflow-hidden ${className}`}>
      <div
        ref={innerRef}
        className="absolute inset-0"
        style={{ height: `${100 + amount * 2}%`, top: `-${amount}%` }}
      >
        {children}
      </div>
    </div>
  );
}
