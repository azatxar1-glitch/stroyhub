import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { featuredProject } from "@/data/kamtehnostroy";
import { Frame, Text } from "./frame";
import { Parallax } from "./parallax";
import { Reveal, RevealLines } from "./reveal";

/**
 * Развёрнутая карточка одного объекта. Проект берётся из `projects.ts`
 * (тот, у которого `featured: true`). Все значения — placeholder-ы,
 * пока нет реальных данных.
 */
export function CaseStudy() {
  const project = featuredProject;
  if (!project) return null;

  const details = project.details ?? [];

  return (
    <section className="kt-dark relative overflow-hidden" aria-labelledby="case-title">
      <div aria-hidden className="kt-grid-dark absolute inset-0 opacity-60" />

      <div className="kt-container kt-section relative">
        <Reveal className="flex items-center gap-4">
          <span className="kt-eyebrow kt-num" style={{ color: "var(--kt-accent-on-dark)" }}>
            PROJECT / 01
          </span>
          <span
            className="kt-line-grow h-px flex-1"
            style={{ backgroundColor: "var(--kt-line-dark)" }}
          />
        </Reveal>

        <Reveal className="mt-10" delay={80}>
          <Parallax className="kt-zoom aspect-[4/3] w-full sm:aspect-[16/9]">
            <Frame
              src={project.image}
              alt={project.title}
              label="[ДОБАВИТЬ ФОТО ОБЪЕКТА]"
              dark
              sizes="(max-width: 1440px) 100vw, 1440px"
              className="h-full w-full"
            />
          </Parallax>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-6">
            <RevealLines
              as="h2"
              id="case-title"
              lines={[project.title]}
              className="kt-display-sm uppercase"
            />
            <Reveal delay={120} className="mt-6 max-w-[46ch]">
              <p className="text-[0.9375rem] leading-relaxed" style={{ color: "var(--kt-on-dark-muted)" }}>
                <Text value={project.description} dark />
              </p>
            </Reveal>
            <Reveal delay={200} className="mt-8">
              <Link href={`/kamtehnostroy/objects/${project.id}`} className="kt-btn kt-btn--light">
                Подробнее
                <ArrowRight size={16} className="kt-btn__arrow" aria-hidden />
              </Link>
            </Reveal>
          </div>

          <dl className="lg:col-span-6 lg:pt-2">
            {details.map((item, i) => (
              <Reveal
                key={item.label}
                delay={i * 70}
                className="flex items-baseline justify-between gap-6 border-b py-4"
              >
                <dt className="kt-eyebrow" style={{ color: "var(--kt-on-dark-faint)" }}>
                  {item.label}
                </dt>
                <dd className="text-sm font-medium">
                  <Text value={item.value} dark />
                </dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
