import { company } from "@/data/kamtehnostroy";
import { Text } from "./frame";
import { Reveal, RevealLines } from "./reveal";

/**
 * Тёмная секция о предсказуемости строительства.
 *
 * Визуальный слой — чертёжная графика: сетка, оси, разрезы, отметки.
 * Всё нарисовано в SVG, без изображений и внешних библиотек. Никаких
 * утверждений о конкретных технологиях компании здесь нет.
 */
export function Technology() {
  const { technology } = company;

  return (
    <section className="kt-dark relative overflow-hidden" aria-labelledby="technology-title">
      <div aria-hidden className="kt-grid-dark absolute inset-0" />
      <BlueprintArt />

      <div className="kt-container kt-section relative">
        {/* Заголовок во всю ширину: строки разбиты вручную, и в колонке
            7/12 слово «СТРОИТЕЛЬСТВО» не помещалось бы в строку. */}
        <RevealLines
          as="h2"
          id="technology-title"
          lines={technology.title}
          className="kt-display"
        />

        <Reveal delay={120} className="mt-10 lg:mt-14 lg:pl-[52%]">
          <ul className="space-y-1.5">
            {technology.subtitle.map((line) => (
              <li
                key={line}
                className="text-lg font-medium tracking-tight sm:text-xl"
                style={{ color: "var(--kt-on-dark)" }}
              >
                {line}
              </li>
            ))}
          </ul>
        </Reveal>

        <div
          className="mt-20 grid grid-cols-1 gap-px border-t sm:grid-cols-2 lg:mt-28 lg:grid-cols-4"
          style={{ borderColor: "var(--kt-line-dark)" }}
        >
          {technology.points.map((point, i) => (
            <Reveal key={point.title} delay={i * 90} className="py-8 pr-6">
              <span
                className="kt-num text-xs font-semibold tracking-[0.16em]"
                style={{ color: "var(--kt-accent-on-dark)" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 text-base font-semibold tracking-tight">{point.title}</h3>
              <p
                className="mt-2 text-sm leading-relaxed"
                style={{ color: "var(--kt-on-dark-muted)" }}
              >
                <Text value={point.text} dark />
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Чертёжная графика на фоне секции: план, оси и размерные линии. */
function BlueprintArt() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute -right-24 top-1/2 hidden h-[42rem] w-[42rem] -translate-y-1/2 opacity-[0.28] lg:block"
      viewBox="0 0 600 600"
      fill="none"
      stroke="currentColor"
      style={{ color: "var(--kt-on-dark)" }}
    >
      <g strokeWidth="0.75" opacity="0.5">
        <circle cx="300" cy="300" r="250" />
        <circle cx="300" cy="300" r="180" />
        <circle cx="300" cy="300" r="110" />
        <path d="M300 20V580M20 300H580" />
        <path d="M123 123L477 477M477 123L123 477" opacity="0.5" />
      </g>

      {/* Условный план: контур, ядро, сетка колонн */}
      <g strokeWidth="1.25">
        <rect x="180" y="180" width="240" height="240" />
        <rect x="255" y="255" width="90" height="90" opacity="0.7" />
        <path d="M180 240H420M180 300H420M180 360H420" opacity="0.35" />
        <path d="M240 180V420M300 180V420M360 180V420" opacity="0.35" />
      </g>

      {/* Размерные линии с засечками */}
      <g strokeWidth="0.75" opacity="0.75">
        <path d="M180 140H420" />
        <path d="M180 132V148M420 132V148M300 132V148" />
        <path d="M140 180V420" />
        <path d="M132 180H148M132 420H148" />
      </g>

      <g strokeWidth="0.75" opacity="0.6">
        <circle cx="180" cy="180" r="5" />
        <circle cx="420" cy="180" r="5" />
        <circle cx="180" cy="420" r="5" />
        <circle cx="420" cy="420" r="5" />
      </g>
    </svg>
  );
}
