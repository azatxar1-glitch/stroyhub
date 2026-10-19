"""Проверки корректности данных и расчётов.

Каждая проверка возвращает (уровень, текст): 'error' — расчёт неверен или
данные противоречивы, 'warn' — требует внимания, 'ok' — всё сходится.
"""

from datetime import date

from . import calc, db

_EFFECT = {"income": 1, "debt_draw": 1, "lend_return": 1, "adjustment": 1,
           "expense": -1, "transfer": -1, "debt_payment": -1, "lend": -1}


def _python_balances(conn, as_of):
    """Независимый пересчёт остатков счетов циклом по операциям (без SQL-агрегатов)."""
    accs = {a["id"]: dict(a) for a in conn.execute("SELECT * FROM accounts WHERE opening_date<=?", (as_of,))}
    bal = {i: a["opening_balance"] for i, a in accs.items()}
    for t in conn.execute("SELECT * FROM transactions WHERE status='done' AND date<=?", (as_of,)):
        a = accs.get(t["account_id"])
        if a and t["date"] >= a["opening_date"]:
            bal[a["id"]] += _EFFECT.get(t["kind"], 0) * t["amount"]
        b = accs.get(t["to_account_id"])
        if b and t["kind"] == "transfer" and t["date"] >= b["opening_date"]:
            bal[b["id"]] += t["amount"]
    return bal


