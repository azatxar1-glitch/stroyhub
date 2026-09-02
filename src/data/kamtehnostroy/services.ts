/**
 * Услуги — пример структуры, а не подтверждённый перечень услуг
 * ООО «КАМТЕХНОСТРОЙ». Замените список на реальный.
 */
export type Service = {
  id: string;
  number: string;
  title: string;
  /** Короткое пояснение, раскрывается при наведении. */
  summary: string;
  /** Что входит — 3–5 пунктов. */
  items: string[];
  /** Например `/images/gallery/services-01.jpg`. Пусто → placeholder. */
  image: string;
};

export const servicesTitle = ["ЧТО МЫ ДЕЛАЕМ"];

export const servicesNote = "[ДОБАВИТЬ КРАТКОЕ ОПИСАНИЕ РАЗДЕЛА УСЛУГ]";

export const services: Service[] = [
  {
    id: "general-construction",
    number: "01",
    title: "Общестроительные работы",
    summary: "[ДОБАВИТЬ ОПИСАНИЕ УСЛУГИ]",
    items: ["[ПУНКТ]", "[ПУНКТ]", "[ПУНКТ]"],
    image: "",
  },
  {
    id: "monolithic",
    number: "02",
    title: "Монолитные работы",
    summary: "[ДОБАВИТЬ ОПИСАНИЕ УСЛУГИ]",
    items: ["[ПУНКТ]", "[ПУНКТ]", "[ПУНКТ]"],
    image: "",
  },
  {
    id: "installation",
    number: "03",
    title: "Строительно-монтажные работы",
    summary: "[ДОБАВИТЬ ОПИСАНИЕ УСЛУГИ]",
    items: ["[ПУНКТ]", "[ПУНКТ]", "[ПУНКТ]"],
    image: "",
  },
  {
    id: "finishing",
    number: "04",
    title: "Отделочные работы",
    summary: "[ДОБАВИТЬ ОПИСАНИЕ УСЛУГИ]",
    items: ["[ПУНКТ]", "[ПУНКТ]", "[ПУНКТ]"],
    image: "",
  },
  {
    id: "engineering",
    number: "05",
    title: "Инженерные системы",
    summary: "[ДОБАВИТЬ ОПИСАНИЕ УСЛУГИ]",
    items: ["[ПУНКТ]", "[ПУНКТ]", "[ПУНКТ]"],
    image: "",
  },
  {
    id: "general-contracting",
    number: "06",
    title: "Генеральный подряд",
    summary: "[ДОБАВИТЬ ОПИСАНИЕ УСЛУГИ]",
    items: ["[ПУНКТ]", "[ПУНКТ]", "[ПУНКТ]"],
    image: "",
  },
];
