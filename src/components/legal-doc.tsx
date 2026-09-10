import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Общая раскладка правовых документов: политики и оферты. Вынесена, чтобы
 * оба документа выглядели одинаково и правились в одном месте.
 */
export function LegalDoc({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="container-page max-w-3xl py-10 sm:py-14">
      <header className="border-b border-border pb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        <p className="mt-3 text-muted">{intro}</p>
      </header>

      <div className="mt-10 space-y-10">{children}</div>

      <footer className="mt-12 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-8 text-sm">
        <Link href="/" className="font-semibold text-accent-text hover:underline">
          ← На главную
        </Link>
        <Link href="/privacy" className="text-muted hover:text-foreground">
          Политика конфиденциальности
        </Link>
        <Link href="/terms" className="text-muted hover:text-foreground">
          Пользовательское соглашение
        </Link>
        <Link href="/contacts" className="text-muted hover:text-foreground">
          Контакты
        </Link>
      </footer>
    </div>
  );
}

export function LegalSection({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="flex gap-3 text-lg font-bold tracking-tight text-foreground">
        <span className="text-muted tabular-nums">{n}.</span>
        {title}
      </h2>
      <div className="mt-3 space-y-3 pl-0 sm:pl-8">{children}</div>
    </section>
  );
}

export function LegalP({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-[15px] leading-relaxed text-muted", className)}>{children}</p>;
}

export function LegalList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-muted">
          <span aria-hidden className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-border-strong" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
