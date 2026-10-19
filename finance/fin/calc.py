"""Финансовые расчёты. Все функции читают БД и возвращают структуры данных
(копейки, даты ISO); оформление — в reports.py и web.py.

Принципы:
* учитываются только проведённые операции (status='done');
* ожидаемые поступления (запланированные доходы) и дебиторка никогда не
  попадают в «доступные деньги»;
* неизвестные значения — None, а не ноль.
"""

import calendar
from datetime import date, timedelta

from . import db
from .money import fmt

# Влияние операции на счёт списания/зачисления (account_id) и на счёт to_account_id.
ACCOUNT_EFFECT = """
    CASE t.kind
        WHEN 'income' THEN t.amount WHEN 'debt_draw' THEN t.amount
        WHEN 'lend_return' THEN t.amount WHEN 'adjustment' THEN t.amount
        WHEN 'expense' THEN -t.amount WHEN 'transfer' THEN -t.amount
        WHEN 'debt_payment' THEN -t.amount WHEN 'lend' THEN -t.amount
        ELSE 0 END
"""


def today():
    return date.today()


def _iso(d):
    return d.isoformat() if isinstance(d, date) else d


def month_bounds(ym: str):
    y, m = map(int, ym.split("-"))
    return date(y, m, 1), date(y, m, calendar.monthrange(y, m)[1])


def add_months(d: date, n: int) -> date:
    y, m = divmod(d.month - 1 + n, 12)
    y += d.year
    return date(y, m + 1, min(d.day, calendar.monthrange(y, m + 1)[1]))


def ym(d: date) -> str:
    return d.strftime("%Y-%m")


# ------------------------------------------------------------------ остатки

def account_balances(conn, as_of=None, include_archived=True):
    as_of = _iso(as_of or today())
    rows = conn.execute(f"""
        SELECT a.*, a.opening_balance
            + COALESCE((SELECT SUM({ACCOUNT_EFFECT}) FROM transactions t
                        WHERE t.account_id=a.id AND t.status='done'
                          AND t.date>=a.opening_date AND t.date<=?), 0)
            + COALESCE((SELECT SUM(t.amount) FROM transactions t
                        WHERE t.to_account_id=a.id AND t.kind='transfer' AND t.status='done'
                          AND t.date>=a.opening_date AND t.date<=?), 0) AS balance
        FROM accounts a WHERE a.opening_date<=? {'' if include_archived else 'AND a.archived=0'}
        ORDER BY a.type, a.name""", (as_of, as_of, as_of)).fetchall()
    return [dict(r) for r in rows]


def debt_balance(conn, debt_id, as_of=None, exclude_tx=None) -> int:
    rows = debt_balances(conn, as_of, only_id=debt_id, exclude_tx=exclude_tx)
    return rows[0]["balance"] if rows else 0


def debt_balances(conn, as_of=None, only_id=None, exclude_tx=None, include_closed=True):
    as_of = _iso(as_of or today())
    where, params = ["d.start_date<=?"], [exclude_tx or -1, as_of, as_of]
    if only_id is not None:
        where.append("d.id=?")
        params.append(int(only_id))
    if not include_closed:
        where.append("d.closed=0")
    rows = conn.execute(f"""
        SELECT d.*, d.balance_start + COALESCE((
            SELECT SUM(CASE t.kind WHEN 'debt_draw' THEN t.amount WHEN 'debt_adjust' THEN t.amount
                                   WHEN 'debt_payment' THEN -t.principal ELSE 0 END)
            FROM transactions t WHERE t.debt_id=d.id AND t.status='done' AND t.id<>?
              AND t.date>=d.start_date AND t.date<=?), 0) AS balance
        FROM debts d WHERE {' AND '.join(where)} ORDER BY d.priority, d.name""", params).fetchall()
    return [dict(r) for r in rows]


def receivable_balance(conn, rid, as_of=None, exclude_tx=None) -> int:
    rows = receivable_balances(conn, as_of, only_id=rid, exclude_tx=exclude_tx)
    return rows[0]["balance"] if rows else 0


def receivable_balances(conn, as_of=None, only_id=None, exclude_tx=None):
    as_of = _iso(as_of or today())
    where, params = ["r.start_date<=?"], [exclude_tx or -1, as_of, as_of]
    if only_id is not None:
        where.append("r.id=?")
        params.append(int(only_id))
    rows = conn.execute(f"""
        SELECT r.*, r.amount_start + COALESCE((
            SELECT SUM(CASE t.kind WHEN 'lend' THEN t.amount WHEN 'lend_return' THEN -t.amount
                                   WHEN 'income' THEN -t.amount ELSE 0 END)
            FROM transactions t WHERE t.receivable_id=r.id AND t.status='done' AND t.id<>?
              AND t.date>=r.start_date AND t.date<=?), 0) AS balance
        FROM receivables r WHERE {' AND '.join(where)} ORDER BY r.due_date IS NULL, r.due_date, r.name""",
        params).fetchall()
    return [dict(r) for r in rows]


def expected_incomes(conn, from_date=None):
    """Запланированные (ещё не полученные) доходы. НЕ являются деньгами."""
    q = """SELECT t.*, c.name AS category, a.name AS account FROM transactions t
           LEFT JOIN categories c ON c.id=t.category_id LEFT JOIN accounts a ON a.id=t.account_id
           WHERE t.kind='income' AND t.status='planned'"""
    params = []
    if from_date:
        q += " AND t.date>=?"
        params.append(_iso(from_date))
    return [dict(r) for r in conn.execute(q + " ORDER BY t.date", params)]


