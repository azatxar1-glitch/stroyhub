import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { company, isPlaceholder, projects } from "@/data/kamtehnostroy";
import { Frame, Text } from "@/components/kamtehnostroy/frame";
import { Parallax } from "@/components/kamtehnostroy/parallax";
import { Reveal, RevealLines } from "@/components/kamtehnostroy/reveal";

/** Страница отдельного объекта. Данные — из `data/kamtehnostroy/projects.ts`. */
type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return projects.map((project) => ({ id: project.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = projects.find((p) => p.id === id);
  if (!project) return {};

  const name = isPlaceholder(project.title) ? "Объект" : project.title;
  return {
    title: name,
    description: isPlaceholder(project.description)
      ? company.seo.description
      : project.description,
    alternates: { canonical: `/kamtehnostroy/objects/${project.id}` },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { id } = await params;
  const project = projects.find((p) => p.id === id);
  if (!project) notFound();

  const index = projects.indexOf(project);
  const next = projects[(index + 1) % projects.length];
  const meta = [
    { label: "Город", value: project.location },
    { label: "Тип объекта", value: project.category },
    { label: "Год", value: project.year },
    { label: "Статус", value: project.status },
  ];

  return (
    <article>
      <header className="kt-dark relative overflow-hidden">
        <div aria-hidden className="kt-grid-dark absolute inset-0 opacity-60" />

        <div className="kt-container relative pb-16 pt-36 sm:pt-40 lg:pb-20">
          <Link
            href="/kamtehnostroy#projects"
            className="kt-eyebrow inline-flex items-center gap-2 transition-colors duration-300 hover:text-[var(--kt-accent-on-dark)]"
          >
            <ArrowLeft size={14} aria-hidden />
            Все объекты
          </Link>

          <RevealLines
            as="h1"
            lines={[project.title]}
            className="kt-display-md mt-8"
          />

          <dl className="mt-12 grid grid-cols-1 gap-px border-t sm:grid-cols-2 lg:grid-cols-4">
            {meta.map((item, i) => (
              <Reveal key={item.label} delay={i * 70} className="border-b py-5 pr-6 lg:border-b-0">
                <dt className="kt-eyebrow" style={{ color: "var(--kt-on-dark-faint)" }}>
                  {item.label}
                </dt>
                <dd className="mt-2 text-base font-medium">
                  <Text value={item.value} dark />
                </dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </header>

      <Parallax className="kt-zoom aspect-[4/3] w-full sm:aspect-[16/9]">
        <Frame
          src={project.image}
          alt={project.title}
          label="[ДОБАВИТЬ ФОТО ОБЪЕКТА]"
          priority
          sizes="100vw"
          className="h-full w-full"
        />
      </Parallax>

      <div className="kt-container kt-section">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-7">
            <Reveal>
              <p className="kt-lead max-w-[60ch]">
                <Text value={project.description} />
              </p>
            </Reveal>
          </div>

          {project.details?.length ? (
            <dl className="lg:col-span-5">
              {project.details.map((item, i) => (
                <Reveal
                  key={item.label}
                  delay={i * 70}
                  className="flex items-baseline justify-between gap-6 border-b py-4"
                >
                  <dt className="kt-eyebrow">{item.label}</dt>
                  <dd className="text-sm font-medium">
                    <Text value={item.value} />
                  </dd>
                </Reveal>
              ))}
            </dl>
          ) : null}
        </div>

        {/* Дополнительные кадры объекта: заполните `gallery` в projects.ts. */}
        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:mt-24 lg:grid-cols-3">
          {(project.gallery.length ? project.gallery : ["", "", ""]).map((src, i) => (
            <Reveal key={i} delay={(i % 3) * 80} className="kt-zoom">
              <Frame
                src={src}
                alt=""
                label="[ДОБАВИТЬ ФОТО]"
                sizes="(max-width: 640px) 100vw, 33vw"
                className="aspect-[4/3] w-full"
              />
            </Reveal>
          ))}
        </div>

        <div
          className="mt-16 flex flex-col gap-6 border-t pt-8 sm:flex-row sm:items-center sm:justify-between lg:mt-24"
          style={{ borderColor: "var(--kt-line)" }}
        >
          <div>
            <p className="kt-eyebrow">Следующий объект</p>
            <p className="mt-2 text-xl font-semibold tracking-tight">
              <Text value={next.title} />
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={`/kamtehnostroy/objects/${next.id}`} className="kt-btn kt-btn--ghost">
              Смотреть
              <ArrowRight size={16} className="kt-btn__arrow" aria-hidden />
            </Link>
            <Link href="/kamtehnostroy#contacts" className="kt-btn kt-btn--solid">
              Обсудить проект
              <ArrowRight size={16} className="kt-btn__arrow" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
