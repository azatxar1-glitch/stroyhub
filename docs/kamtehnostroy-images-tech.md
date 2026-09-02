# Кадры строительного процесса: техническая достоверность

Дополнение к `kamtehnostroy-images.md`. Здесь — промпты для кадров, где видна
технология работ, и чек-лист, по которому кадр принимают или отбраковывают.

---

## 0. Честная рамка: что промпт может, а что нет

Промпт **повышает шансы**, но не гарантирует результат. Генеративные модели не
считают нагрузки и не знают СНиП — они собирают правдоподобную картинку из
похожих. Поэтому работа состоит из двух частей, и вторая важнее:

1. Подробный промпт с названиями конкретных элементов (раздел 3).
2. **Приёмка кадра по чек-листу (раздел 4).** Отбраковывать придётся много —
   это нормально. Из десяти кадров опалубки годными обычно выходят один-два.

И третье, стратегическое: **чем меньше технологии в кадре, тем меньше шансов
на ошибку.** Готовый фасад, деталь бетона, сумеречный общий план — почти
безопасны. Армирование, опалубка, леса, строповка — зона высокого риска.
Шкала — в разделе 5.

Если раздел о процессе принципиально важен — его дешевле и честнее отснять
на реальном объекте. Одна поездка фотографа закрывает и достоверность,
и вопрос «это наши объекты или нет».

---

## 1. TECH — техническая приписка

Добавляется к блоку `STYLE` из основного файла и к промпту конкретной работы:

```
technically accurate construction site, everything correctly supported and
braced, all temporary works complete and load bearing, regular consistent
spacing of supports, plumb and level elements, no floating or unsupported
objects, tidy and well organised site, documentary construction photography
```

---

## 2. NEGATIVE-TECH — что запретить явно

К общему негативу из основного файла добавьте:

```
--no unsupported formwork, missing props, missing tie rods, floating scaffolding,
scaffolding without braces, stacked bond brickwork, aligned vertical joints,
rebar without spacers, bent or sagging steel, impossible geometry, leaning
structures, collapsed elements, broken crane, single leg sling on a heavy load,
tangled cables, unfinished chaotic mess
```

---

## 3. Промпты по видам работ

Формат: `<STYLE> + <TECH> + <промпт ниже> + <NEGATIVE> + <NEGATIVE-TECH>`.

---

### 3.1 Опалубка стен (крупнощитовая)

```
close three-quarter view of large panel wall formwork for a reinforced concrete
wall, steel framed panels with plywood facing, horizontal walers, tie rods
passing through the wall in two regular horizontal rows with wing nuts and
washers on both faces, adjustable push-pull props at roughly sixty degrees
anchored into the floor slab, two props per panel, working platform with
guardrail along the top of the formwork, panels plumb and tightly joined,
overcast light --ar 4:5
```

**Что должно быть в кадре:** стяжные винты в два ряда по высоте с гайками и
шайбами, подкосы с винтовой регулировкой, упирающиеся в анкер в плите,
подмости с ограждением сверху, плотные стыки щитов.

---

### 3.2 Опалубка перекрытия

```
interior view of slab formwork before the pour, telescopic steel props on
tripods with forkheads, primary timber H20 beams resting in the forkheads,
secondary beams laid across them at regular close spacing, plywood decking on
top, props arranged in a regular grid about one and a half metres apart, all
props vertical and bearing on the concrete floor below, edge protection at the
slab perimeter, daylight from perimeter openings --ar 4:3
```

**Что должно быть:** две ступени балок (главные в унивилках, второстепенные
поперёк), треноги под стойками, регулярный шаг, все стойки строго вертикальны.

---

### 3.3 Армирование плиты

```
top down view of a reinforced concrete slab ready for pouring, bottom rebar mat
lifted off the plywood deck on plastic spacers giving a visible concrete cover,
top rebar mat carried on steel chairs above the bottom mat, bars tied with
annealed wire at intersections, laps of bars overlapping along their length,
regular bar spacing, clean plywood deck, no dirt, soft overcast light --ar 16:10
```

**Что должно быть:** фиксаторы защитного слоя под нижней сеткой, «лягушки» под
верхней, вязальная проволока на пересечениях, нахлёсты стержней, видимый зазор
между арматурой и опалубкой.

---

### 3.4 Бетонирование

```
concrete placement on a slab, truck mounted concrete boom pump with the boom
extended, flexible end hose held close to the surface less than one metre above
the rebar, fresh grey concrete spreading, an internal poker vibrator with a
flexible shaft in use, a screed board resting on the level rails, ready mix
truck discharging into the pump hopper in the background, overcast light
--ar 16:11
```

