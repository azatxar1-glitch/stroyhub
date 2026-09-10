import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin, Phone, FileText, ShieldCheck } from "lucide-react";
import { operator, hasOperatorDetails, SITE_NAME } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Контакты",
  description: "Как связаться со СтройХабом и реквизиты оператора персональных данных.",
  alternates: { canonical: "/contacts" },
};

export default function ContactsPage() {
  const filled = hasOperatorDetails();

  return (
    <div className="container-page max-w-3xl py-10 sm:py-14">
      <header className="border-b border-border pb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Контакты
        </h1>
        <p className="mt-3 text-muted">
          Вопросы по работе сервиса, обращения по персональным данным и претензии.
        </p>
      </header>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {operator.email && (
          <ContactCard icon={Mail} label="Электронная почта" value={operator.email} href={`mailto:${operator.email}`} />
        )}
        {operator.phone && (
          <ContactCard
            icon={Phone}
            label="Телефон"
            value={operator.phone}
            href={`tel:${operator.phone.replace(/[^\d+]/g, "")}`}
          />
        )}
        {operator.address && <ContactCard icon={MapPin} label="Адрес" value={operator.address} />}
      </div>

      {filled ? (
        <section className="mt-10">
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Оператор персональных данных
          </h2>
          <dl className="mt-4 space-y-2.5 rounded-2xl border border-border bg-card p-6">
            <Row label="Наименование" value={operator.legalName} />
            <Row label="ИНН" value={operator.inn} />
            {operator.ogrn && <Row label="ОГРН" value={operator.ogrn} />}
            <Row label="Адрес" value={operator.address} />
            <Row label="Email для обращений" value={operator.email} />
          </dl>
        </section>
      ) : (
        /* Реквизиты ещё не внесены. Показываем то, что верно и без них,
           вместо пустых полей или выдуманных данных. */
        <section className="mt-10 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Как с нами связаться
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            Написать нам можно через форму обратной связи в личном кабинете или ответом на любое
            письмо от сервиса. Обращения по персональным данным — удаление аккаунта, запрос
            хранимых сведений, отзыв согласия — обрабатываются в течение 30 дней.
          </p>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-bold tracking-tight text-foreground">Документы</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DocLink
            href="/privacy"
            icon={ShieldCheck}
            title="Политика конфиденциальности"
            caption="Какие данные собираем и как их удалить"
          />
          <DocLink
            href="/terms"
            icon={FileText}
            title="Пользовательское соглашение"
            caption="Правила сервиса и роли сторон"
          />
        </div>
      </section>

      <p className="mt-10 border-t border-border pt-8 text-sm text-muted">
        {SITE_NAME} — площадка для поиска специалистов строительной отрасли. Сервис не является
        стороной сделки между заказчиком и исполнителем.
      </p>
    </div>
  );
}

function ContactCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-muted">
        <Icon size={18} />
      </span>
      <span className="min-w-0">
        <span className="block text-xs text-muted">{label}</span>
        <span className="mt-0.5 block truncate font-semibold text-foreground">{value}</span>
      </span>
    </>
  );

  const className = "flex items-center gap-3.5 rounded-2xl border border-border bg-card p-5";

  return href ? (
    <a href={href} className={`${className} transition-colors hover:border-border-strong`}>
      {content}
    </a>
  ) : (
    <div className={className}>{content}</div>
  );
}

function DocLink({
  href,
  icon: Icon,
  title,
  caption,
}: {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  caption: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3.5 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-border-strong"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-muted">
        <Icon size={18} />
      </span>
      <span>
        <span className="block font-semibold text-foreground">{title}</span>
        <span className="mt-0.5 block text-sm text-muted">{caption}</span>
      </span>
    </Link>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap gap-x-3 text-[15px]">
      <dt className="min-w-44 text-muted">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
