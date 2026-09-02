import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { company } from "@/data/kamtehnostroy";
import { Text } from "@/components/kamtehnostroy/frame";

export const metadata: Metadata = {
  title: "Политика конфиденциальности",
  description: `Политика обработки персональных данных ${company.legalName}.`,
  robots: { index: false, follow: true },
  alternates: { canonical: "/kamtehnostroy/privacy" },
};

/**
 * Заготовка политики конфиденциальности.
 *
 * Юридический текст не выдуман: разделы обозначены, содержимое отмечено
 * как незаполненное. Замените placeholder-ы на документ, согласованный
 * с юристом, — структура страницы менять не потребуется.
 */
const SECTIONS = [
  { title: "1. Общие положения", body: "[ДОБАВИТЬ ТЕКСТ РАЗДЕЛА]" },
  { title: "2. Какие данные обрабатываются", body: "[ДОБАВИТЬ ТЕКСТ РАЗДЕЛА]" },
  { title: "3. Цели обработки", body: "[ДОБАВИТЬ ТЕКСТ РАЗДЕЛА]" },
  { title: "4. Правовые основания", body: "[ДОБАВИТЬ ТЕКСТ РАЗДЕЛА]" },
  { title: "5. Сроки хранения и передача третьим лицам", body: "[ДОБАВИТЬ ТЕКСТ РАЗДЕЛА]" },
  { title: "6. Права субъекта персональных данных", body: "[ДОБАВИТЬ ТЕКСТ РАЗДЕЛА]" },
  { title: "7. Контакты для обращений", body: "[ДОБАВИТЬ ТЕКСТ РАЗДЕЛА]" },
];

export default function PrivacyPage() {
  return (
    <article className="kt-container pb-24 pt-36 sm:pt-44">
      <Link
        href="/kamtehnostroy"
        className="kt-eyebrow inline-flex items-center gap-2 transition-colors duration-300 hover:text-[var(--kt-accent-text)]"
      >
        <ArrowLeft size={14} aria-hidden />
        На главную
      </Link>

      <h1 className="kt-display-sm mt-8 max-w-[18ch]">Политика конфиденциальности</h1>
      <p className="kt-lead mt-6 max-w-[60ch]">{company.legalName}</p>

      <div className="mt-14 max-w-[70ch] border-t" style={{ borderColor: "var(--kt-line)" }}>
        {SECTIONS.map((section) => (
          <section key={section.title} className="border-b py-8">
            <h2 className="text-lg font-semibold tracking-tight">{section.title}</h2>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--kt-muted)" }}>
              <Text value={section.body} />
            </p>
          </section>
        ))}
      </div>
    </article>
  );
}