**Что должно быть:** насос с бетоноводом по стреле, концевой рукав у самой
поверхности, глубинный вибратор, правило/виброрейка, миксер у приёмного бункера.

---

### 3.5 Распалубленный монолит

```
close view of a freshly stripped reinforced concrete wall, uniform grey
surface with the faint imprint of plywood panel joints in a regular grid,
tie rod holes plugged with cone shaped inserts in even rows, sharp clean
arrises with a small chamfer at the corner, dense surface without honeycombing
or exposed reinforcement, soft raking daylight --ar 4:5
```

**Что должно быть:** регулярная сетка следов от стыков щитов, ровные ряды
заделанных отверстий от стяжек, чёткие грани, плотная поверхность без раковин
и оголённой арматуры.

---

### 3.6 Каменная кладка

```
close frontal view of blockwork under construction, running bond with vertical
joints offset by half a block in every course, uniform mortar joints about ten
millimetres thick, a taut string line stretched along the top course, a spirit
level resting against the face, a corner profile pole at the end of the wall,
reinforcement mesh visible in one bed joint, working from a scaffold platform,
overcast light --ar 4:3
```

**Что должно быть:** перевязка со смещением на полблока, равномерный шов,
шнур-причалка, порядовка на углу, армирование в шве.

> Совпадающие по вертикали швы — самая частая и самая заметная ошибка ИИ.
> Кадр с ней бракуется сразу.

---

### 3.7 Леса

```
facade view of system scaffolding erected against a building, standards
ledgers and transoms forming a regular bay grid, diagonal braces in the facade
plane repeating every few bays, full timber decking without gaps, double
guardrail and a toe board along every working level, wall ties fixed into the
facade at regular intervals in both directions, adjustable base jacks on
timber sole boards at ground level, integrated stair tower for access,
overcast light --ar 3:4
```

**Что должно быть:** анкеры к стене по регулярной сетке, диагональные связи,
двойное ограждение с бортовой доской, сплошной настил, винтовые опоры на
подкладках, лестничная секция.

---

### 3.8 Монтаж краном

```
structural steel beam being lifted into position, four leg chain sling with
equal leg lengths and the angle between legs well under ninety degrees, shackles
at the lifting points, hook block with a closed safety latch, the beam hanging
horizontal and level, a tag line running down from one end, tower crane in the
background with a counterweight on the counter jib, overcast sky --ar 4:5
```

**Что должно быть:** четырёхветвевой строп с равными ветвями, угол между
ветвями заметно меньше 90°, защёлка на крюке, груз строго горизонтально,
оттяжка, противовес на контргрузовой консоли крана.

---

### 3.9 Котлован

```
wide view of an excavation for a building, sheet pile retaining wall along the
perimeter with a horizontal waler beam and steel struts spanning across, stable
battered slopes where the ground is open, a graded haul ramp descending into
the excavation, drainage sump at the lowest corner, excavator working at the
bottom, overcast light --ar 16:9
```

**Что должно быть:** крепление стенок (шпунт с распорками) или откосы,
водоотводной приямок, съезд в котлован.

---

### 3.10 Инженерные системы

```
plant room interior with rectangular galvanised ductwork running along the
ceiling, flanged joints between sections, threaded rod hangers with trapeze
channel supports at regular intervals, insulated pipework on brackets with
consistent spacing, cable trays running parallel with covers in place,
everything aligned and level, cold even artificial light --ar 4:5
```

**Что должно быть:** подвесы на шпильках с траверсами и регулярным шагом,
фланцевые соединения воздуховодов, опоры трубопроводов, параллельные трассы.

---

### 3.11 Отделочные работы

```
interior wall being plastered, steel screed beads set vertically at regular
spacing and plumb, a long aluminium straightedge resting across two beads,
freshly applied plaster levelled between them, corner bead protecting the
external angle, clean floor, soft daylight from a window --ar 4:3
```

**Что должно быть:** маяки строго вертикально с равным шагом, правило,
опирающееся ровно на два маяка, угловой профиль.

---

### 3.12 Навесной фасад

```
close view of a ventilated facade system under installation, thermally broken
brackets fixed to the concrete wall, vertical aluminium rails mounted on the
brackets, mineral wool insulation between them fixed with plate anchors,
breather membrane over the insulation, a clear ventilation gap behind the
cladding panels, panels hung on clips with even open joints, overcast light
--ar 4:5
```

