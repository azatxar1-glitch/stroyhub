import { company } from "@/data/kamtehnostroy";
import { Frame, Text } from "./frame";
import { Parallax } from "./parallax";
import { Reveal, RevealLines } from "./reveal";

/** Крупная фраза о компании поверх кадра объекта. */
export function Statement() {
  const { statement } = company;

  return (
    <section className="kt-dark relative overflow-hidden" aria-labelledby="statement-title">
      <Parallax className="absolute inset-0" amount={9}>
        <Frame
          src={statement.image}
          alt={statement.imageAlt}
          label="[ДОБАВИТЬ ФОТО ОБЪЕКТА]"
          dark
          sizes="100vw"
          className="h-full w-full"
        />
      </Parallax>

      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgb(11 12 14 / .88) 0%, rgb(11 12 14 / .70) 50%, rgb(11 12 14 / .90) 100%)",
        }}
      />

      <div className="kt-container kt-section relative">
        <RevealLines
          as="h2"
          id="statement-title"
          lines={statement.title}
          className="kt-display kt-display--fit"
        />
        <Reveal delay={180} className="mt-10 max-w-[54ch]">
          <p className="text-[0.9375rem] leading-relaxed sm:text-base" style={{ color: "var(--kt-on-dark-muted)" }}>
            <Text value={statement.body} dark />
          </p>
        </Reveal>
      </div>
    </section>
  );
}
