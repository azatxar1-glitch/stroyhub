# Промпты для изображений — ООО «КАМТЕХНОСТРОЙ»

Готовые промпты под каждое место на сайте: фон, первый экран, объекты, галерея,
услуги, OG-картинка. Промпты — на английском (модели работают с ним точнее),
пояснения — на русском.

> **Важно.** Сгенерированные изображения — это атмосферные визуалы, а не фотографии
> реальных объектов компании. Не подписывайте их как построенные объекты
> ООО «КАМТЕХНОСТРОЙ». Раздел «Объекты» лучше держать пустым до появления
> настоящих фотографий, а генерацию использовать для первого экрана, секции
> «О компании», галереи и фона.

---

## 1. Как пользоваться

1. Берёте блок `STYLE` (раздел 2) — он одинаковый для всех кадров, именно он
   делает набор единым.
2. Добавляете к нему промпт нужного слота из раздела 4.
3. Добавляете `NEGATIVE` (раздел 3).
4. Сохраняете файл по указанному пути в `public/images/…`.
5. Прописываете путь в файле данных — сайт подхватит автоматически, вёрстку
   менять не нужно.

Формат итогового промпта:

```
<STYLE>, <промпт слота> --ar <соотношение> --style raw --v 6
```

`--ar` и `--v` — синтаксис Midjourney. Для Flux / DALL·E / Ideogram флаги
уберите, а соотношение сторон задайте в настройках генерации.

---

## 2. STYLE — общая стилевая база

Вставляйте в начало каждого промпта без изменений:

```
architectural photography, contemporary industrial construction, monolithic
reinforced concrete and structural steel, overcast diffuse daylight, muted
graphite and warm off-white palette, one subtle bronze-ochre accent, low
contrast, fine natural film grain, medium format camera, 40mm lens, straight-on
composition, precise geometry, calm restrained mood, editorial magazine
aesthetic, no people
```

Почему так: сайт построен на графите `#0b0c0e` и бумаге `#f2f1ee` с одной
бронзовой нотой `#b07a3c`. Пасмурный рассеянный свет и низкий контраст держат
кадры в этой палитре и не спорят с крупной типографикой.

---

## 3. NEGATIVE — что исключить

```
--no text, letters, logos, watermarks, signatures, workers in hard hats posing,
smiling people, stock photo look, HDR, oversaturated colors, teal and orange
grading, lens flare, tilt-shift, fisheye, cluttered composition, litter, rust,
ruins, damaged buildings, cartoon, illustration, 3d render look, plastic
```

Для моделей без `--no` перенесите это в поле negative prompt.

---

## 4. Промпты по слотам

> **Кадры, где видна технология работ** — опалубка, армирование, бетонирование,
> кладка, леса, строповка, инженерные системы — вынесены в отдельный файл
> [`kamtehnostroy-images-tech.md`](./kamtehnostroy-images-tech.md). Там промпты
> с перечислением конкретных элементов и чек-лист приёмки, чтобы на фотографиях
> не была нарушена технология строительства.

### 4.1 Первый экран — `public/images/hero/hero.jpg`

Соотношение **21:9** (или 16:9), ширина 2800–3200 px.
Путь прописать: `src/data/kamtehnostroy/company.ts` → `hero.image`.

Кадр тёмный: поверх него ложится светлый заголовок в 120 px и градиент
затемнения. В левой половине должно быть пустое место под текст.

**Вариант A — монолит на стройплощадке (рекомендую):**

```
wide cinematic view of a modern monolithic concrete building under construction
at blue hour, exposed reinforced concrete floor slabs and structural steel
frame, a single tower crane silhouetted against a deep graphite sky, clean
geometric rhythm of floor plates, large area of empty dark sky across the left
half of the frame, deep shadows, cold light with a faint warm glow from work
lighting --ar 21:9
```

**Вариант B — готовый объект:**

```
contemporary building facade at dusk, deep ribbed concrete fins and dark glass,
strict vertical rhythm, graphite sky, wet asphalt foreground with soft
reflections, empty dark space on the left third for text --ar 21:9
```

**Вариант C — инженерная конструкция:**

```
low angle view of a massive structural steel node, bolted connections and
welded gussets, dark steel against an overcast sky, extreme precision,
industrial monumentality, shallow negative space at the left --ar 21:9
```

---

### 4.2 О компании — `public/images/about/about.jpg`

Соотношение **16:7**, ширина 2800 px. Светлый кадр, идёт на бумажном фоне.
Путь: `company.ts` → `about.image`.

```
wide horizontal frame of a contemporary concrete facade, deep vertical fins
casting a rhythmic pattern of shadows, warm off-white concrete against a
graphite sky, precise repetition, soft overcast light, minimal and quiet
--ar 16:7
```

---

### 4.3 Философия компании — `public/images/about/statement.jpg`

