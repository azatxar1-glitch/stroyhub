import type { CSSProperties } from "react";

/**
 * Инлайновые стили, в которых можно свободно объявлять CSS-переменные
 * (`--kt-delay`, `--kt-progress` и т.д.). React-типы их не знают, поэтому
 * приведение типа сделано здесь один раз, а не в каждом компоненте.
 */
export function sx(styles: Record<string, string | number | undefined>): CSSProperties {
  return styles as CSSProperties;
}
