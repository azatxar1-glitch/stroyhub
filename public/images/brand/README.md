Логотип и фирменный стиль ООО «КАМТЕХНОСТРОЙ».

Положите сюда файлы (лучше всего SVG или PNG с прозрачным фоном):
  logo.svg    — полный логотип из шапки письма
  emblem.svg  — эмблема

И укажите пути в `src/data/kamtehnostroy/company.ts` → `brand`:
  brand: { logotype: "/images/brand/logo.svg", emblem: "/images/brand/emblem.svg" }

Пока пути пустые, в шапке и подвале используется временный текстовый
wordmark «КАМТЕХНОСТРОЙ». Новый логотип не придумывается.

Фирменные цвета после загрузки логотипа меняются в одном месте —
`src/app/kamtehnostroy/kt.css`, переменные `--kt-accent`,
`--kt-accent-text`, `--kt-accent-on-dark`.

Промпты для генерации — `docs/kamtehnostroy-images.md`.
