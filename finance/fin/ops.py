"""Создание/изменение записей с проверкой правил учёта.

Главные правила:
* расход — только потребление; погашение основного долга, переводы на свои
  счета (накопления) и выдача денег в долг — отдельные виды операций;
* проценты по долгу = платёж − основной долг, они попадают в расходы
  категории «Кредиты и проценты»;
* ожидаемое поступление — это доход со статусом «запланирована», он не
  меняет баланс, пока не отмечен проведённым.
"""

from datetime import date

from . import db
from .money import MoneyError, parse_money


class ValidationError(ValueError):
    pass


def _date(value, field="Дата", required=True):
    if value in (None, ""):
        if required:
            raise ValidationError(f"{field}: не указана")
        return None
    try:
        return date.fromisoformat(str(value).strip()).isoformat()
    except ValueError:
        raise ValidationError(f"{field}: ожидается дата ГГГГ-ММ-ДД, получено {value!r}") from None


def _money(value, field="Сумма", required=True, allow_zero=False, allow_negative=False):
    if value in (None, ""):
        if required:
            raise ValidationError(f"{field}: не указана")
        return None
    try:
        kop = value if isinstance(value, int) and not isinstance(value, bool) else parse_money(value)
    except MoneyError as e:
        raise ValidationError(f"{field}: {e}") from None
    if kop < 0 and not allow_negative:
        raise ValidationError(f"{field}: не может быть отрицательной")
    if kop == 0 and not allow_zero:
        raise ValidationError(f"{field}: не может быть нулевой")
    return kop


def _int(value, field, lo=None, hi=None, required=False):
    if value in (None, ""):
        if required:
            raise ValidationError(f"{field}: не указано")
        return None
    try:
        n = int(value)
    except (TypeError, ValueError):
        raise ValidationError(f"{field}: ожидается целое число") from None
    if (lo is not None and n < lo) or (hi is not None and n > hi):
        raise ValidationError(f"{field}: допустимо от {lo} до {hi}")
    return n


def _rate(value):
    if value in (None, ""):
        return None
    try:
        r = float(str(value).replace(",", ".").replace("%", "").strip())
    except ValueError:
        raise ValidationError("Ставка: ожидается число, например 21,5") from None
    if not 0 <= r <= 1000:
        raise ValidationError("Ставка: допустимо от 0 до 1000 % годовых")
    return r


def _row(conn, table, id_, label):
    if id_ in (None, ""):
        return None
    row = conn.execute(f"SELECT * FROM {table} WHERE id=?", (int(id_),)).fetchone()
    if row is None:
        raise ValidationError(f"{label}: запись #{id_} не найдена")
    return row


def _text(value):
    return (value or "").strip()


# ---------------------------------------------------------------- операции

KINDS_NEED_ACCOUNT = {"income", "expense", "transfer", "debt_payment", "debt_draw", "lend", "lend_return", "adjustment"}
KINDS_PLANNABLE = {"income", "expense", "transfer", "debt_payment"}


