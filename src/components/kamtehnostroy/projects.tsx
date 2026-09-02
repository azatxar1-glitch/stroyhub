import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { projects, projectsNote, projectsTitle } from "@/data/kamtehnostroy";
import { Frame, Text } from "./frame";
import { Reveal, RevealLines } from "./reveal";

/**
 * Галерея объектов. Реальных проектов в данных нет — карточки показывают
 * структуру и placeholder-ы. Сетка асимметричная: первый объект крупнее,
 * дальше ритм чередуется.
 */
const SPANS = [
  "lg:col-span-7 aspect-[16/11]",
  "lg:col-span-5 aspect-[4/5]",
  "lg:col-span-4 aspect-[4/5]",
  "lg:col-span-4 aspect-[4/5]",
  "lg:col-span-4 aspect-[4/5]",
];

export function Projects() {
  return (
    <section id="projects" className="relative" aria-labelledby="projects-title">
      <div className="kt-container kt-section">
        {/* Заголовок занимает всю ширину: строки разбиты вручную в данных,
            и в узкой колонке они переносились бы ещё раз. Пояснение уходит
            под него и прижимается вправо. */}
        <RevealLines as="h2" id="projects-title" lines={projectsTitle} className="kt-display" />
        <Reveal delay={160} className="mt-8 max-w-[34ch] lg:ml-auto lg:mt-10">
          <p className="text-sm leading-relaxed" style={{ color: "var(--kt-muted)" }}>
            <Text value={projectsNote} />
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:mt-20 lg:grid-cols-12">
          {projects.map((project, i) => (
            <Reveal
              key={project.id}
              delay={(i % 3) * 90}
              className={`sm:col-span-1 ${SPANS[i % SPANS.length].split(" ")[0]}`}
            >
              <Link
                href={`/kamtehnostroy/objects/${project.id}`}
                className="kt-zoom group block"
                aria-label={`Объект: ${project.title}`}
              >
                <Frame
                  src={project.image}
                  alt={project.title}
                  label="[ДОБАВИТЬ ФОТО]"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 45vw"
                  className={`w-full ${SPANS[i % SPANS.length].split(" ")[1]}`}
                />

                <div
                  className="mt-5 flex items-start justify-between gap-4 border-t pt-4"
                  style={{ borderColor: "var(--kt-line)" }}
                >
                  <div className="min-w-0">
                    <div className="kt-eyebrow flex flex-wrap items-center gap-x-3 gap-y-1">
                      <Text value={project.location} className="text-[0.6875rem]" />
                      <span aria-hidden style={{ color: "var(--kt-line)" }}>
                        /
                      </span>
                      <Text value={project.category} className="text-[0.6875rem]" />
                      <span aria-hidden style={{ color: "var(--kt-line)" }}>
                        /
                      </span>
                      <Text value={project.year} className="kt-num text-[0.6875rem]" />
                    </div>
                    <h3 className="mt-2 text-lg font-semibold leading-snug tracking-tight sm:text-xl">
                      <Text value={project.title} />
                    </h3>
                    <p className="mt-2 text-[0.75rem] uppercase tracking-[0.14em]" style={{ color: "var(--kt-faint)" }}>
                      <Text value={project.status} />
                    </p>
                  </div>
                  <span
                    className="mt-1 shrink-0 transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1"
                    aria-hidden
                  >
                    <ArrowUpRight size={20} strokeWidth={1.5} />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
