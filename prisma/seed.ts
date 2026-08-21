import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "password123";

const CATEGORIES = [
  { name: "ПТО", slug: "pto", icon: "ClipboardList" },
  { name: "Сметчик", slug: "smetchik", icon: "Calculator" },
  { name: "Проектировщик", slug: "proektirovshchik", icon: "Ruler" },
  { name: "Исполнительная документация", slug: "ispolnitelnaya-dokumentaciya", icon: "FileText" },
  { name: "АОСР", slug: "aosr", icon: "FileCheck" },
  { name: "Исполнительные схемы", slug: "ispolnitelnye-shemy", icon: "Map" },
  { name: "КС-2 / КС-3", slug: "ks2-ks3", icon: "Receipt" },
  { name: "Технический надзор", slug: "tehnicheskiy-nadzor", icon: "ShieldCheck" },
  { name: "Прораб", slug: "prorab", icon: "HardHat" },
  { name: "Инженер", slug: "inzhener", icon: "Wrench" },
  { name: "AutoCAD", slug: "autocad", icon: "PenTool" },
  { name: "Revit / BIM", slug: "revit-bim", icon: "Boxes" },
  { name: "Обследование зданий", slug: "obsledovanie-zdaniy", icon: "Search" },
  { name: "Геодезия", slug: "geodeziya", icon: "Compass" },
  { name: "Строительные бригады", slug: "stroitelnye-brigady", icon: "Users" },
  { name: "Отделочные работы", slug: "otdelochnye-raboty", icon: "Paintbrush" },
  { name: "Общестроительные работы", slug: "obshchestroitelnye-raboty", icon: "Building2" },
  { name: "Электрика", slug: "elektrika", icon: "Zap" },
  { name: "Сантехника", slug: "santehnika", icon: "Droplets" },
  { name: "Вентиляция", slug: "ventilyaciya", icon: "Wind" },
  { name: "Фасадные работы", slug: "fasadnye-raboty", icon: "Building" },
  { name: "Кровля", slug: "krovlya", icon: "Home" },
  { name: "Другие строительные услуги", slug: "drugie-uslugi", icon: "MoreHorizontal" },
];

