"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { company } from "@/data/kamtehnostroy";
import { Wordmark } from "./wordmark";

/**
 * Липкая шапка. Над первым экраном она прозрачная и светлая — фотография
 * героя тёмная. После первого скролла подкладывается бумажный фон с blur,
 * шапка становится компактнее, а знак и навигация — графитовыми.
 */
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Пока открыто мобильное меню, страница под ним не прокручивается.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  /**
   * Прозрачная шапка допустима только там, где под ней тёмный первый экран:
   * на главной и на странице объекта. На светлых страницах (например,
   * политике конфиденциальности) она сразу непрозрачная, иначе светлый
   * знак и навигация оказались бы на бумажном фоне.
   */
  const darkTop = pathname === "/kamtehnostroy" || pathname.startsWith("/kamtehnostroy/objects/");
  const solid = (scrolled || !darkTop) && !open;

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500"
      style={{
        backgroundColor: solid ? "rgb(242 241 238 / 0.82)" : "transparent",
        backdropFilter: solid ? "blur(18px) saturate(140%)" : "none",
        WebkitBackdropFilter: solid ? "blur(18px) saturate(140%)" : "none",
        borderBottom: `1px solid ${solid ? "var(--kt-line)" : "transparent"}`,
        color: solid ? "var(--kt-text)" : "var(--kt-on-dark)",
      }}
    >
      <div className="kt-container">
        <div
          className="flex items-center justify-between transition-[padding] duration-500"
          style={{ paddingBlock: solid ? "0.875rem" : "1.5rem" }}
        >
          <Link
            href="/kamtehnostroy"
            className="shrink-0"
            onClick={() => setOpen(false)}
            aria-label={`${company.legalName} — наверх`}
          >
            <Wordmark />
          </Link>

          <nav aria-label="Основная навигация" className="hidden items-center gap-9 lg:flex">
            {company.nav.map((item) => (
              <Link
                key={item.href}
                href={`/kamtehnostroy${item.href}`}
                className="kt-navlink relative text-[0.8125rem] font-medium tracking-wide opacity-80 transition-opacity duration-300 hover:opacity-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/kamtehnostroy#contacts"
              className={`kt-btn hidden !py-3 !text-[0.8125rem] lg:inline-flex ${
                solid ? "kt-btn--solid" : "kt-btn--outline-dark"
              }`}
            >
              Обсудить проект
              <ArrowRight size={16} className="kt-btn__arrow" aria-hidden />
            </Link>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="kt-mobile-menu"
              aria-label={open ? "Закрыть меню" : "Открыть меню"}
              className="relative -mr-2 flex h-11 w-11 items-center justify-center lg:hidden"
              style={{ color: open ? "var(--kt-on-dark)" : "inherit" }}
            >
              <span className="relative block h-3 w-6" aria-hidden>
                <span
                  className="absolute left-0 block h-px w-full bg-current transition-transform duration-[400ms]"
                  style={{
                    top: open ? "50%" : "0",
                    transform: open ? "rotate(45deg)" : "none",
                    transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)",
                  }}
                />
                <span
                  className="absolute left-0 block h-px w-full bg-current transition-transform duration-[400ms]"
                  style={{
                    bottom: open ? "50%" : "0",
                    transform: open ? "rotate(-45deg)" : "none",
                    transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)",
                  }}
                />
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Мобильное меню — отдельный тёмный слой на весь экран. */}
      <div
        id="kt-mobile-menu"
        aria-hidden={!open}
        inert={!open}
        className="kt-dark kt-grid-dark fixed inset-0 top-0 -z-10 flex flex-col justify-between overflow-y-auto px-[var(--kt-gutter)] pb-12 pt-28 lg:hidden"
        style={{
          opacity: open ? 1 : 0,
          visibility: open ? "visible" : "hidden",
          transition:
            "opacity .45s cubic-bezier(.22,1,.36,1), visibility .45s cubic-bezier(.22,1,.36,1)",
        }}
      >
        <nav aria-label="Меню" className="flex flex-col">
          {company.nav.map((item, i) => (
            <Link
              key={item.href}
              href={`/kamtehnostroy${item.href}`}
              onClick={() => setOpen(false)}
              className="border-b py-5 text-[1.75rem] font-semibold tracking-tight"
              style={{
                borderColor: "var(--kt-line-dark)",
                opacity: open ? 1 : 0,
                transform: open ? "none" : "translateY(14px)",
                transition: `opacity .6s cubic-bezier(.22,1,.36,1) ${80 + i * 60}ms, transform .6s cubic-bezier(.22,1,.36,1) ${80 + i * 60}ms`,
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-10 space-y-6">
          <Link
            href="/kamtehnostroy#contacts"
            onClick={() => setOpen(false)}
            className="kt-btn kt-btn--light w-full"
          >
            Обсудить проект
            <ArrowRight size={16} className="kt-btn__arrow" aria-hidden />
          </Link>
          <p className="kt-eyebrow" style={{ color: "var(--kt-on-dark-faint)" }}>
            {company.legalName}
          </p>
        </div>
      </div>
    </header>
  );
}
