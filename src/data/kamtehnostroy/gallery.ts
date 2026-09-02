/**
 * Фотогалерея. Положите файлы в `/public/images/gallery/` и укажите путь
 * в поле `src`. Пока `src` пуст — показывается оформленный placeholder.
 *
 * `span` управляет размером плитки в masonry-сетке:
 *   "tall" — вытянутая вертикально, "wide" — на две колонки, иначе обычная.
 */
export type GalleryCategory =
  | "Строительство"
  | "Архитектура"
  | "Процесс"
  | "Детали"
  | "Готовые объекты";

export const galleryCategories: GalleryCategory[] = [
  "Строительство",
  "Архитектура",
  "Процесс",
  "Детали",
  "Готовые объекты",
];

export type GalleryItem = {
  id: string;
  category: GalleryCategory;
  src: string;
  alt: string;
  span?: "tall" | "wide";
};

export const gallery: GalleryItem[] = [
  { id: "g01", category: "Строительство", src: "", alt: "[ДОБАВИТЬ ФОТО]", span: "tall" },
  { id: "g02", category: "Архитектура", src: "", alt: "[ДОБАВИТЬ ФОТО]" },
  { id: "g03", category: "Процесс", src: "", alt: "[ДОБАВИТЬ ФОТО]" },
  { id: "g04", category: "Детали", src: "", alt: "[ДОБАВИТЬ ФОТО]", span: "wide" },
  { id: "g05", category: "Готовые объекты", src: "", alt: "[ДОБАВИТЬ ФОТО]", span: "tall" },
  { id: "g06", category: "Строительство", src: "", alt: "[ДОБАВИТЬ ФОТО]" },
  { id: "g07", category: "Архитектура", src: "", alt: "[ДОБАВИТЬ ФОТО]" },
  { id: "g08", category: "Процесс", src: "", alt: "[ДОБАВИТЬ ФОТО]" },
  { id: "g09", category: "Детали", src: "", alt: "[ДОБАВИТЬ ФОТО]" },
];
