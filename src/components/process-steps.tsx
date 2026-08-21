import { BadgeCheck, MessagesSquare, Star, FileSignature } from "lucide-react";

const STEPS = [
  {
    n: "01",
    icon: FileSignature,
    title: "Опишите задачу",
    text: "Категория, объект, сроки и бюджет — форма занимает пару минут.",
  },
  {
    n: "02",
    icon: MessagesSquare,
    title: "Получите отклики",
    text: "Исполнители предлагают свою цену и срок выполнения.",
  },
  {
    n: "03",
    icon: BadgeCheck,
    title: "Выберите специалиста",
    text: "Сравните рейтинг, опыт и портфолио, обсудите детали в чате.",
  },
  {
    n: "04",
    icon: Star,
    title: "Получите результат",
    text: "Отслеживайте статус заказа и оставьте отзыв по завершении.",
  },
];

export function ProcessSteps() {
  return (
    <ol className="relative grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {/* One continuous rule behind the row ties the four steps into a process. */}
      <span className="absolute left-0 right-0 top-[3.25rem] hidden h-px bg-border lg:block" aria-hidden />

      {STEPS.map((step) => (
        <li key={step.n} className="relative">
          <div className="h-full rounded-2xl border border-border bg-background p-6">
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white">
                <step.icon size={19} aria-hidden />
              </span>
              <span className="text-2xl font-extrabold tabular-nums text-muted">{step.n}</span>
            </div>
            <h3 className="mt-4 text-base font-bold text-foreground">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