def clean_transaction(conn, data: dict) -> dict:
    """Проверяет и нормализует операцию. Возвращает поля для записи в БД."""
    kind = _text(data.get("kind"))
    if kind not in db.TX_KINDS:
        raise ValidationError(f"Вид операции: неизвестен {kind!r}")
    status = _text(data.get("status")) or "done"
    if status not in db.TX_STATUSES:
        raise ValidationError(f"Статус: неизвестен {status!r}")
    if status == "planned" and kind not in KINDS_PLANNABLE:
        raise ValidationError(f"«{db.TX_KINDS[kind]}» нельзя запланировать — записывайте по факту")

    signed = kind in ("adjustment", "debt_adjust")
    out = {
        "date": _date(data.get("date")),
        "kind": kind,
        "status": status,
        "amount": _money(data.get("amount"), allow_negative=signed),
        "account_id": None, "to_account_id": None, "category_id": None,
        "subcategory": _text(data.get("subcategory")),
        "debt_id": None, "principal": None, "receivable_id": None,
        "goal_id": None, "recurring_id": None,
        "description": _text(data.get("description")),
    }

    account = _row(conn, "accounts", data.get("account_id"), "Счёт")
    if kind in KINDS_NEED_ACCOUNT:
        if account is None:
            raise ValidationError("Счёт: не указан")
        if account["type"] == "asset" and kind != "adjustment":
            raise ValidationError("Со счёта-имущества возможна только корректировка (переоценка)")
        out["account_id"] = account["id"]
    elif account is not None:
        raise ValidationError("Сверка долга не затрагивает счета — уберите счёт")

    goal = _row(conn, "goals", data.get("goal_id"), "Цель")
    out["goal_id"] = goal["id"] if goal else None
    rec = _row(conn, "recurring", data.get("recurring_id"), "Обязательный платёж")
    out["recurring_id"] = rec["id"] if rec else None

    category = _row(conn, "categories", data.get("category_id"), "Категория")

    if kind in ("income", "expense"):
        if category is None:
            raise ValidationError("Категория: не указана")
        if category["kind"] != kind:
            raise ValidationError(f"Категория «{category['name']}» не подходит для вида «{db.TX_KINDS[kind]}»")
        if category["role"] == "service":
            hint = {
                db.CAT_PERSONAL_DEBT: "используйте вид «Платёж по долгу»",
                db.CAT_SAVINGS: "используйте «Перевод между своими счетами» на накопительный счёт",
                db.CAT_LEND_RETURN: "используйте вид «Мне вернули долг»",
            }.get(category["name"], "используйте специальный вид операции")
            raise ValidationError(f"«{category['name']}» — не расход/доход: {hint} (иначе будет двойной учёт)")
        out["category_id"] = category["id"]
    elif category is not None and kind != "transfer":
        raise ValidationError("Категория для этого вида операции ставится автоматически")

    if kind == "transfer":
        to = _row(conn, "accounts", data.get("to_account_id"), "Счёт зачисления")
        if to is None:
            raise ValidationError("Счёт зачисления: не указан")
        if to["id"] == account["id"]:
            raise ValidationError("Перевод на тот же счёт не имеет смысла")
        if to["type"] == "asset":
            raise ValidationError("Покупка имущества — это расход «Покупки» + корректировка счёта-имущества")
        out["to_account_id"] = to["id"]
        if to["type"] in db.RESERVE_TYPES + db.INVEST_TYPES and account["type"] not in db.RESERVE_TYPES + db.INVEST_TYPES:
            out["category_id"] = db.category_id(conn, db.CAT_SAVINGS, "expense")

    if kind in ("debt_payment", "debt_draw", "debt_adjust"):
        debt = _row(conn, "debts", data.get("debt_id"), "Долг")
        if debt is None:
            raise ValidationError("Долг: не указан")
        out["debt_id"] = debt["id"]
        if kind == "debt_payment":
            principal = _money(data.get("principal"), "Основной долг", required=False, allow_zero=True)
            if principal is None:
                principal = out["amount"]
            if principal > out["amount"]:
                raise ValidationError("Основной долг не может превышать сумму платежа")
            out["principal"] = principal
            if debt["creditor_type"] == "person":
                out["category_id"] = db.category_id(conn, db.CAT_PERSONAL_DEBT, "expense")
            else:
                out["category_id"] = db.category_id(conn, db.CAT_INTEREST, "expense")

    if kind == "income":
        # оплата ранее заработанного (зарплата с задержкой, долг заказчика) — это доход,
        # который одновременно закрывает дебиторку
        rcv = _row(conn, "receivables", data.get("receivable_id"), "Дебитор")
        out["receivable_id"] = rcv["id"] if rcv else None
    if kind in ("lend", "lend_return"):
        rcv = _row(conn, "receivables", data.get("receivable_id"), "Дебитор")
        if rcv is None:
            raise ValidationError("Кто должен: не указано")
        out["receivable_id"] = rcv["id"]
        if kind == "lend_return":
            out["category_id"] = db.category_id(conn, db.CAT_LEND_RETURN, "income")
    return out


def _check_limits(conn, tx: dict, exclude_id=None):
    """Нельзя погасить больше, чем осталось долга (иначе отрицательный долг)."""
    from . import calc
    if tx["status"] != "done":
        return
    if tx["kind"] == "debt_payment":
        bal = calc.debt_balance(conn, tx["debt_id"], exclude_tx=exclude_id)
        if tx["principal"] > bal:
            raise ValidationError(
                f"Основной долг {tx['principal'] / 100:.2f} ₽ больше остатка долга {bal / 100:.2f} ₽ — "
                "проверьте сумму или сначала сверьте остаток долга")
    if tx["kind"] == "debt_adjust":
        bal = calc.debt_balance(conn, tx["debt_id"], exclude_tx=exclude_id)
        if bal + tx["amount"] < 0:
            raise ValidationError("После сверки долг стал бы отрицательным")
    if tx["kind"] == "lend_return" or (tx["kind"] == "income" and tx["receivable_id"]):
        bal = calc.receivable_balance(conn, tx["receivable_id"], exclude_tx=exclude_id)
        if tx["amount"] > bal:
            raise ValidationError(f"Возврат больше, чем вам должны ({bal / 100:.2f} ₽)")


