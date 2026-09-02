import { company } from "@/data/kamtehnostroy";
import { Frame, Text } from "./frame";
import { Parallax } from "./parallax";
import { Reveal, RevealLines } from "./reveal";

/**
 * Editorial-секция о компании: крупная двухчастная фраза, короткий текст
 * и высокий кадр с параллаксом. Текст компании пока не заполнен — стоят
 * явные placeholder-ы.
 */
export function About() {
  const { about } = company;

  return (
    <section id="about" className="relative" aria-labelledby="about-title">
      <div className="kt-container kt-section">
        <Reveal className="flex items-center gap-4" variant="none">
          <span className="kt-eyebrow">О компании</span>
          <span className="kt-line-grow h-px w-24" style={{ backgroundColor: "var(--kt-line)" }} />
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-12 lg:mt-14 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-7">
            {/* Кегль ниже общего kt-display-md: заголовок стоит в колонке
                7/12, и авторская разбивка строк должна сохраняться. */}
            <RevealLines
              as="h2"
              id="about-title"
              lines={about.titleTop}
              className="kt-display-md text-[clamp(2rem,4.2vw,3.375rem)]"
            />
            <RevealLines
              lines={about.titleBottom}
              as="p"
              className="kt-display-md mt-6 text-[clamp(2rem,4.2vw,3.375rem)] lg:mt-8"
              lineClassName="text-[var(--kt-faint)]"
              delay={120}
            />
          </div>

          <div className="lg:col-span-5 lg:pt-4">
            <div className="space-y-5">
              {about.body.map((paragraph, i) => (
                <Reveal key={i} delay={i * 100}>
                  <p className="kt-lead">
                    <Text value={paragraph} />
                  </p>
                </Reveal>
              ))}
            </div>

            <dl className="mt-10 border-t" style={{ borderColor: "var(--kt-line)" }}>
              {about.facts.map((fact, i) => (
                <Reveal
                  key={fact.label}
                  delay={i * 80}
                  className="flex items-baseline justify-between gap-6 border-b py-4"
                >
                  <dt className="kt-eyebrow">{fact.label}</dt>
                  <dd className="text-sm font-medium">
                    <Text value={fact.value} />
                  </dd>
                </Reveal>
              ))}
            </dl>
          </div>
        </div>

        {/* Кадр во всю ширину сетки — «разворот» под текстом. */}
        <Reveal className="mt-16 lg:mt-24" delay={100}>
          <Parallax className="kt-zoom aspect-[4/5] w-full sm:aspect-[16/10] lg:aspect-[16/7]">
            <Frame
              src={about.image}
              alt={about.imageAlt}
              label="[ДОБАВИТЬ ФОТО ОБЪЕКТА]"
              sizes="(max-width: 1440px) 100vw, 1440px"
              className="h-full w-full"
            />
          </Parallax>
        </Reveal>
      </div>
    </section>
  );
}
