"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Раздел с собственной оболочкой — шапка и подвал маркетплейса там не нужны. */
const STANDALONE_PREFIXES = ["/kamtehnostroy"];

function isStandalone(pathname: string | null) {
  return Boolean(pathname && STANDALONE_PREFIXES.some((prefix) => pathname.startsWith(prefix)));
}

/**
 * Скрывает навбар, футер и таб-бар СтройХаба на страницах, у которых есть
 * собственная оболочка (корпоративный сайт КАМТЕХНОСТРОЙ). Сами компоненты
 * приходят как children и остаются серверными.
 */
export function SiteChrome({ children }: { children: ReactNode }) {
  if (isStandalone(usePathname())) return null;
  return <>{children}</>;
}

/**
 * `<main>` страницы. У маркетплейса снизу фиксированный таб-бар, под который
 * нужен отступ; у отдельных разделов его нет.
 */
export function SiteMain({ children }: { children: ReactNode }) {
  const standalone = isStandalone(usePathname());
  return (
    <main id="main" className={standalone ? "flex-1" : "flex-1 pb-safe-tabbar"}>
      {children}
    </main>
  );
}