**Что должно быть:** кронштейны с термовставкой, вертикальные направляющие,
утеплитель с тарельчатыми дюбелями, мембрана, вентзазор, ровные открытые швы.

---

## 4. Чек-лист приёмки кадра

Смотреть при 100 % увеличения. Один провал — кадр в брак, ретушь дешевле
перегенерации только для мелочей.

| Дисциплина | Отбраковать, если |
|---|---|
| **Опалубка стен** | нет стяжных винтов; нет подкосов или они не упираются в плиту; щиты не в одной плоскости; нет подмостей с ограждением |
| **Опалубка перекрытия** | стойки без треног; одна ступень балок вместо двух; хаотичный шаг стоек; стойка не опирается на плиту |
| **Армирование** | сетка лежит прямо на опалубке без фиксаторов; нет верхних подставок; стержни не перевязаны; нет нахлёстов |
| **Бетонирование** | бетон падает с высоты больше метра; нет вибратора; бетоновод обрывается в воздухе; насос без опор |
| **Монолит** | раковины, оголённая арматура; хаотичные следы щитов; рваные грани |
| **Кладка** | вертикальные швы совпадают по высоте; разнотолщинные швы; нет шнура и порядовки |
| **Леса** | нет анкеров к стене; нет диагональных связей; ограждение в одну нитку или его нет; щели в настиле; стойки на грунте без подкладок |
| **Строповка** | одна ветвь на тяжёлом грузе; угол между ветвями больше 90°; груз висит под наклоном; крюк без защёлки; нет оттяжки |
| **Котлован** | вертикальные стенки глубже двух метров без крепления; нет распорок при шпунте; нет съезда |
| **Инженерия** | воздуховод или труба висит без подвесов; нерегулярный шаг опор; трассы пересекаются как попало |
| **Отделка** | правило лежит на одном маяке; маяки не вертикальны или с разным шагом |
| **Фасад** | нет вентзазора; направляющие горизонтальные вместо вертикальных; утеплитель без дюбелей |
| **Общее** | балки прогибаются под собственным весом; элементы висят в воздухе; конструкция стоит с наклоном; повторяющаяся геометрия «плывёт» по кадру |

Дополнительно — универсальные признаки генерации: сросшиеся стержни арматуры,
болты без гаек, лестницы, ведущие в стену, тросы, уходящие в никуда, надписи
из нечитаемых символов.

---

## 5. Шкала риска: с чего начинать

| Риск | Сюжеты | Комментарий |
|---|---|---|
| **Низкий** | готовый фасад, деталь бетона, геометрия и ритм окон, сумеречный общий план, силуэт крана на фоне неба, пустой бетонный интерьер | технологии в кадре почти нет — брак маловероятен |
| **Средний** | распалубленный монолит, кладка крупным планом, воздуховоды в венткамере, стальной узел | ошибки возможны, но их видно сразу и они локальны |
| **Высокий** | опалубка, армирование, леса, строповка и монтаж, бетонирование | генерировать сериями по 8–12 кадров, отбирать единицы |

Практический вывод: **основу набора соберите из низкого и среднего риска**,
а из высокого возьмите один-два кадра, прошедших чек-лист. Сайт от этого не
пострадает — в макете и так преобладают крупные архитектурные планы.

---

## 6. Приёмы, которые повышают выход годных кадров

- **Крупнее план — меньше ошибок.** Чем меньше элементов в кадре, тем меньше
  мест, где модель может ошибиться. Деталь узла надёжнее общего плана стройки.
- **Генерируйте сразу в высоком разрешении.** Стяжки, фиксаторы и вязальная
  проволока на мелком кадре просто не прорисовываются, и приёмку провести
  невозможно.
- **Одна работа в кадре.** Промпт «опалубка и армирование и кран» даёт кашу.
  Разделяйте.
- **Пасмурный свет и сумерки** маскируют мелкие огрехи и совпадают с палитрой
  сайта.
- **Серия по 8–12 вариантов** на один промпт для сюжетов высокого риска.
- **Ретушь дешевле перегенерации**, когда нужно убрать один лишний элемент или
  дорисовать бортовую доску. Когда нарушена сама схема работы — только заново.

---

## 7. Кому показать перед публикацией

Отобранные кадры стоит показать вашему прорабу или главному инженеру — пять
минут просмотра снимут риск, который не снимет ни один промпт. Специалист
увидит несоответствие мгновенно, а именно специалисты и есть аудитория,
ради которой сайт делается.
