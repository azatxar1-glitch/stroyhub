/**
 * Groups the real category rows into browsable directions for the homepage.
 * Slugs are matched against what's in the database — anything not listed here
 * falls into "Другие направления", so a new category never silently disappears.
 */

export const CATEGORY_GROUPS: { title: string; caption: string; slugs: string[] }[] = [
  {
    title: "Документация",
    caption: "Исполнительная, сметная и отчётная документация",
    slugs: ["pto", "smetchik", "aosr", "ispolnitelnaya-dokumentaciya", "ks2-ks3", "ispolnitelnye-shemy"],
  },
  {
    title: "Проектирование",
    caption: "Разделы проекта, чертежи и BIM-модели",
    slugs: ["proektirovshchik", "inzhener", "autocad", "revit-bim"],
  },
  {
    title: "Строительство",
    caption: "Работы на объекте и линейный персонал",
    slugs: [
      "prorab",
      "obshchestroitelnye-raboty",
      "otdelochnye-raboty",
      "elektrika",
      "santehnika",
      "ventilyaciya",
      "fasadnye-raboty",
      "krovlya",
      "stroitelnye-brigady",
    ],
  },
  {
    title: "Контроль и обследование",
    caption: "Надзор, замеры и техническая экспертиза",
    slugs: ["tehnicheskiy-nadzor", "geodeziya", "obsledovanie-zdaniy"],
  },
];

export type GroupableCategory = { id: string; name: string; slug: string; icon: string | null };

export function groupCategories<T extends GroupableCategory>(categories: T[]) {
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const used = new Set<string>();

  const groups = CATEGORY_GROUPS.map((group) => {
    const items = group.slugs
      .map((slug) => bySlug.get(slug))
      .filter((c): c is T => Boolean(c));
    items.forEach((c) => used.add(c.slug));
    return { ...group, items };
  }).filter((g) => g.items.length > 0);

  const rest = categories.filter((c) => !used.has(c.slug));
  if (rest.length > 0) {
    groups.push({
      title: "Другие направления",
      caption: "Смежные строительные услуги",
      slugs: rest.map((c) => c.slug),
      items: rest,
    });
  }

  return groups;
}

/** Quick-search chips under the hero — only slugs that exist get rendered. */
export const POPULAR_SEARCH_SLUGS = [
  "pto",
  "smetchik",
  "aosr",
  "ks2-ks3",
  "proektirovshchik",
  "prorab",
  "otdelochnye-raboty",
];