TX_FIELDS = ("date", "kind", "status", "amount", "account_id", "to_account_id", "category_id", "subcategory",
             "debt_id", "principal", "receivable_id", "goal_id", "recurring_id", "description")


def add_transaction(conn, data: dict, import_hash=None, commit=True) -> int:
    tx = clean_transaction(conn, data)
    _check_limits(conn, tx)
    cols = TX_FIELDS + ("import_hash",)
    cur = conn.execute(
        f"INSERT INTO transactions({', '.join(cols)}) VALUES ({', '.join('?' * len(cols))})",
        [tx[c] for c in TX_FIELDS] + [import_hash])
    if commit:
        conn.commit()
    return cur.lastrowid


def update_transaction(conn, tx_id: int, data: dict) -> None:
    _row(conn, "transactions", tx_id, "Операция")
    tx = clean_transaction(conn, data)
    _check_limits(conn, tx, exclude_id=tx_id)
    with conn:
        conn.execute(f"UPDATE transactions SET {', '.join(c + '=?' for c in TX_FIELDS)} WHERE id=?",
                     [tx[c] for c in TX_FIELDS] + [tx_id])


def complete_transaction(conn, tx_id: int, actual_date=None, actual_amount=None) -> None:
    """Запланированная → проведённая (например, зарплата пришла)."""
    row = _row(conn, "transactions", tx_id, "Операция")
    if row["status"] != "planned":
        raise ValidationError("Операция не в статусе «запланирована»")
    data = dict(row)
    data["status"] = "done"
    if actual_date:
        data["date"] = actual_date
    if actual_amount not in (None, ""):
        data["amount"] = actual_amount
        if row["kind"] == "debt_payment":
            data["principal"] = None  # пересчитать: по умолчанию весь платёж в основной долг
    update_transaction(conn, tx_id, data)


def delete_transaction(conn, tx_id: int) -> None:
    with conn:
        conn.execute("DELETE FROM transactions WHERE id=?", (int(tx_id),))


# ---------------------------------------------------------------- справочники

def save_account(conn, data: dict, id_=None) -> int:
    name = _text(data.get("name"))
    if not name:
        raise ValidationError("Название счёта: не указано")
    type_ = _text(data.get("type"))
    if type_ not in db.ACCOUNT_TYPES:
        raise ValidationError("Тип счёта: неизвестен")
    vals = (name, type_, _money(data.get("opening_balance") or "0", "Начальный остаток", allow_zero=True,
                                allow_negative=True),
            _date(data.get("opening_date"), "Дата начального остатка"),
            1 if data.get("archived") in (1, "1", "on", True) else 0, _text(data.get("note")))
    return _save(conn, "accounts", ("name", "type", "opening_balance", "opening_date", "archived", "note"), vals, id_)


def save_debt(conn, data: dict, id_=None) -> int:
    name, creditor = _text(data.get("name")), _text(data.get("creditor"))
    if not creditor:
        raise ValidationError("Кредитор: не указан")
    name = name or creditor
    ctype = _text(data.get("creditor_type"))
    if ctype not in db.CREDITOR_TYPES:
        raise ValidationError("Тип кредитора: банк или физическое лицо")
    kind = _text(data.get("kind")) or ("personal" if ctype == "person" else "loan")
    if kind not in db.DEBT_KINDS:
        raise ValidationError("Вид долга: неизвестен")
    vals = (name, creditor, ctype, kind,
            _money(data.get("balance_start"), "Остаток долга", allow_zero=True),
            _date(data.get("start_date"), "Дата остатка"),
            _rate(data.get("rate")),
            _money(data.get("min_payment"), "Минимальный платёж", required=False, allow_zero=True),
            _int(data.get("payment_day"), "День платежа", 1, 31),
            _date(data.get("due_date"), "Срок возврата", required=False),
            _text(data.get("penalty")),
            _int(data.get("priority"), "Приоритет", 1, 10) or 5,
            1 if data.get("closed") in (1, "1", "on", True) else 0,
            _text(data.get("note")))
    return _save(conn, "debts", ("name", "creditor", "creditor_type", "kind", "balance_start", "start_date", "rate",
                                 "min_payment", "payment_day", "due_date", "penalty", "priority", "closed", "note"),
                 vals, id_)


def save_receivable(conn, data: dict, id_=None) -> int:
    debtor = _text(data.get("debtor"))
    if not debtor:
        raise ValidationError("Кто должен: не указано")
    vals = (_text(data.get("name")) or debtor, debtor,
            _money(data.get("amount_start"), "Сумма долга", allow_zero=True),
            _date(data.get("start_date"), "Дата"),
            _date(data.get("due_date"), "Срок возврата", required=False),
            1 if data.get("closed") in (1, "1", "on", True) else 0, _text(data.get("note")))
    return _save(conn, "receivables", ("name", "debtor", "amount_start", "start_date", "due_date", "closed", "note"),
                 vals, id_)


