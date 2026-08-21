import Link from "next/link";
import { Logo } from "@/components/logo";
import { CATEGORY_GROUPS } from "@/lib/category-groups";
import { CATEGORIES } from "@/lib/constants";

export function Footer() {
  const bySlug = new Map(CATEGORIES.map((c) => [c.slug, c]));
  const documentation = CATEGORY_GROUPS[0].slugs
    .map((s) => bySlug.get(s))
    .filter(Boolean)
    .slice(0, 5);

  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="container-page grid grid-cols-2 gap-8 py-12 lg:grid-cols-5 lg:gap-10">
        <div className="col-span-2 lg:col-span-2">
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            Специализированный маркетплейс строительной отрасли: документация, проектирование, работы на объекте
            и технический надзор — в одном месте.
          </p>
        </div>

        <FooterColumn title="Каталог">
          <FooterLink href="/executors">Все исполнители</FooterLink>
          <FooterLink href="/jobs">Лента заявок</FooterLink>
          <FooterLink href="/categories">Категории</FooterLink>
          <FooterLink href="/how-it-works">Как это работает</FooterLink>
        </FooterColumn>

        <FooterColumn title="Заказчикам">
          <FooterLink href="/jobs/new">Создать заявку</FooterLink>
          <FooterLink href="/executors">Найти специалиста</FooterLink>
          <FooterLink href="/register">Регистрация</FooterLink>
        </FooterColumn>

        <FooterColumn title="Направления">
          {documentation.map((c) => (
            <FooterLink key={c!.slug} href={`/executors?category=${c!.slug}`}>
              {c!.name}
            </FooterLink>
          ))}
        </FooterColumn>
      </div>

      <div className="border-t border-border">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted sm:flex-row">
          <span>© {new Date().getFullYear()} СтройХаб</span>
          <span>Строительные специалисты и услуги в одном месте</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-3.5 text-xs font-bold uppercase tracking-wider text-faint">{title}</h4>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      {/* -my-1/py-1 keeps the tap target comfortable without changing the visual rhythm. */}
      <Link
        href={href}
        className="-my-1 inline-block py-1 text-sm text-muted transition-colors hover:text-accent-text"
      >
        {children}
      </Link>
    </li>
  );
}