Соотношение **16:9**, ширина 2800 px. Полноэкранная подложка под фразу
«КАЖДЫЙ ОБЪЕКТ — ЭТО ОТВЕТСТВЕННОСТЬ». Должен быть очень тёмным.
Путь: `company.ts` → `statement.image`.

```
dark atmospheric wide shot of a large concrete structure at night, faint warm
work lights deep in the frame, heavy shadows and light fog, silhouettes of
formwork and scaffolding, very low key, mostly darkness with subtle structural
detail, generous empty area for a large text overlay --ar 16:9
```

---

### 4.4 Объекты — `public/images/projects/`

Пути: `src/data/kamtehnostroy/projects.ts` → `image` (обложка) и `gallery`.
Структура: `projects/obj-01/cover.jpg`, `projects/obj-01/01.jpg` и т. д.

| Объект | Файл | Соотношение |
|---|---|---|
| 01 (крупная карточка) | `obj-01/cover.jpg` | **16:11** |
| 02–05 | `obj-0N/cover.jpg` | **4:5** |
| Кадры внутри карточки | `obj-0N/01…03.jpg` | **4:3** |
| Шапка страницы объекта | `obj-0N/cover.jpg` | используется та же |

**01 — промышленное / складское здание** (16:11):

```
large industrial building envelope, ribbed metal cladding and concrete plinth,
long horizontal volume, overcast sky, empty asphalt apron in the foreground,
strict frontal composition --ar 16:11
```

**02 — общественное здание** (4:5):

```
vertical view of a contemporary public building, exposed concrete and deep
window reveals, strong vertical proportion, soft grey daylight --ar 4:5
```

**03 — монолитный каркас** (4:5):

```
vertical frame of a reinforced concrete frame under construction, columns and
flat slabs, formwork panels still in place, raw grey concrete, overcast light
--ar 4:5
```

**04 — инженерные системы** (4:5):

```
vertical view of an industrial plant room, ordered runs of ventilation ducts
and insulated pipework, galvanised steel, clean and precisely installed, cold
even lighting --ar 4:5
```

**05 — готовый объект** (4:5):

```
vertical view of a finished contemporary building at dusk, warm interior light
in a grid of windows, restrained landscaping in the foreground, graphite sky
--ar 4:5
```

**Кадры внутри карточки объекта** (4:3, по 3 на объект):

```
detail of freshly stripped concrete showing formwork board texture, precise
edges, natural grey tone, diffuse light --ar 4:3
```
```
wide interior of an unfinished concrete floor, columns receding into depth,
daylight from perimeter openings, empty and quiet --ar 4:3
```
```
close view of a bolted steel connection with clean welds, dark steel, shallow
depth of field, technical precision --ar 4:3
```

---

### 4.5 Фотогалерея — `public/images/gallery/`

Путь: `src/data/kamtehnostroy/gallery.ts` → `src`. Там же категория и размер
плитки (`span`: `"tall"` → 3:4, `"wide"` → 16:10, без `span` → 4:3).

| ID | Категория | Соотношение | Промпт |
|---|---|---|---|
| g01 | Строительство | **3:4** | `vertical shot of a tower crane above a concrete core under construction, overcast sky, strong vertical composition` |
| g02 | Архитектура | **4:3** | `abstract composition of a concrete facade grid, deep reveals and sharp shadows, frontal and flat` |
| g03 | Процесс | **4:3** | `wall formwork panels being aligned, timber and steel shuttering, raw concrete, working site without people` |
| g04 | Детали | **16:10** | `macro view of a dense rebar mesh before the pour, tied intersections, cold grey steel, shallow depth of field` |
| g05 | Готовые объекты | **3:4** | `finished building corner at dusk, precise concrete edge against the sky, warm light in the windows` |
| g06 | Строительство | **4:3** | `concrete pour in progress, boom pipe over a slab, grey wet concrete surface, overcast light` |
| g07 | Архитектура | **4:3** | `staircase volume in exposed concrete, sculptural geometry, soft daylight from above` |
| g08 | Процесс | **4:3** | `site laser level on a tripod on a concrete slab, measurement and precision, shallow depth of field` |
| g09 | Детали | **4:3** | `close view of a concrete expansion joint and embedded steel plate, clean workmanship, natural grey` |

---

### 4.6 Превью услуг (кадр за курсором) — `public/images/gallery/services/`

Соотношение **4:5**, ширина 900–1200 px (превью показывается в 320 px).
Путь: `src/data/kamtehnostroy/services.ts` → `image`.

| Услуга | Промпт |
|---|---|
| Общестроительные работы | `vertical view of masonry and concrete works in progress, ordered blockwork wall, overcast light` |
| Монолитные работы | `vertical view of a concrete column being stripped of formwork, sharp arris, raw grey surface` |
| Строительно-монтажные | `vertical view of a steel beam being set into place, rigging slings, dark steel against grey sky` |
| Отделочные работы | `vertical interior of a finished space, plastered walls and a screed floor, soft even daylight, empty` |
| Инженерные системы | `vertical view of a riser shaft with ordered pipework and cable trays, galvanised steel, precise` |
| Генеральный подряд | `vertical elevated view over a construction site, ordered laydown areas and access roads, overcast` |