def run(conn, ref=None):
    ref = ref or date.today()
    iso = ref.isoformat()
    res = []
    ok = lambda m: res.append(("ok", m))      # noqa: E731
    warn = lambda m: res.append(("warn", m))  # noqa: E731
    err = lambda m: res.append(("error", m))  # noqa: E731

    integrity = conn.execute("PRAGMA integrity_check").fetchone()[0]
    (ok if integrity == "ok" else err)(f"Целостность файла БД: {integrity}")
    fk = conn.execute("PRAGMA foreign_key_check").fetchall()
    (err if fk else ok)(f"Ссылочная целостность: {len(fk)} нарушений" if fk else "Ссылочная целостность: без нарушений")

    # 1. Остатки счетов: SQL против независимого пересчёта
    sql = {a["id"]: a["balance"] for a in calc.account_balances(conn, ref)}
    py = _python_balances(conn, iso)
    bad = [i for i in sql if sql[i] != py.get(i)]
    (err if bad else ok)(f"Остатки счетов расходятся с пересчётом: {bad}" if bad else
                         f"Остатки {len(sql)} счетов совпадают с независимым пересчётом")

    # 2. Тождество денежного потока за текущий месяц:
    # Δ(сумма всех счетов) = доходы + займы + возвраты мне + корректировки
    #                        − потребление − погашение тела долга − выданные займы
    start = ref.replace(day=1)
    prev = date.fromordinal(start.toordinal() - 1)
    total = lambda d: sum(a["balance"] for a in calc.account_balances(conn, d))  # noqa: E731
    opened = conn.execute("SELECT COALESCE(SUM(opening_balance),0) FROM accounts WHERE opening_date BETWEEN ? AND ?",
                          (start.isoformat(), iso)).fetchone()[0]
    f = calc.cash_flow(conn, start, ref)
    delta = total(ref) - total(prev) - opened
    # Операции до даты открытия счёта не меняют его остаток — исключаем их из потока
    ignored = conn.execute(f"""SELECT COALESCE(SUM({calc.ACCOUNT_EFFECT}),0) FROM transactions t
        JOIN accounts a ON a.id=t.account_id WHERE t.status='done' AND t.date BETWEEN ? AND ?
        AND t.date<a.opening_date""", (start.isoformat(), iso)).fetchone()[0]
    ignored += conn.execute("""SELECT COALESCE(SUM(t.amount),0) FROM transactions t JOIN accounts a
        ON a.id=t.to_account_id WHERE t.kind='transfer' AND t.status='done' AND t.date BETWEEN ? AND ?
        AND t.date<a.opening_date""", (start.isoformat(), iso)).fetchone()[0]
    ignored -= conn.execute("""SELECT COALESCE(SUM(t.amount),0) FROM transactions t JOIN accounts a
        ON a.id=t.account_id WHERE t.kind='transfer' AND t.status='done' AND t.date BETWEEN ? AND ?
        AND t.date<a.opening_date""", (start.isoformat(), iso)).fetchone()[0]
    expected = (f["income"] + f["returned_to_me"] + f["borrowed"] + f["adjustments"] - f["expenses"] - f["principal"] - f["lent"] - ignored)
    if delta == expected:
        ok("Денежный поток текущего месяца сходится с изменением остатков счетов")
    else:
        err(f"Денежный поток не сходится: изменение остатков {delta / 100:.2f}, по операциям {expected / 100:.2f}")

    # 3. Чистый капитал = сумма составляющих
    bs = calc.balance_sheet(conn, ref)
    nw = (sum(a["balance"] for a in bs["accounts"]) - sum(d["balance"] for d in bs["debts"])
          + bs["receivable_total"])
    (ok if nw == bs["net_worth"] else err)(
        "Чистый капитал равен сумме счетов − долги + дебиторка" if nw == bs["net_worth"] else
        f"Чистый капитал не сходится: {nw} ≠ {bs['net_worth']}")

    # 4. Правила учёта
    rows = conn.execute("""SELECT t.id FROM transactions t JOIN categories c ON c.id=t.category_id
                           WHERE t.kind IN ('income','expense') AND c.role='service'""").fetchall()
    (err if rows else ok)(f"Служебные категории в доходах/расходах (двойной учёт): операции {[r[0] for r in rows]}"
                          if rows else "Нет двойного учёта: погашения, накопления и возвраты не записаны как расход/доход")
    rows = conn.execute("SELECT id FROM transactions WHERE kind='transfer' AND (to_account_id IS NULL OR to_account_id=account_id)").fetchall()
    if rows:
        err(f"Переводы без счёта зачисления или на тот же счёт: {[r[0] for r in rows]}")
    rows = conn.execute("SELECT id FROM transactions WHERE kind='debt_payment' AND (principal IS NULL OR principal<0 OR principal>amount)").fetchall()
    if rows:
        err(f"Платежи по долгу с некорректной частью основного долга: {[r[0] for r in rows]}")
    for d in calc.debt_balances(conn, ref):
        if d["balance"] < 0:
            err(f"Долг «{d['name']}» отрицательный ({d['balance'] / 100:.2f} ₽) — переплата или ошибка ввода")
        if d["closed"] and d["balance"] > 0:
            warn(f"Долг «{d['name']}» закрыт, но остаток {d['balance'] / 100:.2f} ₽")
    for r in calc.receivable_balances(conn, ref):
        if r["balance"] < 0:
            err(f"Дебиторка «{r['name']}» отрицательная — вернули больше, чем были должны")

    rows = conn.execute("""SELECT t.id FROM transactions t JOIN accounts a ON a.id=t.account_id
                           WHERE t.status='done' AND t.date<a.opening_date""").fetchall()
    if rows:
        warn(f"Операции раньше даты начального остатка счёта (не влияют на остаток): {[r[0] for r in rows]}")
    rows = conn.execute("SELECT id FROM transactions WHERE status='done' AND date>?", (iso,)).fetchall()
    if rows:
        warn(f"Проведённые операции с датой в будущем: {[r[0] for r in rows]}")
    late = [e for e in calc.expected_incomes(conn) if e["date"] < iso]
    if late:
        warn(f"Ожидаемые поступления с прошедшей датой ({len(late)}) — не считаются деньгами; уточните статус")
    for a in bs["accounts"]:
        if a["type"] in db.LIQUID_TYPES + db.RESERVE_TYPES and a["balance"] < 0:
            warn(f"Отрицательный остаток на счёте «{a['name']}»: {a['balance'] / 100:.2f} ₽ — сверьте с банком")
    for d in calc.debt_balances(conn, ref, include_closed=False):
        if d["balance"] > 0 and d["creditor_type"] == "bank" and (d["rate"] is None or d["min_payment"] is None):
            warn(f"Долг «{d['name']}»: неизвестна ставка или минимальный платёж")
    if not any(level != "ok" for level, _ in res):
        ok("Замечаний нет")
    return res


def has_errors(results) -> bool:
    return any(level == "error" for level, _ in results)
