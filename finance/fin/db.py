"""Схема SQLite, подключение и начальное заполнение справочников.

Суммы — целые копейки. Даты — ISO-строки YYYY-MM-DD.
"""

import os
import sqlite3
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DB = ROOT / "data" / "finance.db"
SCHEMA_VERSION = 1

ACCOUNT_TYPES = {
    "cash": "Наличные",
    "debit": "Дебетовая карта / текущий счёт",
    "savings": "Накопительный счёт",
    "deposit": "Вклад",
    "investment": "Брокерский / инвестиционный счёт",
    "credit_card": "Кредитная карта",
    "asset": "Имущество (недвижимость, авто)",
}
LIQUID_TYPES = ("cash", "debit")            # фактически доступные деньги
RESERVE_TYPES = ("savings", "deposit")      # подушка / накопления
INVEST_TYPES = ("investment",)

TX_KINDS = {
    "income": "Доход",
    "expense": "Расход",
    "transfer": "Перевод между своими счетами",
    "debt_payment": "Платёж по долгу",
    "debt_draw": "Получен заём / кредит",
    "debt_adjust": "Сверка остатка долга",
    "lend": "Дал в долг",
    "lend_return": "Мне вернули долг",
    "adjustment": "Корректировка / переоценка счёта",
}
TX_STATUSES = {"done": "Проведена", "planned": "Запланирована", "cancelled": "Отменена"}

DEBT_KINDS = {
    "mortgage": "Ипотека",
    "loan": "Кредит",
    "installment": "Рассрочка",
    "microloan": "Микрозаём",
    "personal": "Личный долг",
    "other": "Прочее",
}
CREDITOR_TYPES = {"bank": "Банк / организация", "person": "Физическое лицо"}

GOAL_KINDS = {
    "income": "Доход в месяц",
    "cushion": "Финансовая подушка (мес. расходов)",
    "debt_free": "Погашение долгов",
    "capital": "Чистый капитал",
    "savings": "Накопление на цель",
}

FREQUENCIES = {"monthly": "Ежемесячно", "yearly": "Ежегодно", "weekly": "Еженедельно"}

# role: essential — защищённые расходы (жильё, еда, транспорт, здоровье),
# regular — обычные, service — служебные: не потребление, ставятся автоматически
# видами операций (погашение долга, накопления, возврат долга мне).
EXPENSE_CATEGORIES = [
    ("Ипотека и жильё", "essential"),
    ("Кредиты и проценты", "regular"),
    ("Возврат личных долгов", "service"),
    ("Продукты и питание", "essential"),
    ("Транспорт", "essential"),
    ("Связь и подписки", "regular"),
    ("Здоровье", "essential"),
    ("Покупки", "regular"),
    ("Развлечения", "regular"),
    ("Развитие и обучение", "regular"),
    ("Бизнес", "regular"),
    ("Накопления и инвестиции", "service"),
    ("Азартные игры", "regular"),
    ("Прочее", "regular"),
]
INCOME_CATEGORIES = [
    ("Зарплата", "regular"),
    ("Премии", "regular"),
    ("Подработки", "regular"),
    ("Бизнес", "regular"),
    ("Возвраты долгов", "service"),
    ("Прочие поступления", "regular"),
]
CAT_INTEREST = "Кредиты и проценты"
CAT_PERSONAL_DEBT = "Возврат личных долгов"
CAT_SAVINGS = "Накопления и инвестиции"
CAT_LEND_RETURN = "Возвраты долгов"
CAT_GAMBLING = "Азартные игры"