def balance_sheet(conn, as_of=None):
    """Баланс: что есть, сколько должен, сколько должны мне, чистый капитал."""
    as_of = as_of or today()
    accounts = account_balances(conn, as_of)
    debts = [d for d in debt_balances(conn, as_of) if d["balance"] or not d["closed"]]
    rcv = [r for r in receivable_balances(conn, as_of) if r["balance"] or not r["closed"]]

    def total(types):
        return sum(a["balance"] for a in accounts if a["type"] in types)

    cards = [a for a in accounts if a["type"] == "credit_card"]
    card_debt = sum(-a["balance"] for a in cards if a["balance"] < 0)
    card_plus = sum(a["balance"] for a in cards if a["balance"] > 0)
    s = {
        "as_of": _iso(as_of),
        "accounts": accounts,
        "liquid": total(db.LIQUID_TYPES) + card_plus,   # переплата по кредитке — тоже ваши деньги
        "reserve": total(db.RESERVE_TYPES),
        "investments": total(db.INVEST_TYPES),
        "property": total(("asset",)),
        "card_debt": card_debt,
        "debts": debts,
        "bank_debt": sum(d["balance"] for d in debts if d["creditor_type"] == "bank") + card_debt,
        "person_debt": sum(d["balance"] for d in debts if d["creditor_type"] == "person"),
        "receivables": rcv,
        "receivable_total": sum(r["balance"] for r in rcv),
        "expected": expected_incomes(conn),
    }
    s["expected_total"] = sum(e["amount"] for e in s["expected"])
    s["total_debt"] = s["bank_debt"] + s["person_debt"]
    s["financial_assets"] = s["liquid"] + s["reserve"] + s["investments"]
    # Чистый капитал = все активы − все долги. Дебиторка — актив, но не гарантированный,
    # поэтому показываем оба варианта.
    s["net_worth_conservative"] = s["financial_assets"] + s["property"] - s["total_debt"]
    s["net_worth"] = s["net_worth_conservative"] + s["receivable_total"]
    return s


# ------------------------------------------------------------- денежный поток

def cash_flow(conn, start, end):
    start, end = _iso(start), _iso(end)
    q = lambda sql, *p: conn.execute(sql, (start, end, *p)).fetchone()[0] or 0  # noqa: E731
    base = "FROM transactions t WHERE t.status='done' AND t.date BETWEEN ? AND ?"
    joined = ("FROM transactions t JOIN categories c ON c.id=t.category_id "
              "WHERE t.status='done' AND t.date BETWEEN ? AND ?")
    income_rows = conn.execute(f"""SELECT c.name, c.role, SUM(t.amount) s {joined} AND t.kind='income'
                                   GROUP BY c.name ORDER BY s DESC""", (start, end)).fetchall()
    exp_rows = conn.execute(f"""SELECT c.name, c.role, SUM(t.amount) s {joined} AND t.kind='expense'
                                GROUP BY c.name""", (start, end)).fetchall()
    interest = q(f"SELECT SUM(t.amount - t.principal) {base} AND t.kind='debt_payment'")
    expenses = {r["name"]: {"amount": r["s"], "role": r["role"]} for r in exp_rows}
    if interest:
        e = expenses.setdefault(db.CAT_INTEREST, {"amount": 0, "role": "regular"})
        e["amount"] += interest
    expenses = dict(sorted(expenses.items(), key=lambda kv: -kv[1]["amount"]))

    principal_bank = q(f"""SELECT SUM(t.principal) {base} AND t.kind='debt_payment'
                           AND t.debt_id IN (SELECT id FROM debts WHERE creditor_type='bank')""")
    principal_person = q(f"""SELECT SUM(t.principal) {base} AND t.kind='debt_payment'
                             AND t.debt_id IN (SELECT id FROM debts WHERE creditor_type='person')""")
    reserve_types = "','".join(db.RESERVE_TYPES + db.INVEST_TYPES)
    to_savings = q(f"""SELECT SUM(CASE
            WHEN ta.type IN ('{reserve_types}') AND fa.type NOT IN ('{reserve_types}') THEN t.amount
            WHEN fa.type IN ('{reserve_types}') AND ta.type NOT IN ('{reserve_types}') THEN -t.amount
            ELSE 0 END)
        FROM transactions t JOIN accounts fa ON fa.id=t.account_id JOIN accounts ta ON ta.id=t.to_account_id
        WHERE t.status='done' AND t.date BETWEEN ? AND ? AND t.kind='transfer'""")

    f = {
        "start": start, "end": end,
        "income_by_category": [dict(r) for r in income_rows],
        "income": sum(r["s"] for r in income_rows if r["role"] != "service"),
        "returned_to_me": q(f"SELECT SUM(t.amount) {base} AND t.kind='lend_return'"),
        "expenses_by_category": expenses,
        "expenses": sum(v["amount"] for v in expenses.values()),
        "essential": sum(v["amount"] for v in expenses.values() if v["role"] == "essential"),
        "gambling": expenses.get(db.CAT_GAMBLING, {}).get("amount", 0),
        "interest": interest,
        "principal_bank": principal_bank,
        "principal_person": principal_person,
        "principal": principal_bank + principal_person,
        "borrowed": q(f"SELECT SUM(t.amount) {base} AND t.kind='debt_draw'"),
        "lent": q(f"SELECT SUM(t.amount) {base} AND t.kind='lend'"),
        "adjustments": q(f"SELECT SUM(t.amount) {base} AND t.kind='adjustment'"),
        "to_savings": to_savings,
    }
    f["net_operating"] = f["income"] - f["expenses"]                 # доход − потребление
    f["net_after_debt"] = f["net_operating"] - f["principal"]        # и минус погашение тела долга
    f["savings_rate"] = (f["net_operating"] / f["income"]) if f["income"] else None
    days = (date.fromisoformat(end) - date.fromisoformat(start)).days + 1
    f["days"] = days
    f["avg_daily_expense"] = f["expenses"] // days if days else 0
    return f


def month_flow(conn, month: str):
    s, e = month_bounds(month)
    return cash_flow(conn, s, e)


def last_full_months(n, ref=None):
    ref = ref or today()
    first = ref.replace(day=1)
    return [ym(add_months(first, -i)) for i in range(n, 0, -1)]


def tracking_start(conn):
    """Дата начала учёта: самый ранний начальный остаток счёта/долга или операция."""
    row = conn.execute("""SELECT MIN(d) FROM (
        SELECT MIN(opening_date) d FROM accounts UNION ALL SELECT MIN(start_date) FROM debts
        UNION ALL SELECT MIN(start_date) FROM receivables
        UNION ALL SELECT MIN(date) FROM transactions WHERE status='done')""").fetchone()[0]
    return date.fromisoformat(row) if row else None


def tracked_months(conn, months):
    """Оставляет только месяцы, учтённые полностью (начались не раньше начала учёта)."""
    start = tracking_start(conn)
    if start is None:
        return []
    return [m for m in months if month_bounds(m)[0] >= start]


def avg_monthly(conn, key, n=3, ref=None):
    """Среднее значение показателя cash_flow за последние n полных месяцев,
    учитывая только полностью учтённые месяцы. None — таких месяцев нет."""
    months = tracked_months(conn, last_full_months(n, ref))
    if not months:
        return None
    vals = [month_flow(conn, m)[key] for m in months]
    return sum(vals) // len(vals)