async function main() {
  console.log("Очистка базы данных...");
  await prisma.$transaction([
    prisma.review.deleteMany(),
    prisma.message.deleteMany(),
    prisma.conversation.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.complaint.deleteMany(),
    prisma.order.deleteMany(),
    prisma.proposal.deleteMany(),
    prisma.jobAttachment.deleteMany(),
    prisma.job.deleteMany(),
    prisma.portfolioItem.deleteMany(),
    prisma.executorSkill.deleteMany(),
    prisma.skill.deleteMany(),
    prisma.executorProfile.deleteMany(),
    prisma.account.deleteMany(),
    prisma.session.deleteMany(),
    prisma.user.deleteMany(),
    prisma.category.deleteMany(),
  ]);

  console.log("Создание категорий...");
  const categories = await Promise.all(
    CATEGORIES.map((c, i) => prisma.category.create({ data: { ...c, order: i } }))
  );
  const catBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  console.log("Создание пользователей...");

  const admin = await prisma.user.create({
    data: {
      name: "Администратор",
      email: "admin@stroyhub.ru",
      passwordHash,
      role: "ADMIN",
      city: "Москва",
    },
  });

  const ivan = await prisma.user.create({
    data: {
      name: "Иван Строй",
      email: "ivan@stroyhub.ru",
      passwordHash,
      role: "CUSTOMER",
      city: "Казань",
      phone: "+7 900 111-22-33",
      bio: "Частный застройщик, строю коттеджный посёлок.",
    },
  });

  const kapitalstroy = await prisma.user.create({
    data: {
      name: 'ООО "КапиталСтрой"',
      email: "kapitalstroy@stroyhub.ru",
      passwordHash,
      role: "CUSTOMER",
      city: "Москва",
      phone: "+7 495 222-33-44",
      bio: "Девелоперская компания полного цикла. Реализуем жилые и коммерческие объекты.",
    },
  });

  type ExecutorSeed = {
    name: string;
    email: string;
    city: string;
    categorySlug: string;
    headline: string;
    description: string;
    experienceYears: number;
    remoteAvailable: boolean;
    priceFrom: number;
    skills: string[];
    completedOrders: number;
  };

  const executorSeeds: ExecutorSeed[] = [
    {
      name: "Алексей Петров",
      email: "alexey@stroyhub.ru",
      city: "Казань",
      categorySlug: "pto",
      headline: "Инженер ПТО с опытом сдачи объектов «под ключ»",
      description:
        "Веду полный цикл исполнительной документации: от журналов работ до подготовки к сдаче объекта госкомиссии. Опыт работы с объектами от 1000 до 50000 м².",
      experienceYears: 8,
      remoteAvailable: true,
      priceFrom: 20000,
      skills: ["Исполнительная документация", "АОСР", "Журналы работ", "Стройконтроль"],
      completedOrders: 24,
    },
    {
      name: "Сергей Иванов",
      email: "sergey@stroyhub.ru",
      city: "Москва",
      categorySlug: "smetchik",
      headline: "Сметчик: составление смет в ГРАНД-Смета и Excel",
      description: "Составляю локальные и объектные сметы, провожу проверку смет подрядчиков, работаю с КС-2/КС-3.",
      experienceYears: 6,
      remoteAvailable: true,
      priceFrom: 15000,
      skills: ["ГРАНД-Смета", "КС-2", "КС-3", "Ценообразование"],
      completedOrders: 41,
    },
    {
      name: "Дмитрий Орлов",
      email: "dmitry@stroyhub.ru",
      city: "Санкт-Петербург",
      categorySlug: "proektirovshchik",
      headline: "Проектировщик АР/КР разделов, опыт 10 лет",
      description: "Разрабатываю проектную документацию стадии П и Р, работаю в AutoCAD и Revit. Прохожу экспертизу без замечаний.",
      experienceYears: 10,
      remoteAvailable: true,
      priceFrom: 35000,
      skills: ["AutoCAD", "Revit", "Проектная документация", "Экспертиза"],
      completedOrders: 33,
    },
    {
      name: "Ольга Смирнова",
      email: "olga@stroyhub.ru",
      city: "Казань",
      categorySlug: "elektrika",
      headline: "Электромонтажные работы любой сложности",
      description: "Бригада электромонтажников: разводка, щитовое оборудование, слаботочные системы. Работаем по договору с гарантией.",
      experienceYears: 7,
      remoteAvailable: false,
      priceFrom: 25000,
      skills: ["Электромонтаж", "Слаботочные системы", "Щитовое оборудование"],
      completedOrders: 18,
    },
    {
      name: "Максим Кузнецов",
      email: "maxim@stroyhub.ru",
      city: "Екатеринбург",
      categorySlug: "prorab",
      headline: "Прораб с опытом управления бригадами до 30 человек",
      description: "Контролирую качество и сроки на объекте, веду документацию, взаимодействую с подрядчиками и заказчиком.",
      experienceYears: 12,
      remoteAvailable: false,
      priceFrom: 60000,
      skills: ["Управление бригадой", "Контроль качества", "Приёмка работ"],
      completedOrders: 27,
    },
    {
      name: "Наталья Волкова",
      email: "natalia@stroyhub.ru",
      city: "Москва",
      categorySlug: "otdelochnye-raboty",
      headline: "Отделка квартир и коммерческих помещений под ключ",
      description: "Команда отделочников: штукатурка, покраска, укладка плитки и ламината. Более 100 сданных объектов.",
      experienceYears: 9,
      remoteAvailable: false,
      priceFrom: 1200,
      skills: ["Штукатурка", "Плитка", "Малярные работы"],
      completedOrders: 52,
    },
    {
      name: "Игорь Соколов",
      email: "igor@stroyhub.ru",
      city: "Новосибирск",
      categorySlug: "tehnicheskiy-nadzor",
      headline: "Технический надзор на объектах промышленного и жилого строительства",
      description: "Независимый строительный контроль, проверка соответствия СНиП и проекту, выявление скрытых работ.",
      experienceYears: 15,
      remoteAvailable: true,
      priceFrom: 40000,
      skills: ["Строительный контроль", "СНиП", "Скрытые работы"],
      completedOrders: 19,
    },
  ];

  const executors = [];
  for (const seed of executorSeeds) {
    const user = await prisma.user.create({
      data: {
        name: seed.name,
        email: seed.email,
        passwordHash,
        role: "EXECUTOR",
        city: seed.city,
        phone: "+7 900 555-66-77",
        bio: seed.description,
      },
    });

    const skills = await Promise.all(
      seed.skills.map((name) => prisma.skill.upsert({ where: { name }, create: { name }, update: {} }))
    );

    const profile = await prisma.executorProfile.create({
      data: {
        userId: user.id,
        categoryId: catBySlug[seed.categorySlug].id,
        headline: seed.headline,
        description: seed.description,
        experienceYears: seed.experienceYears,
        remoteAvailable: seed.remoteAvailable,
        priceFrom: seed.priceFrom,
        availability: "AVAILABLE",
        ratingAvg: 0,
        ratingCount: 0,
        completedOrders: seed.completedOrders,
        skills: { create: skills.map((s) => ({ skillId: s.id })) },
      },
    });

    executors.push({ user, profile });
  }

  const [alexey, sergey, dmitry, olga, maxim, natalia, igor] = executors;

  console.log("Создание заявок...");

  type JobSeed = {
    customer: typeof ivan;
    categorySlug: string;
    title: string;
    description: string;
    city: string;
    address?: string;
    locationType: "REMOTE" | "ON_SITE";
    budget: number;
    deadline: string;
  };

  const jobSeeds: JobSeed[] = [
    {
      customer: ivan,
      categorySlug: "pto",
      title: "Подготовить исполнительную документацию по монолитным работам",
      description:
        "Нужно подготовить исполнительную документацию по монолитным работам. Объект 5000 м². Требуются журналы работ, АОСР, исполнительные схемы. Все чертежи и КЖ есть в наличии, предоставлю после старта работ.",
      city: "Казань",
      address: "ЖК «Солнечный», корп. 2",
      locationType: "ON_SITE",
      budget: 45000,
      deadline: "10 дней",
    },
    {
      customer: kapitalstroy,
      categorySlug: "smetchik",
      title: "Составить смету на отделочные работы офисного центра",
      description: "Требуется локальная смета на чистовую отделку офисного центра площадью 3200 м². Работа в ГРАНД-Смете, база ФЕР.",
      city: "Москва",
      locationType: "REMOTE",
      budget: 30000,
      deadline: "5 дней",
    },
    {
      customer: kapitalstroy,
      categorySlug: "proektirovshchik",
      title: "Разработать проект перепланировки нежилого помещения",
      description: "Нужен проект перепланировки нежилого помещения 450 м² под ресторан с прохождением экспертизы.",
      city: "Москва",
      address: "ул. Тверская, 12",
      locationType: "ON_SITE",
      budget: 120000,
      deadline: "20 дней",
    },
    {
      customer: ivan,
      categorySlug: "elektrika",
      title: "Электромонтаж в частном доме 220 м²",
      description: "Требуется полная разводка электрики в новом частном доме: щитовая, розетки, освещение, слаботочка.",
      city: "Казань",
      address: "пос. Лесной, ул. Садовая, 14",
      locationType: "ON_SITE",
      budget: 180000,
      deadline: "15 дней",
    },
    {
      customer: kapitalstroy,
      categorySlug: "prorab",
      title: "Прораб на объект жилого комплекса",
      description: "Требуется прораб для контроля хода работ на объекте ЖК на 3 месяца. Опыт от 5 лет обязателен.",
      city: "Москва",
      locationType: "ON_SITE",
      budget: 250000,
      deadline: "3 месяца",
    },
    {
      customer: ivan,
      categorySlug: "otdelochnye-raboty",
      title: "Отделка квартиры под ключ, 65 м²",
      description: "Нужна чистовая отделка 2-комнатной квартиры: штукатурка, стяжка, плитка в санузлах, покраска, ламинат.",
      city: "Казань",
      locationType: "ON_SITE",
      budget: 350000,
      deadline: "30 дней",
    },
    {
      customer: kapitalstroy,
      categorySlug: "tehnicheskiy-nadzor",
      title: "Технический надзор при строительстве складского комплекса",
      description: "Ищем специалиста по техническому надзору для проверки качества СМР на складском комплексе 10000 м².",
      city: "Новосибирск",
      locationType: "ON_SITE",
      budget: 200000,
      deadline: "2 месяца",
    },
    {
      customer: ivan,
      categorySlug: "geodeziya",
      title: "Геодезическая съёмка земельного участка",
      description: "Требуется топографическая съёмка участка 15 соток для дальнейшего проектирования.",
      city: "Казань",
      locationType: "ON_SITE",
      budget: 25000,
      deadline: "3 дня",
    },
    {
      customer: kapitalstroy,
      categorySlug: "krovlya",
      title: "Монтаж кровли складского здания",
      description: "Требуется монтаж металлочерепицы на складском здании площадью 800 м² кровли, с утеплением.",
      city: "Москва",
      locationType: "ON_SITE",
      budget: 420000,
      deadline: "25 дней",
    },
    {
      customer: ivan,
      categorySlug: "ks2-ks3",
      title: "Оформление КС-2 и КС-3 по завершённым работам",
      description: "Нужно оформить закрывающие документы КС-2 и КС-3 по общестроительным работам за 2 месяца.",
      city: "Казань",
      locationType: "REMOTE",
      budget: 18000,
      deadline: "4 дня",
    },
    {
      customer: kapitalstroy,
      categorySlug: "santehnika",
      title: "Монтаж внутренней сантехники в бизнес-центре",
      description: "Требуется монтаж систем водоснабжения и канализации на 4 этажах бизнес-центра.",
      city: "Москва",
      locationType: "ON_SITE",
      budget: 280000,
      deadline: "18 дней",
    },
    {
      customer: ivan,
      categorySlug: "obsledovanie-zdaniy",
      title: "Обследование технического состояния здания склада",
      description: "Нужно провести обследование несущих конструкций старого складского здания перед реконструкцией.",
      city: "Казань",
      locationType: "ON_SITE",
      budget: 55000,
      deadline: "12 дней",
    },
  ];

  const jobs = [];
  for (const seed of jobSeeds) {
    const job = await prisma.job.create({
      data: {
        customerId: seed.customer.id,
        categoryId: catBySlug[seed.categorySlug].id,
        title: seed.title,
        description: seed.description,
        city: seed.city,
        address: seed.address ?? null,
        locationType: seed.locationType,
        budget: seed.budget,
        deadline: seed.deadline,
      },
    });
    jobs.push(job);
  }

  console.log("Создание откликов и заказов...");

  // Job 0 (ПТО): two pending proposals
  await prisma.proposal.create({
    data: {
      jobId: jobs[0].id,
      executorId: alexey.user.id,
      price: 45000,
      durationDays: 7,
      comment: "Готов выполнить работу за 45 000 ₽. Срок — 7 дней. Есть опыт с аналогичными объектами.",
    },
  });
  await prisma.proposal.create({
    data: {
      jobId: jobs[0].id,
      executorId: igor.user.id,
      price: 50000,
      durationDays: 8,
      comment: "Могу взять в работу, срок 8 дней, включая выезд на объект для сверки.",
    },
  });

  // Job 1 (Сметчик): completed order with review
  const proposal1 = await prisma.proposal.create({
    data: {
      jobId: jobs[1].id,
      executorId: sergey.user.id,
      price: 28000,
      durationDays: 4,
      comment: "Сделаю смету за 28 000 ₽ за 4 дня, работаю в ГРАНД-Смете.",
      status: "ACCEPTED",
    },
  });
  await prisma.job.update({ where: { id: jobs[1].id }, data: { status: "COMPLETED" } });
  const order1 = await prisma.order.create({
    data: {
      jobId: jobs[1].id,
      proposalId: proposal1.id,
      customerId: kapitalstroy.id,
      executorId: sergey.user.id,
      price: 28000,
      deadline: "4 дн.",
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });
  await prisma.review.create({
    data: {
      orderId: order1.id,
      authorId: kapitalstroy.id,
      targetId: sergey.user.id,
      rating: 5,
      comment: "Отличная работа, смета готова точно в срок, без замечаний экспертизы.",
    },
  });
  await prisma.review.create({
    data: {
      orderId: order1.id,
      authorId: sergey.user.id,
      targetId: kapitalstroy.id,
      rating: 5,
      comment: "Заказчик оперативно отвечал на вопросы, оплата вовремя.",
    },
  });

  // Job 2 (Проектировщик): in progress order
  const proposal2 = await prisma.proposal.create({
    data: {
      jobId: jobs[2].id,
      executorId: dmitry.user.id,
      price: 115000,
      durationDays: 18,
      comment: "Возьмусь за проект, срок 18 дней с учётом согласований.",
      status: "ACCEPTED",
    },
  });
  await prisma.job.update({ where: { id: jobs[2].id }, data: { status: "IN_PROGRESS" } });
  await prisma.order.create({
    data: {
      jobId: jobs[2].id,
      proposalId: proposal2.id,
      customerId: kapitalstroy.id,
      executorId: dmitry.user.id,
      price: 115000,
      deadline: "18 дн.",
      status: "IN_PROGRESS",
    },
  });

  // Job 3 (Электрика): new order awaiting start
  const proposal3 = await prisma.proposal.create({
    data: {
      jobId: jobs[3].id,
      executorId: olga.user.id,
      price: 175000,
      durationDays: 14,
      comment: "Выполню полную разводку за 175 000 ₽, срок 14 дней, материалы заказчика.",
      status: "ACCEPTED",
    },
  });
  await prisma.job.update({ where: { id: jobs[3].id }, data: { status: "IN_PROGRESS" } });
  await prisma.order.create({
    data: {
      jobId: jobs[3].id,
      proposalId: proposal3.id,
      customerId: ivan.id,
      executorId: olga.user.id,
      price: 175000,
      deadline: "14 дн.",
      status: "NEW",
    },
  });

  // A couple more open proposals for variety on other open jobs
  await prisma.proposal.create({
    data: {
      jobId: jobs[5].id,
      executorId: natalia.user.id,
      price: 340000,
      durationDays: 28,
      comment: "Готова взять в работу, бригада свободна со следующей недели.",
    },
  });
  await prisma.proposal.create({
    data: {
      jobId: jobs[4].id,
      executorId: maxim.user.id,
      price: 240000,
      durationDays: 90,
      comment: "Есть опыт управления похожими объектами, готов приступить сразу.",
    },
  });

  console.log("Создание диалога и сообщений...");
  const conversation = await prisma.conversation.create({
    data: {
      jobId: jobs[1].id,
      customerId: kapitalstroy.id,
      executorId: sergey.user.id,
    },
  });
  await prisma.message.createMany({
    data: [
      {
        conversationId: conversation.id,
        senderId: kapitalstroy.id,
        text: "Добрый день! Уточните, пожалуйста, в какой базе будете считать смету?",
        readAt: new Date(),
      },
      {
        conversationId: conversation.id,
        senderId: sergey.user.id,
        text: "Здравствуйте! Работаю в ГРАНД-Смете, база ФЕР-2020, актуальные индексы.",
        readAt: new Date(),
      },
      {
        conversationId: conversation.id,
        senderId: kapitalstroy.id,
        text: "Отлично, договорились. Жду результат в срок.",
        readAt: new Date(),
      },
    ],
  });

  // Recompute ratings from seeded reviews
  for (const ex of [sergey]) {
    const agg = await prisma.review.aggregate({
      where: { targetId: ex.user.id },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await prisma.executorProfile.update({
      where: { userId: ex.user.id },
      data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count.rating },
    });
  }

  console.log("Готово!");
  console.log("—".repeat(50));
  console.log(`Админ:        ${admin.email} / ${DEMO_PASSWORD}`);
  console.log(`Заказчики:    ivan@stroyhub.ru, kapitalstroy@stroyhub.ru / ${DEMO_PASSWORD}`);
  console.log(
    `Исполнители:  alexey@stroyhub.ru, sergey@stroyhub.ru, dmitry@stroyhub.ru, olga@stroyhub.ru, maxim@stroyhub.ru, natalia@stroyhub.ru, igor@stroyhub.ru / ${DEMO_PASSWORD}`
  );
  console.log("—".repeat(50));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