---

## 5. Фон сайта

Сейчас фон — чистый цвет плюс чертёжная сетка, нарисованная в CSS
(`kt-grid-light` / `kt-grid-dark`, файл `src/app/kamtehnostroy/kt.css`).
Изображения для фона **не обязательны** — сетка уже даёт нужную фактуру и не
стоит ни одного запроса. Ниже — если захотите добавить лёгкое «зерно» бумаги
и графита.

### 5.1 Светлая подложка — `public/images/texture/paper-light.jpg`

Бесшовная плитка **1024×1024**, вес до 60 КБ.

```
seamless tileable texture, very fine paper fibre mixed with micro concrete
grain, warm off-white, almost flat, extremely subtle, even flat lighting, no
shadows, no visible pattern, no seams, no objects --ar 1:1 --tile
```

### 5.2 Тёмная подложка — `public/images/texture/graphite-dark.jpg`

Бесшовная плитка **1024×1024**, вес до 60 КБ.

```
seamless tileable texture, fine concrete grain with subtle film noise, near
black graphite, almost flat, extremely subtle, even flat lighting, no shadows,
no visible pattern, no seams, no objects --ar 1:1 --tile
```

### 5.3 Как подключить

В `src/app/kamtehnostroy/kt.css`, внутри `@layer components`:

```css
.kt {
  /* … существующие свойства … */
  background-image: url("/images/texture/paper-light.jpg");
  background-size: 512px 512px;
  background-blend-mode: multiply;
}

.kt-dark {
  background-color: var(--kt-ink);
  background-image: url("/images/texture/graphite-dark.jpg");
  background-size: 512px 512px;
  background-blend-mode: screen;
}
```

Проверьте после подключения: текстура не должна читаться как узор — только
едва заметное зерно. Если видно повтор плитки — увеличьте `background-size`
до 768–1024 px или ослабьте контраст самой картинки.

### 5.4 Чертёж для тёмной секции (необязательно)

В секции «СТРОИТЕЛЬСТВО ДОЛЖНО БЫТЬ ПРЕДСКАЗУЕМЫМ» чертёжная графика уже
нарисована в SVG внутри компонента. Если захотите заменить её растровым
чертежом — `public/images/texture/blueprint.png`, PNG с прозрачностью,
2000×2000:

```
technical architectural drawing on transparent background, thin white line
work, floor plan with column grid, dimension lines with tick marks, section
marks and level annotations without readable text, orthographic, precise,
no fill, no background --ar 1:1
```

---

## 6. Картинка для соцсетей (Open Graph)

**1200×630 px.** Положите файл как `src/app/kamtehnostroy/opengraph-image.jpg` —
Next.js подхватит его автоматически, править метаданные не нужно.

```
wide architectural photograph of a modern concrete building under construction,
graphite and off-white palette, overcast light, large empty dark area on the
left half of the frame, editorial, calm --ar 1200:630
```

Заголовок и название компании поверх картинки не рисуйте — соцсети покажут их
из метатегов сами.

---

## 7. Логотип — не генерируем

Эмблему и логотип ООО «КАМТЕХНОСТРОЙ» нейросетью **не создаём**. До загрузки
настоящих файлов в шапке работает временный текстовый wordmark.

Когда логотип появится — положите его в `public/images/brand/` и укажите путь
в `company.ts` → `brand`. Инструкция лежит в `public/images/brand/README.md`.

---

## 8. Технические требования

| Слот | Соотношение | Ширина исходника | Целевой вес |
|---|---|---|---|
| Hero | 21:9 | 2800–3200 px | ≤ 500 КБ |
| О компании / философия | 16:7, 16:9 | 2400–2800 px | ≤ 400 КБ |
| Обложки объектов | 16:11, 4:5 | 1600–2000 px | ≤ 300 КБ |
| Кадры объектов, галерея | 4:3, 3:4, 16:10 | 1200–1600 px | ≤ 250 КБ |
| Превью услуг | 4:5 | 900–1200 px | ≤ 150 КБ |
| Текстуры | 1:1 | 1024 px | ≤ 60 КБ |
| OG | 1200×630 | 1200 px | ≤ 300 КБ |

Формат: JPG или WebP. Оптимизация перед загрузкой (Squoosh, ImageOptim или
`npx @squoosh/cli`) — `next/image` пережмёт под нужный размер, но исходник
лучше не тащить в репозиторий тяжёлым.

**Проверка тёмных кадров.** Hero и «Философия» перекрываются градиентом
затемнения и несут крупный светлый текст. После загрузки посмотрите первый
экран на телефоне: заголовок должен читаться без усилий. Если кадр вышел
слишком светлым — либо перегенерируйте темнее, либо усильте градиент в
`src/components/kamtehnostroy/hero.tsx`.