# -------------------------------------------------------- обязательные платежи

def _period_key(freq, d: date):
    if freq == "weekly":
        return tuple(d.isocalendar()[:2])
    if freq == "yearly":
        return d.year
    return (d.year, d.month)


def _occurrence_dates(freq, day, month, start: date, end: date):
    out = []
    if freq == "weekly":
        d = start + timedelta(days=(day - start.isoweekday()) % 7)
        while d <= end:
            out.append(d)
            d += timedelta(days=7)
        return out
    cur = start.replace(day=1)
    while cur <= end:
        if freq == "monthly" or cur.month == month:
            d = cur.replace(day=min(day, calendar.monthrange(cur.year, cur.month)[1]))
            if start <= d <= end:
                out.append(d)
        cur = add_months(cur, 1)
    return out


def obligations(conn, start, end, ref=None):
    """Обязательные платежи с датами в [start, end] и статусом оплаты.

    Источники: обязательные платежи (recurring), минимальные платежи по долгам,
    сроки возврата личных долгов, запланированные расходы и платежи."""
    start, end = date.fromisoformat(_iso(start)), date.fromisoformat(_iso(end))
    ref = ref or today()
    items = []
    for r in conn.execute("""SELECT r.*, c.name AS category FROM recurring r
                             LEFT JOIN categories c ON c.id=r.category_id WHERE r.active=1"""):
        rs = max(start, date.fromisoformat(r["start_date"]))
        re_ = min(end, date.fromisoformat(r["end_date"])) if r["end_date"] else end
        for d in _occurrence_dates(r["frequency"], r["day"], r["month"], rs, re_):
            paid = 0
            for t in conn.execute("SELECT date, amount FROM transactions WHERE recurring_id=? AND status='done'",
                                  (r["id"],)):
                if _period_key(r["frequency"], date.fromisoformat(t["date"])) == _period_key(r["frequency"], d):
                    paid += t["amount"]
            items.append({"date": d.isoformat(), "name": r["name"], "amount": r["amount"], "paid": paid,
                          "remaining": max(0, r["amount"] - paid), "source": "recurring", "ref_id": r["id"],
                          "category": r["category"]})
    for d in debt_balances(conn, ref, include_closed=False):
        if d["balance"] <= 0:
            continue
        if d["min_payment"] and d["payment_day"]:
            ds = max(start, date.fromisoformat(d["start_date"]))
            for od in _occurrence_dates("monthly", d["payment_day"], None, ds, end):
                ms, me = month_bounds(ym(od))
                paid = conn.execute("""SELECT COALESCE(SUM(amount),0) FROM transactions WHERE debt_id=?
                    AND kind='debt_payment' AND status='done' AND date BETWEEN ? AND ?""",
                                    (d["id"], ms.isoformat(), me.isoformat())).fetchone()[0]
                amount = min(d["min_payment"], d["balance"] + paid) if d["kind"] != "mortgage" else d["min_payment"]
                items.append({"date": od.isoformat(), "name": f"Платёж: {d['name']}", "amount": amount,
                              "paid": paid, "remaining": max(0, amount - paid), "source": "debt",
                              "ref_id": d["id"], "category": db.DEBT_KINDS.get(d["kind"], "")})
        elif d["due_date"] and start <= date.fromisoformat(d["due_date"]) <= end:
            items.append({"date": d["due_date"], "name": f"Срок возврата: {d['name']}", "amount": d["balance"],
                          "paid": 0, "remaining": d["balance"], "source": "debt_due", "ref_id": d["id"],
                          "category": "Личный долг" if d["creditor_type"] == "person" else ""})
    for t in conn.execute("""SELECT t.*, c.name AS category, d.name AS debt FROM transactions t
                             LEFT JOIN categories c ON c.id=t.category_id LEFT JOIN debts d ON d.id=t.debt_id
                             WHERE t.status='planned' AND t.kind IN ('expense','debt_payment','transfer')
                               AND t.date BETWEEN ? AND ?""", (start.isoformat(), end.isoformat())):
        if t["kind"] == "transfer":
            continue  # перевод на свои счета не уменьшает ваши деньги
        label = ": ".join(x for x in (t["debt"], t["description"]) if x) or t["category"] or "План"
        items.append({"date": t["date"], "name": label,
                      "amount": t["amount"], "paid": 0, "remaining": t["amount"], "source": "planned",
                      "ref_id": t["id"], "category": t["category"]})
    items.sort(key=lambda i: (i["date"], i["name"]))
    return items


