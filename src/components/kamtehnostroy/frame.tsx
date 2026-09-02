import Image from "next/image";
import { isPlaceholder } from "@/data/kamtehnostroy";

/**
 * Единственная точка, через которую на сайт попадают изображения.
 *
 * Пока `src` пуст — рисуется оформленный чертёжный placeholder с подписью.
 * Как только в данных появляется путь (например `/images/projects/obj-01.jpg`),
 * тот же компонент отдаёт оптимизированный `next/image`. Менять разметку
 * секций при загрузке реальных фотографий не нужно.
 */
export function Frame({
  src,
  alt,
  label = "[ДОБАВИТЬ ФОТО]",
  dark = false,
  className = "",
  imageClassName = "",
  sizes = "100vw",
  priority = false,
  children,
}: {
  src?: string;
  alt?: string;
  /** Подпись внутри placeholder-а. */
  label?: string;
  dark?: boolean;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
  children?: React.ReactNode;
}) {
  const hasImage = Boolean(src && src.trim());

  return (
    <div className={`kt-frame ${className}`}>
      {hasImage ? (
        <Image
          src={src as string}
          alt={alt && !isPlaceholder(alt) ? alt : ""}
          fill
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : "lazy"}
          className={imageClassName}
        />
      ) : (
        <div
          className={`kt-placeholder ${dark ? "kt-placeholder--dark" : ""}`}
          role="img"
          aria-label={`Место для фотографии: ${label.replace(/[[\]]/g, "").toLowerCase()}`}
        >
          <span
            className={`kt-eyebrow px-3 text-center ${dark ? "text-[var(--kt-on-dark-faint)]" : ""}`}
          >
            {label}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * Текст из данных. Если это placeholder вида `[ДОБАВИТЬ ...]`, он рисуется
 * пунктирной «заплаткой» — сразу видно, что осталось заполнить.
 */
export function Text({
  value,
  className = "",
  dark = false,
}: {
  value: string;
  className?: string;
  dark?: boolean;
}) {
  if (isPlaceholder(value)) {
    return <span className={`kt-todo ${dark ? "kt-todo--dark" : ""} ${className}`}>{value}</span>;
  }
  return <span className={className}>{value}</span>;
}
