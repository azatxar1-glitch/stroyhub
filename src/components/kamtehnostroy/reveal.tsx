"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

/**
 * Одиночный IntersectionObserver-хук: элемент помечается `data-shown="true"`,
 * когда впервые попадает в кадр. Дальше всё делает CSS (kt.css) — никакой
 * анимационной библиотеки не требуется.
 */
export function useInView<T extends HTMLElement>(options?: {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}) {
  const {
    threshold = 0.15,
    /**
     * Снизу область наблюдения поджата на 12% — блок появляется, когда
     * заметно вошёл в кадр. Сверху она, наоборот, расширена: иначе при
     * переходе по якорю или быстром перетаскивании скроллбара блок
     * «перепрыгивают», пересечения не происходит, и он остаётся невидимым.
     */
    rootMargin = "999999px 0px -12% 0px",
    once = true,
  } = options ?? {};
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Без поддержки observer-а просто показываем содержимое.
    if (typeof IntersectionObserver === "undefined") {
      const timer = setTimeout(() => setInView(true), 0);
      return () => clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // `bottom < 0` — блок уже выше экрана. Так бывает при переходе по
          // якорю или быстром перетаскивании скроллбара: пересечения не было,
          // и без этой проверки секция осталась бы невидимой навсегда.
          const passed = entry.boundingClientRect.bottom < 0;
          if (entry.isIntersecting || passed) {
            setInView(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, inView } as const;
}

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Задержка появления, мс. */
  delay?: number;
  /**
   * `fade` — сам блок выезжает снизу.
   * `none` — блок не двигается, но потомки (`.kt-line-mask`) получают сигнал.
   */
  variant?: "fade" | "none";
  as?: ElementType;
  id?: string;
};

export function Reveal({
  children,
  className = "",
  delay = 0,
  variant = "fade",
  as: Tag = "div",
  id,
}: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <Tag
      ref={ref}
      id={id}
      data-shown={inView ? "true" : "false"}
      style={delay ? ({ "--kt-delay": `${delay}ms` } as React.CSSProperties) : undefined}
      className={[variant === "fade" ? "kt-reveal" : "", className].filter(Boolean).join(" ")}
    >
      {children}
    </Tag>
  );
}

/**
 * Крупный заголовок, который появляется построчно — каждая строка
 * выезжает из-под собственной маски.
 */
export function RevealLines({
  lines,
  className = "",
  lineClassName = "",
  as: Tag = "h2",
  step = 90,
  delay = 0,
  id,
}: {
  lines: readonly string[];
  className?: string;
  lineClassName?: string;
  as?: ElementType;
  step?: number;
  delay?: number;
  id?: string;
}) {
  const { ref, inView } = useInView<HTMLHeadingElement>();

  return (
    <Tag ref={ref} id={id} data-shown={inView ? "true" : "false"} className={className}>
      {lines.map((line, i) => (
        <span
          key={line + i}
          className={`kt-line-mask ${lineClassName}`}
          style={{ "--kt-delay": `${delay + i * step}ms` } as React.CSSProperties}
        >
          <span>{line}</span>
        </span>
      ))}
    </Tag>
  );
}
