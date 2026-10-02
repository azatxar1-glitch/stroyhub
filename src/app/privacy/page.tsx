import type { Metadata } from "next";
import Link from "next/link";
import { operator, hasOperatorDetails, SITE_NAME, POLICY_UPDATED_AT } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Политика конфиденциальности",
  description:
    "Какие персональные данные собирает СтройХаб, зачем они нужны, сколько хранятся и как их удалить.",
};

export default function PrivacyPage() {
  return (
    <div className="container-page max-w-3xl py-10 sm:py-14">
      <header className="border-b border-border pb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Политика конфиденциальности
        </h1>
        <p className="mt-3 text-muted">
          Документ описывает, какие данные собирает {SITE_NAME}, зачем они нужны и что вы можете
          с ними сделать. Редакция от {POLICY_UPDATED_AT}.
        </p>
      </header>

      <div className="mt-10 space-y-10">
        <Section n="1" title="Кто обрабатывает данные">
          {hasOperatorDetails() ? (
            <dl className="space-y-2">
              <Row label="Оператор" value={operator.legalName} />
              {operator.inn && <Row label="ИНН" value={operator.inn} />}
              {operator.ogrn && <Row label="ОГРН" value={operator.ogrn} />}
              {operator.address && <Row label="Адрес" value={operator.address} />}
              <Row label="Для обращений" value={operator.email} />
              {operator.phone && <Row label="Телефон" value={operator.phone} />}
            </dl>
          ) : (
            <P>
              Оператором персональных данных выступает владелец сервиса {SITE_NAME}. Реквизиты
              оператора и адрес для обращений публикуются в этом разделе.
            </P>
          )}
        </Section>

        <Section n="2" title="Какие данные мы собираем">
          <P>Только то, что вы вводите сами, и то, что нужно для работы сервиса:</P>
          <List
            items={[
              "При регистрации: имя или название компании, email, пароль. Пароль хранится в виде необратимого хеша — в открытом виде он не сохраняется и недоступен даже нам.",
              "В профиле по желанию: телефон, город, описание, фотография.",
              "У исполнителей: специализация, опыт, навыки, стоимость услуг, работы в портфолио.",
              "В заявках: описание задачи, город и адрес объекта, срок, бюджет, приложенные файлы.",
              "В ходе работы: отклики, заказы, переписка в чате, отзывы и оценки, жалобы.",
              "Технические данные: IP-адрес и сведения о браузере в журналах сервера, cookie сессии и аналитические cookie Яндекс Метрики.",
            ]}
          />
        </Section>

        <Section n="3" title="Зачем">
          <List
            items={[
              "Чтобы вы могли войти в аккаунт и мы понимали, кому принадлежат заявки и отклики.",
              "Чтобы показывать заявки подходящим исполнителям, а заказчикам — профили специалистов.",
              "Чтобы стороны могли связаться друг с другом и вести переписку по задаче.",
              "Чтобы вести историю заказов, статусы и отзывы.",
              "Чтобы разбирать жалобы и блокировать нарушителей.",
            ]}
          />
          <P>
            Мы не продаём данные, не передаём их рекламным сетям и не используем для рассылок,
            на которые вы не подписывались.
          </P>
        </Section>

        <Section n="4" title="Что видят другие пользователи">
          <P>
            Профиль исполнителя, включая имя, город, специализацию, опыт, портфолио, рейтинг и
            отзывы, открыт публично — в этом смысл каталога. Заявки заказчика видны
            зарегистрированным пользователям.
          </P>
          <P>
            Закрыты: email, пароль, переписка в чате (доступна только участникам диалога) и
            содержимое ваших заказов.
          </P>
        </Section>

        <Section n="5" title="Cookie и статистика посещений">
          <P>
            Технические cookie хранят сессию, чтобы сервис узнавал вас между страницами. Без них
            не работает вход.
          </P>
          <P>
            Аналитические cookie ставит Яндекс Метрика. Она собирает обезличенные сведения о
            посещении: какие страницы открывали, откуда перешли, тип устройства и браузера,
            примерный город по IP-адресу. Это нужно, чтобы понимать, какими разделами
            пользуются, а какие стоит переделать. Запись того, что вы вводите в формы
            (Вебвизор), отключена.
          </P>
          <P>
            Отказаться можно в настройках браузера, запретив cookie, или установив{" "}
            <a
              href="https://yandex.ru/support/metrica/general/opt-out.html"
              className="font-semibold text-accent-text hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              блокировщик Яндекс Метрики
            </a>
            . Сайт продолжит работать — кроме входа в аккаунт, которому нужна сессионная cookie.
          </P>
        </Section>

        <Section n="6" title="Кому передаются данные">
          <P>
            Мы не передаём данные третьим лицам, кроме подрядчиков, обеспечивающих работу
            сервиса: хостинг сайта, база данных, хранилище загруженных файлов и сервис отправки
            писем. Они обрабатывают данные только для размещения сервиса и не используют их в
            своих целях.
          </P>
          <P>
            Отдельно стоит Яндекс Метрика: сведения о посещении сайта попадают в неё напрямую из
            браузера, и Яндекс обрабатывает их как самостоятельный оператор — по{" "}
            <a
              href="https://yandex.ru/legal/confidential/"
              className="font-semibold text-accent-text hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              своей политике
            </a>
            . Данные аккаунта — имя, email, переписку, заявки — Метрика не получает.
          </P>
          <P>
            Данные также могут быть переданы по мотивированному требованию государственных
            органов в случаях, предусмотренных законом.
          </P>
        </Section>

        <Section n="7" title="Сколько храним">
          <P>
            Пока существует ваш аккаунт. После удаления аккаунта профиль и личные данные
            удаляются. Сведения о завершённых заказах и оставленных отзывах могут сохраняться в
            обезличенном виде, поскольку затрагивают вторую сторону сделки.
          </P>
        </Section>

        <Section n="8" title="Ваши права">
          <P>Вы можете в любой момент:</P>
          <List
            items={[
              "посмотреть и изменить свои данные в личном кабинете;",
              "отозвать согласие на обработку и потребовать удалить аккаунт;",
              "запросить, какие именно данные о вас хранятся;",
              "потребовать исправить неточные данные.",
            ]}
          />
          <P>
            {operator.email ? (
              <>
                Для этого напишите на{" "}
                <a href={`mailto:${operator.email}`} className="font-semibold text-accent-text hover:underline">
                  {operator.email}
                </a>
                . Ответ — в течение 30 дней.
              </>
            ) : (
              <>Для этого напишите на адрес для обращений, указанный в разделе 1. Ответ — в течение 30 дней.</>
            )}
          </P>
        </Section>

        <Section n="9" title="Защита">
          <P>
            Соединение с сайтом шифруется (HTTPS). Пароли хранятся хешированными. Доступ к базе
            данных ограничен. При этом ни один сервис не может гарантировать абсолютную
            безопасность, поэтому не публикуйте в заявках и переписке данные, которые не готовы
            раскрыть второй стороне.
          </P>
        </Section>

        <Section n="10" title="Изменения">
          <P>
            Мы можем обновлять политику. Актуальная редакция всегда на этой странице, дата
            указана в начале документа. Существенные изменения мы отметим на сайте.
          </P>
        </Section>
      </div>

      <footer className="mt-12 border-t border-border pt-8">
        <Link href="/" className="text-sm font-semibold text-accent-text hover:underline">
          ← На главную
        </Link>
      </footer>
    </div>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="flex gap-3 text-lg font-bold tracking-tight text-foreground">
        <span className="text-muted tabular-nums">{n}.</span>
        {title}
      </h2>
      <div className="mt-3 space-y-3 pl-0 sm:pl-8">{children}</div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[15px] leading-relaxed text-muted">{children}</p>;
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-muted">
          <span aria-hidden className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-border-strong" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap gap-x-3 text-[15px]">
      <dt className="min-w-36 text-muted">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
