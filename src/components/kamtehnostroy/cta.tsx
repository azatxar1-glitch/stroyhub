import { company, isPlaceholder } from "@/data/kamtehnostroy";
import { ContactForm } from "./contact-form";
import { Text } from "./frame";
import { Reveal, RevealLines } from "./reveal";

/**
 * Финальный экран: крупный призыв, контакты и форма заявки.
 * Телефон, e-mail и адрес пока не заполнены — как только в `company.contacts`
 * появятся реальные значения, здесь автоматически появятся рабочие ссылки
 * `tel:` и `mailto:`.
 */
export function Cta() {
  const { contacts, cta } = company;

  return (
    <section id="contacts" className="kt-dark relative overflow-hidden" aria-labelledby="cta-title">
      <div aria-hidden className="kt-grid-dark absolute inset-0 opacity-70" />

      <div className="kt-container kt-section relative">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-x-16">
          <div>
            <Reveal>
              <p
                className="kt-display-sm uppercase"
                style={{ color: "var(--kt-accent-on-dark)" }}
              >
                {cta.kicker}
              </p>
            </Reveal>

            <RevealLines
              as="h2"
              id="cta-title"
              lines={cta.title}
              /* Половина ширины экрана — кегль ниже общего kt-display,
                 иначе авторская разбивка строк ломается. */
              className="kt-display mt-4 text-[clamp(1.875rem,4.9vw,4rem)]"
              delay={80}
            />

            <Reveal delay={200} className="mt-8 max-w-[40ch]">
              <p className="text-[0.9375rem] leading-relaxed sm:text-base" style={{ color: "var(--kt-on-dark-muted)" }}>
                {cta.subtitle}
              </p>
            </Reveal>

            <dl className="mt-14 border-t" style={{ borderColor: "var(--kt-line-dark)" }}>
              <ContactRow label="Телефон" value={contacts.phone} href={`tel:${contacts.phone.replace(/[^\d+]/g, "")}`} />
              <ContactRow label="E-mail" value={contacts.email} href={`mailto:${contacts.email}`} />
              <ContactRow label="Адрес" value={contacts.address} />
              {contacts.hours ? <ContactRow label="Время работы" value={contacts.hours} /> : null}
            </dl>
          </div>

          <Reveal delay={120} className="lg:pt-4">
            <ContactForm />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function ContactRow({ label, value, href }: { label: string; value: string; href?: string }) {
  const usable = href && !isPlaceholder(value);

  return (
    <Reveal className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b py-5">
      <dt className="kt-eyebrow" style={{ color: "var(--kt-on-dark-faint)" }}>
        {label}
      </dt>
      <dd className="text-base font-medium sm:text-lg">
        {usable ? (
          <a href={href} className="transition-colors duration-300 hover:text-[var(--kt-accent-on-dark)]">
            {value}
          </a>
        ) : (
          <Text value={value} dark />
        )}
      </dd>
    </Reveal>
  );
}