SCHEMA = """
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('cash','debit','savings','deposit','investment','credit_card','asset')),
    opening_balance INTEGER NOT NULL DEFAULT 0,
    opening_date TEXT NOT NULL,
    archived INTEGER NOT NULL DEFAULT 0,
    note TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('income','expense')),
    role TEXT NOT NULL DEFAULT 'regular' CHECK (role IN ('essential','regular','service')),
    UNIQUE (name, kind)
);

CREATE TABLE IF NOT EXISTS debts (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    creditor TEXT NOT NULL,
    creditor_type TEXT NOT NULL CHECK (creditor_type IN ('bank','person')),
    kind TEXT NOT NULL DEFAULT 'loan',
    balance_start INTEGER NOT NULL CHECK (balance_start >= 0),
    start_date TEXT NOT NULL,
    rate REAL,                 -- годовая ставка, %; NULL = неизвестно
    min_payment INTEGER,       -- NULL = неизвестно / нет графика
    payment_day INTEGER CHECK (payment_day BETWEEN 1 AND 31),
    due_date TEXT,             -- срок полного возврата (для личных долгов)
    penalty TEXT NOT NULL DEFAULT '',
    priority INTEGER NOT NULL DEFAULT 5,   -- 1 = самый важный
    closed INTEGER NOT NULL DEFAULT 0,
    note TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS receivables (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    debtor TEXT NOT NULL,
    amount_start INTEGER NOT NULL CHECK (amount_start >= 0),
    start_date TEXT NOT NULL,
    due_date TEXT,
    closed INTEGER NOT NULL DEFAULT 0,
    note TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS recurring (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    amount INTEGER NOT NULL CHECK (amount > 0),
    category_id INTEGER REFERENCES categories(id),
    frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly','yearly','weekly')),
    day INTEGER NOT NULL,      -- день месяца 1..31, для weekly — день недели 1..7
    month INTEGER,             -- для yearly
    start_date TEXT NOT NULL,
    end_date TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    note TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('income','cushion','debt_free','capital','savings')),
    target INTEGER,            -- NULL = сумма неизвестна
    months REAL,               -- для подушки: сколько месяцев расходов
    target_date TEXT,
    account_id INTEGER REFERENCES accounts(id),
    priority INTEGER NOT NULL DEFAULT 5,
    active INTEGER NOT NULL DEFAULT 1,
    note TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS budgets (
    month TEXT NOT NULL,       -- YYYY-MM
    category_id INTEGER NOT NULL REFERENCES categories(id),
    amount INTEGER NOT NULL CHECK (amount >= 0),
    PRIMARY KEY (month, category_id)
);

CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY,
    date TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('income','expense','transfer','debt_payment','debt_draw',
                                       'debt_adjust','lend','lend_return','adjustment')),
    status TEXT NOT NULL DEFAULT 'done' CHECK (status IN ('done','planned','cancelled')),
    amount INTEGER NOT NULL,
    account_id INTEGER REFERENCES accounts(id),
    to_account_id INTEGER REFERENCES accounts(id),
    category_id INTEGER REFERENCES categories(id),
    subcategory TEXT NOT NULL DEFAULT '',
    debt_id INTEGER REFERENCES debts(id),
    principal INTEGER,         -- часть платежа в погашение основного долга
    receivable_id INTEGER REFERENCES receivables(id),
    goal_id INTEGER REFERENCES goals(id),
    recurring_id INTEGER REFERENCES recurring(id),
    description TEXT NOT NULL DEFAULT '',
    import_hash TEXT UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS tx_date ON transactions(date);
CREATE INDEX IF NOT EXISTS tx_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS tx_debt ON transactions(debt_id);
"""

DEFAULT_GOALS = [
    # Только цели, которые назвал владелец. Неизвестные суммы — NULL.
    ("Доход 200 000 ₽ в месяц", "income", 20_000_000, None, 1, "Этап 1: стабильно, несколько месяцев подряд"),
    ("Доход 400 000–500 000 ₽ в месяц", "income", 40_000_000, None, 4, "Этап 2: нижняя граница 400 000, верхняя 500 000"),
    ("Погасить личные долги и кредиты", "debt_free", 0, None, 2, ""),
    ("Финансовая подушка — 3 месяца расходов", "cushion", None, 3, 3, "Затем расширить до 6 месяцев"),
    ("Рост чистого капитала", "capital", None, None, 5, "Сумма не задана — отслеживается динамика"),
    ("Создание семьи", "savings", None, None, 6, "Сумма неизвестна — задайте, когда будет понятна"),
    ("Улучшение жилищных условий", "savings", None, None, 7, "Сумма неизвестна"),
    ("Покупка автомобиля", "savings", None, None, 8, "Сумма неизвестна"),
]


def db_path() -> Path:
    return Path(os.environ.get("FIN_DB") or DEFAULT_DB)


def connect(path=None) -> sqlite3.Connection:
    p = Path(path or db_path())
    p.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(p)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    init(conn)
    return conn


def init(conn: sqlite3.Connection) -> None:
    conn.executescript(SCHEMA)
    row = conn.execute("SELECT value FROM meta WHERE key='schema_version'").fetchone()
    with conn:
        # категории добавляются и в уже существующие базы (новые категории в новых версиях)
        for name, role in EXPENSE_CATEGORIES:
            conn.execute("INSERT OR IGNORE INTO categories(name, kind, role) VALUES (?, 'expense', ?)", (name, role))
        for name, role in INCOME_CATEGORIES:
            conn.execute("INSERT OR IGNORE INTO categories(name, kind, role) VALUES (?, 'income', ?)", (name, role))
    if row is None:
        with conn:
            conn.execute("INSERT INTO meta VALUES ('schema_version', ?)", (str(SCHEMA_VERSION),))
            conn.execute("INSERT INTO meta VALUES ('created', ?)", (date.today().isoformat(),))
            for name, kind, target, months, prio, note in DEFAULT_GOALS:
                conn.execute(
                    "INSERT INTO goals(name, kind, target, months, priority, note) VALUES (?,?,?,?,?,?)",
                    (name, kind, target, months, prio, note),
                )


def category_id(conn, name, kind) -> int:
    row = conn.execute("SELECT id FROM categories WHERE name=? AND kind=?", (name, kind)).fetchone()
    if row is None:
        raise KeyError(f"Нет категории «{name}» ({kind})")
    return row["id"]


def get_setting(conn, key, default=None):
    row = conn.execute("SELECT value FROM meta WHERE key=?", ("setting:" + key,)).fetchone()
    return row["value"] if row else default


def set_setting(conn, key, value) -> None:
    with conn:
        conn.execute("INSERT OR REPLACE INTO meta VALUES (?, ?)", ("setting:" + key, str(value)))
