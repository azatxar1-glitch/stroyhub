import Image from "next/image";
import { company } from "@/data/kamtehnostroy";

/**
 * Логотип компании.
 *
 * Официальной эмблемы пока нет, поэтому используется временный текстовый
 * wordmark. Как только в `company.brand.logotype` (или `emblem`) появится
 * путь к файлу из `/public/images/brand/`, здесь автоматически появится
 * изображение — новый логотип не рисуется и не выдумывается.
 *
 * Цвет знака наследуется от родителя (`currentColor`), поэтому шапка может
 * переключать его со светлого на тёмный при скролле.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  const { logotype, emblem } = company.brand;
  const source = logotype || emblem;

  if (source) {
    return (
      <span className={`relative block h-7 w-[13.5rem] ${className}`}>
        <Image
          src={source}
          alt={company.legalName}
          fill
          sizes="216px"
          priority
          className="object-contain object-left"
        />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`} aria-label={company.legalName}>
      <span
        aria-hidden
        className="block h-[1.15em] w-[3px] shrink-0"
        style={{ backgroundColor: "var(--kt-accent)" }}
      />
      <span
        className="text-[0.9375rem] font-extrabold uppercase leading-none text-current sm:text-base"
        style={{ letterSpacing: "0.01em" }}
      >
        {company.shortName}
      </span>
    </span>
  );
}
