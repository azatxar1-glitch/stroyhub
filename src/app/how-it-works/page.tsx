import type { Metadata } from "next";
import { ArrowRight, BadgeCheck, ShieldCheck, Star, Search, Briefcase } from "lucide-react";
import { ProcessSteps } from "@/components/process-steps";
import { LinkButton } from "@/components/ui/link-button";

export const metadata: Metadata = {
  title: "Как это работает",
  description:
    "Как устроен СтройХаб: заказчик размещает заявку, специалисты откликаются с ценой и сроком, стороны договариваются в чате и закрывают заказ отзывом.",
};

const CUSTOMER_STEPS = [
  "Опишите задачу в заявке: категория, объект, срок и бюджет.",
  "Получите отклики с конкретной ценой и сроком выполнения.",
  "Сравните профили, рейтинг и портфолио, уточните детали в чате.",
  "Выберите исполнителя — создаётся заказ со статусами и историей.",
  "Примите работу и оставьте отзыв.",
];

const EXECUTOR_STEPS = [
  "Заполните профиль: специализация, опыт, навыки и стоимость.",
  "Добавьте портфолио — примеры работ сильно влияют на выбор.",
  "Следите за лентой заявок по своему направлению.",
  "Откликайтесь со своей ценой и сроком выполнения.",
  "Выполняйте заказ и получайте отзывы, повышая рейтинг.",
];

export default function HowItWorksPage() {
  return (
    <div className="pb-4">
      <section className="border-b border-border bg-card py-12 sm:py-16">
        <div className="container-page max-w-3xl text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Как работает СтройХаб
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
            Площадка ведёт задачу от публикации до отзыва: отклики, переписка и статусы заказа хранятся в одном
            месте, а не в разрозненных чатах и таблицах.
          </p>
        </div>
      </section>

      <section className="container-page py-12 sm:py-16">
        <ProcessSteps />
      </section>

      <section className="border-y border-border bg-card py-12 sm:py-16">
        <div className="container-page grid grid-cols-1 gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-accent-border bg-accent-soft p-7">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Search size={22} aria-hidden />
            </span>
            <h2 className="mt-5 text-xl font-bold text-foreground">Если вы заказчик</h2>
            <ol className="mt-5 space-y-3.5">
              {CUSTOMER_STEPS.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm leading-relaxed text-foreground">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-accent text-xs font-bold text-accent-foreground">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <LinkButton href="/jobs/new" size="lg" className="mt-7 w-full gap-2 sm:w-auto">
              Создать заявку
              <ArrowRight size={18} aria-hidden />
            </LinkButton>
          </article>

          <article className="relative overflow-hidden rounded-2xl border border-border bg-primary p-7 text-white">
            <div className="blueprint-grid pointer-events-none absolute inset-0" aria-hidden />
            <div className="relative">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                <Briefcase size={22} aria-hidden />
              </span>
              <h2 className="mt-5 text-xl font-bold">Если вы исполнитель</h2>
              <ol className="mt-5 space-y-3.5">
                {EXECUTOR_STEPS.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed text-white/85">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/15 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
              <LinkButton href="/jobs" variant="onDark" size="lg" className="mt-7 w-full gap-2 sm:w-auto">
                Смотреть заявки
                <ArrowRight size={18} aria-hidden />
              </LinkButton>
            </div>
          </article>
        </div>
      </section>

      <section className="container-page py-12 sm:py-16">
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Как мы поддерживаем доверие</h2>
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {[
            {
              icon: BadgeCheck,
              title: "Статус «Проверенный»",
              text: "Присваивается автоматически: минимум один завершённый заказ и средний рейтинг 4.5+ по реальным отзывам.",
            },
            {
              icon: Star,
              title: "Отзывы только после заказа",
              text: "Оставить отзыв может лишь участник завершённого заказа — по одному от каждой стороны.",
            },
            {
              icon: ShieldCheck,
              title: "История в одном месте",
              text: "Отклики, переписка и смена статусов фиксируются на площадке и доступны обеим сторонам.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-border bg-card p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface text-foreground">
                <item.icon size={20} aria-hidden />
              </span>
              <h3 className="mt-4 text-base font-bold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
