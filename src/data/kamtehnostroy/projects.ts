/**
 * Объекты. Реальные проекты не выдуманы — это пустая структура-шаблон.
 * Заполните поля и положите фотографии в `/public/images/projects/`.
 */
export type Project = {
  id: string;
  title: string;
  location: string;
  year: string;
  category: string;
  status: string;
  description: string;
  /** Обложка, например `/images/projects/obj-01/cover.jpg` */
  image: string;
  /** Дополнительные кадры объекта. */
  gallery: string[];
  /** Показывать в блоке PROJECT / 01 как развёрнутый case study. */
  featured?: boolean;
  /** Карточка case study. */
  details?: { label: string; value: string }[];
};

export const projectsTitle = ["ОБЪЕКТЫ,", "КОТОРЫМИ МЫ", "ГОРДИМСЯ"];

export const projectsNote = "[ДОБАВИТЬ КРАТКОЕ ОПИСАНИЕ РАЗДЕЛА ОБЪЕКТОВ]";

export const projects: Project[] = [
  {
    id: "project-01",
    title: "[НАЗВАНИЕ ОБЪЕКТА]",
    location: "[ГОРОД]",
    year: "[ГОД]",
    category: "[ТИП ОБЪЕКТА]",
    status: "[СТАТУС]",
    description: "[ДОБАВИТЬ ОПИСАНИЕ ОБЪЕКТА]",
    image: "",
    gallery: [],
    featured: true,
    details: [
      { label: "Заказчик", value: "[ДАННЫЕ]" },
      { label: "Площадь", value: "[ДАННЫЕ]" },
      { label: "Срок", value: "[ДАННЫЕ]" },
      { label: "Год", value: "[ДАННЫЕ]" },
      { label: "Тип", value: "[ДАННЫЕ]" },
    ],
  },
  {
    id: "project-02",
    title: "[НАЗВАНИЕ ОБЪЕКТА]",
    location: "[ГОРОД]",
    year: "[ГОД]",
    category: "[ТИП ОБЪЕКТА]",
    status: "[СТАТУС]",
    description: "[ДОБАВИТЬ ОПИСАНИЕ ОБЪЕКТА]",
    image: "",
    gallery: [],
  },
  {
    id: "project-03",
    title: "[НАЗВАНИЕ ОБЪЕКТА]",
    location: "[ГОРОД]",
    year: "[ГОД]",
    category: "[ТИП ОБЪЕКТА]",
    status: "[СТАТУС]",
    description: "[ДОБАВИТЬ ОПИСАНИЕ ОБЪЕКТА]",
    image: "",
    gallery: [],
  },
  {
    id: "project-04",
    title: "[НАЗВАНИЕ ОБЪЕКТА]",
    location: "[ГОРОД]",
    year: "[ГОД]",
    category: "[ТИП ОБЪЕКТА]",
    status: "[СТАТУС]",
    description: "[ДОБАВИТЬ ОПИСАНИЕ ОБЪЕКТА]",
    image: "",
    gallery: [],
  },
  {
    id: "project-05",
    title: "[НАЗВАНИЕ ОБЪЕКТА]",
    location: "[ГОРОД]",
    year: "[ГОД]",
    category: "[ТИП ОБЪЕКТА]",
    status: "[СТАТУС]",
    description: "[ДОБАВИТЬ ОПИСАНИЕ ОБЪЕКТА]",
    image: "",
    gallery: [],
  },
];

export const featuredProject = projects.find((p) => p.featured) ?? projects[0];