def save_recurring(conn, data: dict, id_=None) -> int:
    name = _text(data.get("name"))
    if not name:
        raise ValidationError("Название платежа: не указано")
    freq = _text(data.get("frequency")) or "monthly"
    if freq not in db.FREQUENCIES:
        raise ValidationError("Периодичность: неизвестна")
    day = _int(data.get("day"), "День", 1, 7 if freq == "weekly" else 31, required=True)
    month = _int(data.get("month"), "Месяц", 1, 12, required=freq == "yearly")
    cat = _row(conn, "categories", data.get("category_id"), "Категория")
    if cat is not None and (cat["kind"] != "expense" or cat["role"] == "service"):
        raise ValidationError("Категория обязательного платежа должна быть категорией расхода")
    vals = (name, _money(data.get("amount")), cat["id"] if cat else None, freq, day, month,
            _date(data.get("start_date"), "Действует с"), _date(data.get("end_date"), "Действует по", required=False),
            0 if data.get("active") in (0, "0", False) else 1, _text(data.get("note")))
    return _save(conn, "recurring", ("name", "amount", "category_id", "frequency", "day", "month", "start_date",
                                     "end_date", "active", "note"), vals, id_)


def save_goal(conn, data: dict, id_=None) -> int:
    name = _text(data.get("name"))
    if not name:
        raise ValidationError("Название цели: не указано")
    kind = _text(data.get("kind"))
    if kind not in db.GOAL_KINDS:
        raise ValidationError("Тип цели: неизвестен")
    months = data.get("months")
    try:
        months = float(str(months).replace(",", ".")) if months not in (None, "") else None
    except ValueError:
        raise ValidationError("Месяцев расходов: ожидается число") from None
    if kind == "cushion" and not months:
        raise ValidationError("Для подушки укажите, на сколько месяцев расходов")
    acc = _row(conn, "accounts", data.get("account_id"), "Счёт")
    vals = (name, kind, _money(data.get("target"), "Целевая сумма", required=False, allow_zero=True), months,
            _date(data.get("target_date"), "Срок", required=False), acc["id"] if acc else None,
            _int(data.get("priority"), "Приоритет", 1, 10) or 5,
            0 if data.get("active") in (0, "0", False) else 1, _text(data.get("note")))
    return _save(conn, "goals", ("name", "kind", "target", "months", "target_date", "account_id", "priority",
                                 "active", "note"), vals, id_)


def set_budget(conn, month: str, category_id, amount) -> None:
    if len(month) != 7:
        raise ValidationError("Месяц: формат ГГГГ-ММ")
    _date(month + "-01", "Месяц")
    cat = _row(conn, "categories", category_id, "Категория")
    if cat is None or cat["kind"] != "expense" or cat["role"] == "service":
        raise ValidationError("Бюджет задаётся только для категорий расходов")
    if amount in (None, ""):
        with conn:
            conn.execute("DELETE FROM budgets WHERE month=? AND category_id=?", (month, cat["id"]))
        return
    kop = _money(amount, "Лимит", allow_zero=True)
    with conn:
        conn.execute("INSERT OR REPLACE INTO budgets VALUES (?,?,?)", (month, cat["id"], kop))


def _save(conn, table, cols, vals, id_):
    import sqlite3
    try:
        with conn:
            if id_:
                _row(conn, table, id_, "Запись")
                conn.execute(f"UPDATE {table} SET {', '.join(c + '=?' for c in cols)} WHERE id=?", (*vals, int(id_)))
                return int(id_)
            cur = conn.execute(f"INSERT INTO {table}({', '.join(cols)}) VALUES ({', '.join('?' * len(cols))})", vals)
            return cur.lastrowid
    except sqlite3.IntegrityError as e:
        if "UNIQUE" in str(e):
            raise ValidationError("Запись с таким названием уже есть") from None
        raise ValidationError(f"Ошибка целостности: {e}") from None


def delete_entity(conn, table, id_) -> None:
    """Удаляет справочную запись, если на неё нет операций."""
    import sqlite3
    if table not in ("accounts", "debts", "receivables", "recurring", "goals"):
        raise ValidationError("Недопустимая таблица")
    try:
        with conn:
            conn.execute(f"DELETE FROM {table} WHERE id=?", (int(id_),))
    except sqlite3.IntegrityError:
        raise ValidationError("На запись ссылаются операции — сначала удалите их или архивируйте/закройте запись") from None
