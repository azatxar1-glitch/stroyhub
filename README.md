# СтройХаб

Marketplace строительных услуг: заказчики размещают заявки, исполнители откликаются, стороны договариваются в чате и доводят заказ до отзыва.

## Стек

- **Frontend**: Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS v4
- **Backend**: Next.js Route Handlers (API), Auth.js (NextAuth v5) с Credentials-провайдером
- **База данных**: Prisma ORM, SQLite для локальной разработки (легко переключить на PostgreSQL)
- **Формы/валидация**: react-hook-form + zod
- **Файлы**: локальное хранилище в `public/uploads`

## Быстрый старт

```bash
npm install
npm run db:push    # создать SQLite базу по schema.prisma
npm run db:seed     # заполнить демо-данными
npm run dev
```

Открыть [http://localhost:3000](http://localhost:3000).

`npm install` уже запускает `prisma generate` через хук `postinstall`.

### Полный сброс базы (пересоздать + заново засеять)

```bash
npm run db:reset
```

### Демо-аккаунты

Сид создаёт админа, двух заказчиков и семь исполнителей, 12 заявок и заказы
на разных стадиях — этого хватает, чтобы пройти весь сценарий локально.

Пароль для всех демо-аккаунтов задаётся переменной `SEED_PASSWORD`; если она
не задана, сид сгенерирует случайный и напечатает его один раз в консоли.

> **Только для локальной разработки.** Не запускайте сид на боевой базе и не
> держите демо-аккаунты в продакшене: это готовые учётные записи с общим
> паролем, включая администратора.

Список email — в `prisma/seed.ts`.

## Environment variables

См. `.env.example`. Для локальной разработки достаточно скопировать его в `.env` — значения по умолчанию уже рабочие для SQLite.

```
DATABASE_URL="file:./dev.db"
AUTH_SECRET="..."
AUTH_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
```

Для продакшена сгенерируйте `AUTH_SECRET` командой `openssl rand -base64 32`.

## Структура

```
prisma/schema.prisma   — модель данных
prisma/seed.ts          — демо-данные
src/lib/auth.ts          — конфигурация Auth.js
src/lib/session.ts        — requireUser/requireRole для API-роутов
src/lib/validations.ts     — zod-схемы
src/app/api/...              — REST API (jobs, proposals, orders, conversations, reviews, admin, ...)
src/app/(pages)               — страницы (каталог, заявки, дашборд, сообщения, админка)
src/proxy.ts                    — защита маршрутов по ролям (Next.js 16 Proxy, ранее «middleware»)
```

## Переключение на PostgreSQL для продакшена

1. В `prisma/schema.prisma` поменять `provider = "sqlite"` на `provider = "postgresql"`.
2. Задать `DATABASE_URL` на реальную БД (например, из Neon/Supabase/RDS).
3. `npx prisma db push` (или `prisma migrate deploy`, если перейти на миграции).
4. Пересеять данные `npm run db:seed`, если нужно.