def monthly_obligation_load(conn, ref=None):
    """Сумма обязательных платежей на месяц в пересчёте (weekly ×52/12, yearly /12)."""
    total = 0
    for r in conn.execute("SELECT * FROM recurring WHERE active=1"):
        if r["end_date"] and r["end_date"] < _iso(ref or today()):
            continue
        total += {"monthly": r["amount"], "yearly": r["amount"] // 12, "weekly": r["amount"] * 52 // 12}[r["frequency"]]
    for d in debt_balances(conn, ref, include_closed=False):
        if d["balance"] > 0 and d["min_payment"]:
            total += min(d["min_payment"], d["balance"])
    return total


def overdue(conn, ref=None, lookback_months=2):
    ref = ref or today()
    start = add_months(ref.replace(day=1), -lookback_months)
    month_start = ref.replace(day=1).isoformat()
    # Регулярные платежи привязываются к операциям по желанию, поэтому их просрочку
    # смотрим только в текущем месяце; платежи по долгам привязаны всегда — смотрим глубже.
    return [o for o in obligations(conn, start, ref - timedelta(days=1), ref) if o["remaining"] > 0
            and (o["source"] != "recurring" or o["date"] >= month_start)]


# ---------------------------------------------------------- прогноз до дохода

def daily_spending(conn, ref=None, window=60):
    """Средние ежедневные переменные расходы (без обязательных платежей,
    привязанных к графику). None — меньше 14 дней истории."""
    ref = ref or today()
    first = conn.execute("SELECT MIN(date) FROM transactions WHERE status='done' AND kind='expense'").fetchone()[0]
    if not first:
        return None
    start = max(date.fromisoformat(first), ref - timedelta(days=window))
    days = (ref - start).days
    if days < 14:
        return None
    rows = conn.execute("""SELECT c.role, SUM(t.amount) s FROM transactions t JOIN categories c ON c.id=t.category_id
        WHERE t.status='done' AND t.kind='expense' AND t.recurring_id IS NULL AND t.date>=? AND t.date<?
        GROUP BY c.role""", (start.isoformat(), ref.isoformat())).fetchall()
    by_role = {r["role"]: r["s"] for r in rows}
    total = sum(by_role.values())
    return {"days": days, "since": start.isoformat(), "total": total // days,
            "essential": by_role.get("essential", 0) // days, "other": by_role.get("regular", 0) // days}


def budget_daily(conn, d: date):
    """Повседневные траты в день по месячным лимитам бюджета; None — лимиты не заданы."""
    lim = conn.execute("""SELECT COALESCE(SUM(b.amount),0), COUNT(*) FROM budgets b
        JOIN categories c ON c.id=b.category_id WHERE b.month=? AND c.role<>'service'""", (ym(d),)).fetchone()
    return lim[0] // calendar.monthrange(d.year, d.month)[1] if lim[1] else None


def forecast(conn, ref=None):
    ref = ref or today()
    bs = balance_sheet(conn, ref)
    upcoming = expected_incomes(conn, ref)
    late_income = [e for e in expected_incomes(conn) if e["date"] < ref.isoformat()]
    nxt = upcoming[0] if upcoming else None
    horizon_known = nxt is not None
    horizon = date.fromisoformat(nxt["date"]) if nxt else ref + timedelta(days=30)
    days = max(1, (horizon - ref).days)
    late = overdue(conn, ref)
    ahead = [o for o in obligations(conn, ref, horizon - timedelta(days=1), ref) if o["remaining"] > 0]
    obl_total = sum(o["remaining"] for o in late + ahead)
    spend = daily_spending(conn, ref)
    available = bs["liquid"]
    free = available - obl_total
    f = {
        "ref": ref.isoformat(), "available": available, "next_income": nxt, "horizon": horizon.isoformat(),
        "horizon_known": horizon_known, "days": days, "overdue": late, "ahead": ahead,
        "obligations_total": obl_total, "free": free, "daily_allowance": free // days,
        "spending": spend, "late_income": late_income,
        "expected_not_counted": sum(e["amount"] for e in expected_incomes(conn)),
    }
    f["spend_basis"] = "history" if spend else None
    if spend:
        f["projected_spend"] = spend["total"] * days
    else:
        rates = [budget_daily(conn, ref + timedelta(days=i)) for i in range(days)]
        if all(r is not None for r in rates):
            f["projected_spend"] = sum(rates)
            f["spend_basis"] = "budget"
            f["budget_daily"] = rates[0]
        else:
            f["projected_spend"] = None
    f["projected_end"] = free - f["projected_spend"] if f["projected_spend"] is not None else None
    f["cash_gap"] = free < 0 or (f["projected_end"] is not None and f["projected_end"] < 0)
    f["gap_unknown"] = not f["cash_gap"] and f["projected_end"] is None
    return f


def daily_series(conn, ref=None, days_ahead=None):
    """Ожидаемый остаток доступных денег по дням до следующего дохода
    (обязательные платежи по датам + средние переменные расходы)."""
    f = forecast(conn, ref)
    ref = date.fromisoformat(f["ref"])
    n = days_ahead or f["days"]
    per_day = f["spending"]["total"] if f["spending"] else 0
    bal = f["available"] - sum(o["remaining"] for o in f["overdue"])
    by_date = {}
    for o in f["ahead"]:
        by_date[o["date"]] = by_date.get(o["date"], 0) + o["remaining"]
    out = []
    for i in range(n):
        d = (ref + timedelta(days=i)).isoformat()
        bal -= by_date.get(d, 0) + per_day
        out.append((d, bal))
    return out


def cash_plan(conn, until, ref=None, basis="auto"):
    """План денег по дням до даты `until` через несколько выплат.

    В отличие от forecast() учитывает ожидаемые доходы — но как ПЛАН: рядом всегда
    считается вариант «если ожидаемые доходы не придут». Повседневные траты — по
    истории (≥ 14 дней), иначе по месячным лимитам бюджета (лимит / дней в месяце)."""
    ref = ref or today()
    until = date.fromisoformat(_iso(until))
    if until < ref:
        raise ValueError("Дата плана раньше начальной даты")
    events = []
    for o in overdue(conn, ref):
        events.append({"date": ref.isoformat(), "name": "Просрочено: " + o["name"], "amount": -o["remaining"],
                       "kind": "obligation"})
    for o in obligations(conn, ref, until, ref):
        if o["remaining"] > 0:
            events.append({"date": o["date"], "name": o["name"], "amount": -o["remaining"], "kind": "obligation"})
    for e in expected_incomes(conn, ref):
        if e["date"] <= until.isoformat():
            events.append({"date": e["date"], "name": e["description"] or e["category"] or "Доход",
                           "amount": e["amount"], "kind": "income"})
    events.sort(key=lambda e: (e["date"], e["kind"] != "income"))
    if basis not in ("auto", "history", "budget"):
        raise ValueError("basis: auto, history или budget")
    spend = daily_spending(conn, ref) if basis != "budget" else None
    if basis == "history" and spend is None:
        raise ValueError("Для плана по истории нужно ≥ 14 дней истории расходов")
    budgets = {}

    def life_rate(d):
        if spend:
            return spend["total"]
        if ym(d) not in budgets:
            budgets[ym(d)] = budget_daily(conn, d)
        return budgets[ym(d)]

    start = balance_sheet(conn, ref)["liquid"]
    bal = bal_cash = start
    by_date = {}
    for e in events:
        by_date.setdefault(e["date"], []).append(e)
    days, life_total, life_unknown = [], 0, False
    d = ref
    while d <= until:
        iso = d.isoformat()
        for e in by_date.get(iso, []):
            bal += e["amount"]
            if e["kind"] != "income":
                bal_cash += e["amount"]
        rate = life_rate(d)
        if rate is None:
            life_unknown = True
            rate = 0
        bal -= rate
        bal_cash -= rate
        life_total += rate
        days.append({"date": iso, "balance": bal, "cash_only": bal_cash})
        d += timedelta(days=1)
    low = min(days, key=lambda x: x["balance"])
    negative = []  # периоды, когда план уходит в минус: [начало, конец, худший остаток]
    for x in days:
        if x["balance"] < 0:
            if negative and negative[-1][1] == (date.fromisoformat(x["date"]) - timedelta(days=1)).isoformat():
                negative[-1][1] = x["date"]
                negative[-1][2] = min(negative[-1][2], x["balance"])
            else:
                negative.append([x["date"], x["date"], x["balance"]])
    neg = next((x["date"] for x in days if x["balance"] < 0), None)
    neg_cash = next((x["date"] for x in days if x["cash_only"] < 0), None)
    return {"ref": ref.isoformat(), "until": until.isoformat(), "start": start, "events": events, "days": days,
            "income": sum(e["amount"] for e in events if e["kind"] == "income"),
            "obligations": -sum(e["amount"] for e in events if e["kind"] != "income"),
            "life": life_total, "life_basis": "история трат" if spend else "лимиты бюджета",
            "life_unknown": life_unknown, "end": days[-1]["balance"], "low": low, "negative": negative,
            "first_negative": neg, "cash_only_negative": neg_cash}


# --------------------------------------------------------------- долги: план

def debt_order(debts, ref=None):
    """Порядок досрочного погашения: просроченные → приоритет владельца →
    ставка (неизвестная ставка — в конце, с пометкой) → меньший остаток."""
    ref = (ref or today()).isoformat()

    def key(d):
        overdue_ = 0 if (d.get("due_date") and d["due_date"] < ref) or d.get("overdue") else 1
        return (overdue_, d["priority"], d["rate"] is None, -(d["rate"] or 0), d["balance"])
    return sorted([d for d in debts if d["balance"] > 0], key=key)


def simulate_payoff(debts, extra=0, strategy="avalanche", max_months=600):
    """Помесячная модель: проценты = остаток × ставка / 12; платим минимумы,
    свободные деньги (extra + минимумы закрытых долгов) — в первый долг по порядку.
    Неизвестная ставка считается 0 % (результат помечается как заниженный)."""
    ds = [{"id": d["id"], "name": d["name"], "bal": d["balance"], "rate": d["rate"] or 0,
           "min": d["min_payment"] or 0, "priority": d["priority"], "rate_unknown": d["rate"] is None,
           "month_done": None, "interest": 0} for d in debts if d["balance"] > 0]
    if strategy == "snowball":
        ds.sort(key=lambda d: (d["bal"], d["priority"]))
    elif strategy == "priority":
        ds.sort(key=lambda d: (d["priority"], d["rate_unknown"], -d["rate"], d["bal"]))
    else:  # avalanche: строго по ставке, неизвестная — в конце
        ds.sort(key=lambda d: (d["rate_unknown"], -d["rate"], d["bal"]))
    budget = sum(d["min"] for d in ds) + extra
    if not ds:
        return {"months": 0, "debts": [], "total_interest": 0, "feasible": True, "budget": budget}
    month = 0
    while any(d["bal"] > 0 for d in ds) and month < max_months:
        month += 1
        for d in ds:
            if d["bal"] > 0:
                i = round(d["bal"] * d["rate"] / 1200)
                d["bal"] += i
                d["interest"] += i
        left = budget
        for d in ds:
            if d["bal"] > 0:
                p = min(d["min"], d["bal"], left)
                d["bal"] -= p
                left -= p
        for d in ds:
            if d["bal"] > 0 and left > 0:
                p = min(d["bal"], left)
                d["bal"] -= p
                left -= p
        for d in ds:
            if d["bal"] == 0 and d["month_done"] is None:
                d["month_done"] = month
    feasible = all(d["bal"] == 0 for d in ds)
    return {"months": month if feasible else None, "feasible": feasible, "budget": budget,
            "total_interest": sum(d["interest"] for d in ds), "debts": ds,
            "rate_unknown": any(d["rate_unknown"] for d in ds)}


def debt_details(conn, ref=None):
    ref = ref or today()
    late = overdue(conn, ref, lookback_months=3)
    late_by_debt = {}
    for o in late:
        if o["source"] in ("debt", "debt_due"):
            late_by_debt.setdefault(o["ref_id"], []).append(o)
    out = []
    for d in debt_balances(conn, ref):
        hist = [dict(r) for r in conn.execute(
            """SELECT date, kind, amount, principal, description FROM transactions
               WHERE debt_id=? AND status='done' ORDER BY date DESC""", (d["id"],))]
        lo = late_by_debt.get(d["id"], [])
        d["overdue"] = sum(o["remaining"] for o in lo)
        d["overdue_days"] = (ref - date.fromisoformat(min(o["date"] for o in lo))).days if lo else 0
        d["history"] = hist
        d["paid_total"] = sum(h["amount"] for h in hist if h["kind"] == "debt_payment")
        d["principal_paid"] = sum(h["principal"] or 0 for h in hist if h["kind"] == "debt_payment")
        d["monthly_interest"] = round(d["balance"] * d["rate"] / 1200) if d["rate"] is not None else None
        out.append(d)
    return out


# ------------------------------------------------------------- распределение

ALLOCATION_RULES = """\
Правила распределения свободного остатка (после обязательных платежей,
защищённых расходов на жильё/еду/транспорт/здоровье до следующего дохода
и страхового буфера 10 % от них):
1) просроченные платежи по долгам гасятся в первую очередь;
2) подушка < 1 мес. расходов: 40 % резерв, 40 % долги, 20 % личные траты;
3) подушка 1–3 мес.: 50 % долги, 30 % резерв, 20 % личные траты;
4) подушка ≥ 3 мес. и есть долги (кроме ипотеки): 70 % долги, 10 % резерв, 20 % личные траты;
5) подушка ≥ 3 мес. и долгов нет (или только ипотека): 50 % капитал, 30 % резерв до 6 мес., 20 % личные траты.
Без долгов доля «долги» уходит в резерв. Инвестиции не предлагаются, пока не
выполнено правило 5."""


def allocate(conn, ref=None):
    """План распределения денег до следующего дохода — по шагам, с арифметикой."""
    ref = ref or today()
    f = forecast(conn, ref)
    bs = balance_sheet(conn, ref)
    steps, warnings = [], []
    available = f["available"]
    steps.append(("Фактически доступно (наличные + карты)", available))
    obl = f["obligations_total"]
    steps.append(("− Обязательные платежи до " + f["horizon"] + (" (дата дохода)" if f["horizon_known"] else
                                                                 " (дата дохода не задана — горизонт 30 дней)"), -obl))
    spend = f["spending"]
    if spend:
        essential = spend["essential"] * f["days"]
        basis = f"средние {fmt(spend['essential'])}/день × {f['days']} дн. за последние {spend['days']} дн."
    else:
        b = month_budget(conn, ym(ref))
        ess_budget = sum(r["limit"] or 0 for r in b["rows"] if r["role"] == "essential")
        if ess_budget:
            dim = calendar.monthrange(ref.year, ref.month)[1]
            essential = ess_budget * f["days"] // dim
            basis = f"бюджет защищённых категорий {fmt(ess_budget)}/мес × {f['days']}/{dim}"
        else:
            essential = None
            basis = "неизвестно: нет истории расходов ≥ 14 дней и не задан бюджет на жильё/еду/транспорт/здоровье"
    if essential is None:
        warnings.append("Защищённые расходы неизвестны — распределять свободные деньги на долги и накопления "
                        "рано. Задайте бюджет на месяц (раздел «Бюджет») или ведите учёт 2 недели.")
        steps.append(("− Защищённые расходы (жильё, еда, транспорт, здоровье): " + basis, None))
        return {"forecast": f, "steps": steps, "free": None, "allocation": [], "warnings": warnings,
                "daily_budget": f["daily_allowance"], "rules": ALLOCATION_RULES}
    steps.append(("− Защищённые расходы: " + basis, -essential))
    buffer = (obl + essential) // 10
    steps.append(("− Страховой буфер 10 % от обязательных и защищённых", -buffer))
    free = available - obl - essential - buffer
    steps.append(("= Свободный остаток", free))

    alloc = []
    if free <= 0:
        warnings.append("Свободного остатка нет: досрочное погашение и накопления не планируются. "
                        + ("Денег не хватает даже на обязательное — риск кассового разрыва." if available - obl - essential < 0
                           else "Буфер частично съеден обязательными расходами."))
    else:
        debts = debt_details(conn, ref)
        open_debts = [d for d in debts if d["balance"] > 0 and not d["closed"]]
        non_mortgage = [d for d in open_debts if d["kind"] != "mortgage"]
        base = expense_base(conn, ref)
        cushion = (bs["reserve"] / base) if base else None
        left = free
        late_debts = [d for d in open_debts if d["overdue"] > 0]
        for d in late_debts:
            p = min(left, d["overdue"])
            if p > 0:
                alloc.append({"to": f"Просрочка: {d['name']}", "amount": p, "kind": "debt", "debt_id": d["id"]})
                left -= p
        if cushion is None:
            warnings.append("Размер подушки в месяцах неизвестен (нет данных о расходах) — считаю её < 1 мес.")
        c = cushion or 0
        if c < 1:
            shares, rule = {"reserve": 40, "debt": 40, "life": 20}, 2
        elif c < 3:
            shares, rule = {"debt": 50, "reserve": 30, "life": 20}, 3
        elif non_mortgage:
            shares, rule = {"debt": 70, "reserve": 10, "life": 20}, 4
        else:
            shares, rule = {"capital": 50, "reserve": 30, "life": 20}, 5
        if not open_debts and "debt" in shares:
            shares["reserve"] += shares.pop("debt")
        pool, parts = left, {}
        for k, pct in shares.items():
            parts[k] = pool * pct // 100
        parts["life"] += pool - sum(parts.values())  # копейки от округления — в личные траты
        if parts.get("debt"):
            rest = parts["debt"]
            for d in debt_order(non_mortgage or open_debts, ref):
                if rest <= 0:
                    break
                p = min(rest, d["balance"] - (d["overdue"] if d in late_debts else 0))
                if p > 0:
                    rate = f"{d['rate']:g} %" if d["rate"] is not None else "ставка неизвестна"
                    alloc.append({"to": f"Досрочно: {d['name']} ({rate})", "amount": p, "kind": "debt",
                                  "debt_id": d["id"]})
                    rest -= p
            parts["reserve"] = parts.get("reserve", 0) + rest
        if parts.get("reserve"):
            alloc.append({"to": "Резерв / подушка (перевод на накопительный счёт)", "amount": parts["reserve"],
                          "kind": "reserve"})
        if parts.get("capital"):
            alloc.append({"to": "Капитал (долгосрочные накопления/инвестиции)", "amount": parts["capital"],
                          "kind": "capital"})
        alloc.append({"to": "Личные (необязательные) траты до дохода", "amount": parts["life"], "kind": "life"})
        steps.append((f"Применено правило {rule}" + (f"; подушка {c:.1f} мес." if cushion is not None else ""), None))
    life = sum(a["amount"] for a in alloc if a["kind"] == "life")
    daily = (essential + life) // f["days"]
    return {"forecast": f, "steps": steps, "free": free, "allocation": alloc, "warnings": warnings,
            "daily_budget": daily, "essential": essential, "buffer": buffer, "rules": ALLOCATION_RULES}


# ----------------------------------------------------------------- бюджет

def month_budget(conn, month):
    flow = month_flow(conn, month)
    limits = {r["category_id"]: r["amount"] for r in conn.execute("SELECT * FROM budgets WHERE month=?", (month,))}
    first = date.fromisoformat(month + "-01")
    prev = tracked_months(conn, [ym(add_months(first, -i)) for i in (3, 2, 1)])
    hist = [month_flow(conn, m)["expenses_by_category"] for m in prev]
    rows = []
    for c in conn.execute("SELECT * FROM categories WHERE kind='expense' AND role<>'service' ORDER BY id"):
        fact = flow["expenses_by_category"].get(c["name"], {}).get("amount", 0)
        avg = sum(h.get(c["name"], {}).get("amount", 0) for h in hist) // len(hist) if hist else None
        lim = limits.get(c["id"])
        rows.append({"category_id": c["id"], "category": c["name"], "role": c["role"], "limit": lim, "fact": fact,
                     "left": (lim - fact) if lim is not None else None, "avg3": avg})
    s, e = month_bounds(month)
    obl = obligations(conn, s, e)
    return {"month": month, "rows": rows, "flow": flow, "obligations": obl,
            "obligations_total": sum(o["amount"] for o in obl),
            "limit_total": sum(r["limit"] for r in rows if r["limit"] is not None),
            "fact_total": sum(r["fact"] for r in rows)}


# ------------------------------------------------------------------- цели

def expense_base(conn, ref=None):
    """Месячная база для подушки: средние (потребление без азартных игр + погашение
    тела долга) за 3 полных месяца; если истории нет — обязательные платежи + бюджет месяца."""
    e = avg_monthly(conn, "expenses", ref=ref)
    p = avg_monthly(conn, "principal", ref=ref)
    if e:
        # подушка покрывает жизнь и обязательства, а не азартные игры
        return e - (avg_monthly(conn, "gambling", ref=ref) or 0) + (p or 0)
    ref = ref or today()
    budget = conn.execute("""SELECT COALESCE(SUM(b.amount),0) FROM budgets b JOIN categories c ON c.id=b.category_id
                             WHERE b.month=? AND c.role<>'service'""", (ym(ref),)).fetchone()[0]
    return (monthly_obligation_load(conn, ref) + budget) or None


def _eta(remaining, per_month, ref):
    if remaining is None:
        return None, "неизвестно"
    if remaining <= 0:
        return 0, "достигнута"
    if not per_month or per_month <= 0:
        return None, "при текущем темпе не достигается"
    months = -(-remaining // per_month)
    return months, add_months(ref, months).strftime("%m.%Y")


def goals_progress(conn, ref=None):
    ref = ref or today()
    bs = balance_sheet(conn, ref)
    out = []
    for g in conn.execute("SELECT * FROM goals WHERE active=1 ORDER BY priority, id"):
        g = dict(g)
        cur = target = per_month = None
        details = []
        if g["kind"] == "income":
            last = month_flow(conn, last_full_months(1, ref)[0])["income"]
            mtd = cash_flow(conn, ref.replace(day=1), ref)["income"]
            avg3 = avg_monthly(conn, "income", ref=ref)
            target, cur = g["target"], last
            hits = sum(1 for m in last_full_months(3, ref) if g["target"] and month_flow(conn, m)["income"] >= g["target"])
            details = [f"прошлый месяц: {fmt(last)}",
                       f"текущий месяц пока: {fmt(mtd)}",
                       "среднее за 3 мес.: " + (f"{fmt(avg3)}" if avg3 is not None else "неизвестно"),
                       f"месяцев с целевым доходом из 3: {hits}"]
            g["eta"] = "—"
        elif g["kind"] == "cushion":
            base = expense_base(conn, ref)
            cur = bs["reserve"] if not g["account_id"] else _acc_balance(bs, g["account_id"])
            target = int(base * g["months"]) if base else None
            per_month = _avg_reserve_inflow(conn, ref)
            details = ["месячная база расходов: " + (f"{fmt(base)}" if base else "неизвестно"),
                       f"сейчас покрыто: {cur / base:.1f} мес." if base else "покрытие: неизвестно"]
        elif g["kind"] == "debt_free":
            cur = bs["total_debt"]
            target = 0
            paid3 = avg_monthly(conn, "principal", ref=ref)
            borrowed3 = avg_monthly(conn, "borrowed", ref=ref) or 0
            per_month = (paid3 - borrowed3) if paid3 is not None else None
            details = [f"банкам: {fmt(bs['bank_debt'])}",
                       f"физлицам: {fmt(bs['person_debt'])}",
                       "темп погашения тела долга: " + (f"{fmt(per_month)}/мес"
                                                        if per_month is not None else "неизвестно")]
            months, when = _eta(cur, per_month, ref)
            if not conn.execute("SELECT 1 FROM debts").fetchone() and not bs["card_debt"]:
                cur, months, when = None, None, "долги не внесены"
            g.update(current=cur, target=0, pct=None, eta=when, eta_months=months, details=details)
            out.append(g)
            continue
        elif g["kind"] == "capital":
            cur, target = bs["net_worth"], g["target"]
            start = tracking_start(conn)
            base_date = max(add_months(ref, -3), start) if start else ref
            months_ = (ref - base_date).days / 30.44
            per_month = int((cur - balance_sheet(conn, base_date)["net_worth"]) / months_) \
                if months_ >= 1 else None
            month_start = max(ref.replace(day=1), start) if start else ref
            prev1 = balance_sheet(conn, month_start - timedelta(days=1))["net_worth"]
            details = [f"изменение с начала месяца: {fmt(cur - prev1, sign=True)}" if start and start < ref.replace(day=1)
                       else "изменение с начала месяца: неизвестно (учёт начат в этом месяце)",
                       "средний прирост: " + (f"{fmt(per_month, sign=True)}/мес" if per_month is not None
                                              else "неизвестно (меньше месяца учёта)")]
        else:  # savings
            target = g["target"]
            if g["account_id"]:
                cur = _acc_balance(bs, g["account_id"])
                per_month = _avg_account_change(conn, g["account_id"], ref)
            else:
                cur = conn.execute("""SELECT COALESCE(SUM(amount),0) FROM transactions
                                      WHERE goal_id=? AND status='done' AND kind='transfer'""", (g["id"],)).fetchone()[0]
                details.append("учитываются переводы с пометкой этой цели")
            if target is None:
                details.append("целевая сумма неизвестна — задайте её")
        g["current"], g["target"] = cur, target
        g["pct"] = (min(100.0, cur * 100 / target) if target else None) if cur is not None and target else None
        if g["kind"] != "income":
            months, when = _eta(None if target is None else target - (cur or 0), per_month, ref)
            g["eta"], g["eta_months"] = when, months
        g["details"] = details
        out.append(g)
    return out


def _acc_balance(bs, acc_id):
    return next((a["balance"] for a in bs["accounts"] if a["id"] == acc_id), 0)


def _avg_reserve_inflow(conn, ref):
    return avg_monthly(conn, "to_savings", ref=ref)


def _avg_account_change(conn, acc_id, ref):
    first = ref.replace(day=1)
    if len(tracked_months(conn, last_full_months(3, ref))) < 3:
        return None
    now = next((a["balance"] for a in account_balances(conn, first - timedelta(days=1)) if a["id"] == acc_id), 0)
    before = next((a["balance"] for a in account_balances(conn, add_months(first, -3) - timedelta(days=1))
                   if a["id"] == acc_id), 0)
    return (now - before) // 3 or None


def net_worth_history(conn, months=12, ref=None):
    ref = ref or today()
    out = []
    start = tracking_start(conn)
    for i in range(months - 1, -1, -1):
        end = month_bounds(ym(add_months(ref.replace(day=1), -i)))[1]
        end = min(end, ref)
        if start is None or end < start:
            continue
        b = balance_sheet(conn, end)
        out.append({"month": ym(end), "net_worth": b["net_worth"], "debt": b["total_debt"],
                    "financial_assets": b["financial_assets"]})
    return out


# ------------------------------------------------------------------- аудит

def leaks(conn, ref=None):
    """Утечки и что можно сократить без потери качества жизни."""
    ref = ref or today()
    out = []
    g30 = _category_spent(conn, db.CAT_GAMBLING, ref - timedelta(days=30), ref)
    if g30:
        out.append(f"Азартные игры за 30 дней: {fmt(g30)} — самая дорогая утечка: это деньги, которые не вернутся "
                   "и не дают ничего взамен")
    last = last_full_months(1, ref)[0]
    lf = month_flow(conn, last)["expenses_by_category"] if tracked_months(conn, [last]) else {}
    prev = [month_flow(conn, m)["expenses_by_category"] for m in tracked_months(conn, last_full_months(4, ref)[:3])]
    for name, v in lf.items():
        avg = sum(p.get(name, {}).get("amount", 0) for p in prev) // len(prev) if prev else 0
        if avg and v["amount"] > avg * 13 // 10 and v["amount"] - avg >= 100_000:
            out.append(f"«{name}» в {last}: {fmt(v['amount'])} — на {fmt((v['amount'] - avg))} "
                       f"выше среднего за 3 предыдущих месяца")
    since = (ref - timedelta(days=30)).isoformat()
    small = conn.execute("""SELECT COUNT(*), COALESCE(SUM(t.amount),0) FROM transactions t
        JOIN categories c ON c.id=t.category_id WHERE t.kind='expense' AND t.status='done' AND c.role='regular'
        AND t.amount < 100000 AND t.date>=?""", (since,)).fetchone()
    if small[0] >= 15:
        out.append(f"Мелкие необязательные покупки (< 1 000 ₽) за 30 дней: {small[0]} шт. на "
                   f"{fmt(small[1])} — проверьте, что из этого можно убрать")
    subs = conn.execute("""SELECT COALESCE(SUM(t.amount),0) FROM transactions t JOIN categories c ON c.id=t.category_id
        WHERE t.kind='expense' AND t.status='done' AND c.name='Связь и подписки' AND t.date>=?""", (since,)).fetchone()[0]
    if subs >= 300_000:
        out.append(f"Связь и подписки за 30 дней: {fmt(subs)} — пересмотрите неиспользуемые подписки"
                   )
    interest = sum(month_flow(conn, m)["interest"] for m in last_full_months(3, ref))
    if interest:
        out.append(f"Проценты по долгам за 3 полных месяца: {fmt(interest)} — это цена долгов; "
                   "досрочное погашение дорогих долгов — гарантированная «доходность»")
    for d in debt_balances(conn, ref, include_closed=False):
        if d["balance"] > 0 and d["rate"] is None and d["creditor_type"] == "bank":
            out.append(f"По долгу «{d['name']}» не указана ставка — без неё план погашения неточен")
    return out


def _category_spent(conn, name, start, end):
    """Расход по категории за период (без учёта отмен)."""
    return conn.execute("""SELECT COALESCE(SUM(t.amount),0) FROM transactions t JOIN categories c ON c.id=t.category_id
        WHERE c.name=? AND c.kind='expense' AND t.kind='expense' AND t.status='done' AND t.date BETWEEN ? AND ?""",
                        (name, _iso(start), _iso(end))).fetchone()[0]


def recommendations(conn, ref=None):
    """Короткие выводы финдиректора на основе данных (без выдуманных цифр)."""
    ref = ref or today()
    rec = []
    f = forecast(conn, ref)
    bs = balance_sheet(conn, ref)
    if not bs["accounts"]:
        return ["Начните с внесения счетов с фактическими остатками на сегодня (раздел «Счета»)."]
    g30 = _category_spent(conn, db.CAT_GAMBLING, ref - timedelta(days=30), ref)
    if g30:
        inc30 = cash_flow(conn, ref - timedelta(days=30), ref)["income"]
        share = f" — это {g30 * 100 / inc30:.0f} % дохода за тот же период" if inc30 else ""
        rec.append(f"Азартные игры за 30 дней: {fmt(g30)}{share}. Пока это продолжается, никакой план накоплений "
                   "и погашения долгов не сработает. Первый шаг — заблокировать платежи букмекерам и казино во всех банках.")
    if f["late_income"]:
        rec.append(f"Есть просроченные ожидаемые поступления ({len(f['late_income'])}) — они НЕ учтены в деньгах. "
                   "Уточните даты или отметьте как полученные/отменённые.")
    if f["overdue"]:
        rec.append(f"Просрочено обязательных платежей на {fmt(f['obligations_total'] and sum(o['remaining'] for o in f['overdue']))} — "
                   "оплатите в первую очередь или договоритесь с кредитором.")
    if f["free"] < 0:
        rec.append(f"Кассовый разрыв: до {f['horizon']} не хватает {fmt(-f['free'])} на обязательные платежи. "
                   "Варианты: перенести необязательные платежи, договориться о сроке, ускорить поступление."
                   )
    elif f["projected_end"] is not None and f["projected_end"] < 0:
        pace = (f"{fmt(f['spending']['total'])}/день" if f["spending"] else
                f"по бюджету {fmt(f['budget_daily'])}/день")
        rec.append(f"При текущем темпе трат ({pace}) денег до {f['horizon']} не хватит "
                   f"на {fmt(-f['projected_end'])}. Лимит на день: {fmt(max(0, f['daily_allowance']))}."
                   )
    if not f["horizon_known"]:
        rec.append("Не задана дата следующего дохода — добавьте ожидаемое поступление (доход со статусом "
                   "«запланирована»), чтобы прогноз считался до реальной даты.")
    base = expense_base(conn, ref)
    if base and bs["reserve"] < base:
        rec.append(f"Подушка покрывает {bs['reserve'] / base:.1f} мес. — первая цель: 1 месяц "
                   f"({fmt(base)}), затем 3.")
    debts = [d for d in debt_balances(conn, ref, include_closed=False) if d["balance"] > 0]
    if debts:
        first = debt_order(debts, ref)[0]
        rec.append(f"Первый кандидат на досрочное погашение: «{first['name']}»"
                   + (f" ({first['rate']:g} %)" if first["rate"] is not None else " (ставка неизвестна)") + ".")
    elif base and bs["reserve"] >= 3 * base:
        rec.append("Долгов нет и подушка ≥ 3 мес. — можно начинать системно откладывать в капитал.")
    inc = avg_monthly(conn, "income", ref=ref)
    if inc is not None and inc < 20_000_000:
        rec.append(f"Средний доход за 3 мес. {fmt(inc)} — до цели 200 000 ₽ не хватает "
                   f"{fmt((20_000_000 - inc))}/мес (см. «Рост дохода»).")
    return rec
