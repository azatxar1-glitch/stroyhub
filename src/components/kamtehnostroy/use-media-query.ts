"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Подписка на медиа-запрос без setState в эффекте.
 *
 * На сервере всегда возвращается `false`: разметка не зависит от устройства,
 * а после гидратации React сам перерисует компонент с реальным значением.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/** Есть ли настоящий курсор — от этого зависят hover-сценарии. */
export function useCanHover(): boolean {
  return useMediaQuery("(hover: hover) and (pointer: fine)");
}

/** Пользователь просил уменьшить количество анимации. */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
