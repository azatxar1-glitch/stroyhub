/** Преимущества — три крупных пункта, раскрываются при наведении. */
export type Advantage = {
  number: string;
  title: string;
  text: string;
};

export const advantagesTitle = ["ТОЧНОСТЬ.", "КОНТРОЛЬ.", "ОТВЕТСТВЕННОСТЬ."];

export const advantages: Advantage[] = [
  {
    number: "01",
    title: "Точная организация строительного процесса",
    text: "[ДОБАВИТЬ ОПИСАНИЕ]",
  },
  {
    number: "02",
    title: "Контроль качества на каждом этапе",
    text: "[ДОБАВИТЬ ОПИСАНИЕ]",
  },
  {
    number: "03",
    title: "Ответственность за результат",
    text: "[ДОБАВИТЬ ОПИСАНИЕ]",
  },
];
