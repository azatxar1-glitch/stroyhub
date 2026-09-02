import Link from "next/link";
import { company, isPlaceholder } from "@/data/kamtehnostroy";
import { Text } from "./frame";
import { Wordmark } from "./wordmark";

const FOOTER_NAV = company.nav.filter((item) => item.href !== "#advantages");

export function Footer() {
  const { contacts } = company;
  const year = new Date().getFullYear();

  return (
    <footer className="kt-dark border-t" style={{ borderColor: "var(--kt-line-dark)" }}>
      <div className="kt-container py-16 lg:py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-10">
          <div className="lg:col-span-5">
            <Wordmark />
            <p className="mt-4 text-sm" style={{ color: "var(--kt-on-dark-muted)" }}>
              {company.legalName}
            </p>
          </div>

          <nav aria-label="Навигация в подвале" className="lg:col-span-3">
            <p className="kt-eyebrow" style={{ color: "var(--kt-on-dark-faint)" }}>
              Разделы
            </p>
            <ul className="mt-5 space-y-2.5">
              {FOOTER_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={`/kamtehnostroy${item.href}`}
                    className="text-sm transition-colors duration-300 hover:text-[var(--kt-accent-on-dark)]"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-4">
            <p className="kt-eyebrow" style={{ color: "var(--kt-on-dark-faint)" }}>
              Контакты
            </p>
            <ul className="mt-5 space-y-2.5 text-sm">
              <li>
                {isPlaceholder(contacts.phone) ? (
                  <Text value={contacts.phone} dark />
                ) : (
                  <a
                    href={`tel:${contacts.phone.replace(/[^\d+]/g, "")}`}
                    className="transition-colors duration-300 hover:text-[var(--kt-accent-on-dark)]"
                  >
                    {contacts.phone}
                  </a>
                )}
              </li>
              <li>
                {isPlaceholder(contacts.email) ? (
                  <Text value={contacts.email} dark />
                ) : (
                  <a
                    href={`mailto:${contacts.email}`}
                    className="transition-colors duration-300 hover:text-[var(--kt-accent-on-dark)]"
                  >
                    {contacts.email}
                  </a>
                )}
              </li>
              <li style={{ color: "var(--kt-on-dark-muted)" }}>
                <Text value={contacts.address} dark />
              </li>
            </ul>
          </div>
        </div>

        <div
          className="mt-14 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: "var(--kt-line-dark)" }}
        >
          <p className="text-xs" style={{ color: "var(--kt-on-dark-faint)" }}>
            © {year} {company.legalName}
          </p>
          <Link
            href="/kamtehnostroy/privacy"
            className="text-xs transition-colors duration-300 hover:text-[var(--kt-accent-on-dark)]"
            style={{ color: "var(--kt-on-dark-faint)" }}
          >
            Политика конфиденциальности
          </Link>
        </div>
      </div>
    </footer>
  );
}
