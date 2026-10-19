"""Текстовые отчёты (Markdown) для команд /balance, /debts, /budget, /salary,
/report, /forecast, /goals, /audit, /income и полного отчёта."""

from datetime import date

from . import calc, checks, db
from .money import fmt

DOCS = db.ROOT / "docs"


def _table(header, rows):
    out = ["| " + " | ".join(header) + " |", "|" + "---|" * len(header)]
    out += ["| " + " | ".join(str(c) for c in r) + " |" for r in rows]
    return "\n".join(out)


def balance(conn, ref=None):
    b = calc.balance_sheet(conn, ref)
    L = [f"## Баланс на {b['as_of']}", ""]
    L.append(_table(["Показатель", "Сумма", "Пояснение"], [
        ["**Фактически доступно**", f"**{fmt(b['liquid'])}**", "наличные и дебетовые карты — можно тратить сейчас"],
        ["Накопления (резерв)", fmt(b["reserve"]), "накопительные счета и вклады"],
        ["Инвестиции", fmt(b["investments"]), "брокерские счета"],
        ["Имущество", fmt(b["property"]), "по вашей оценке"],
        ["Долги банкам", fmt(-b["bank_debt"]), "кредиты, ипотека, кредитные карты"],
        ["Долги физлицам", fmt(-b["person_debt"]), "личные долги"],
        ["Мне должны (дебиторка)", fmt(b["receivable_total"]), "НЕ доступно, пока не вернут"],
        ["Ожидаемые поступления", fmt(b["expected_total"]), "НЕ доступно, пока не поступит"],
        ["**Чистый капитал**", f"**{fmt(b['net_worth'])}**", "все активы − все долги (с дебиторкой)"],
        ["Чистый капитал (консервативно)", fmt(b["net_worth_conservative"]), "без дебиторки"],
    ]))
    L += ["", "Арифметика: " + " + ".join([fmt(b["liquid"]), fmt(b["reserve"]), fmt(b["investments"]),
                                           fmt(b["property"]), fmt(b["receivable_total"])])
          + f" − {fmt(b['total_debt'])} = {fmt(b['net_worth'])}", ""]
    if b["accounts"]:
        L += ["### Счета", _table(["Счёт", "Тип", "Остаток"], [
            [a["name"] + (" (архив)" if a["archived"] else ""), db.ACCOUNT_TYPES[a["type"]], fmt(a["balance"])]
            for a in b["accounts"]])]
    else:
        L.append("_Счетов нет. Добавьте счета с фактическими остатками — без них баланс неизвестен._")
    if b["expected"]:
        L += ["", "### Ожидаемые поступления (не учтены в деньгах)",
              _table(["Дата", "Источник", "Сумма"], [[e["date"], e["description"] or e["category"], fmt(e["amount"])]
                                                     for e in b["expected"]])]
    return "\n".join(L)


def debts(conn, ref=None, extra=0):
    ref = ref or date.today()
    ds = calc.debt_details(conn, ref)
    L = [f"## Долги на {ref.isoformat()}", ""]
    if not ds:
        return "\n".join(L + ["_Долгов не внесено._"])
    unk = "неизвестно"
    for group, title in (("bank", "Банки и организации"), ("person", "Физические лица (отдельно по каждому)")):
        rows = [d for d in ds if d["creditor_type"] == group and (d["balance"] or not d["closed"])]
        if not rows:
            continue
        L += [f"### {title}", _table(
            ["Долг", "Кредитор", "Остаток", "Ставка", "Мин. платёж", "День/срок", "Просрочка", "Приоритет",
             "Проценты/мес"],
            [[d["name"], d["creditor"], fmt(d["balance"]), f"{d['rate']:g} %" if d["rate"] is not None else unk,
              fmt(d["min_payment"]) if d["min_payment"] is not None else unk,
              ", ".join(x for x in (f"{d['payment_day']} число" if d["payment_day"] else "",
                                    f"до {d['due_date']}" if d["due_date"] else "") if x) or unk,
              f"{fmt(d['overdue'])}, {d['overdue_days']} дн." if d["overdue"] else "нет", d["priority"],
              fmt(d["monthly_interest"]) if d["monthly_interest"] is not None else unk] for d in rows]), ""]
        for d in rows:
            if d["history"]:
                L.append(f"**История: {d['name']}** — выплачено {fmt(d['paid_total'])}, "
                         f"из них основной долг {fmt(d['principal_paid'])}")
                for h in d["history"][:10]:
                    L.append(f"- {h['date']}: {db.TX_KINDS[h['kind']]} {fmt(h['amount'])}"
                             + (f" (тело {fmt(h['principal'])})" if h["principal"] is not None else "")
                             + (f" — {h['description']}" if h["description"] else ""))
                L.append("")
    open_ = [d for d in ds if d["balance"] > 0 and not d["closed"]]
    L += ["### Порядок досрочного погашения",
          "Просроченные → ваш приоритет → ставка (выше — раньше) → меньший остаток. "
          "Минимальные платежи по всем долгам вносятся всегда.", ""]
    for i, d in enumerate(calc.debt_order(open_, ref), 1):
        L.append(f"{i}. {d['name']} — {fmt(d['balance'])}"
                 + (f", {d['rate']:g} %" if d["rate"] is not None else ", ставка неизвестна"))
    for strat, name in (("priority", "Рекомендуемый порядок (как в списке выше)"),
                        ("avalanche", "Лавина (сначала самая высокая ставка)"),
                        ("snowball", "Снежный ком (сначала самый маленький остаток)")):
        sim = calc.simulate_payoff(open_, extra, strat)
        L += ["", f"**{name}**, бюджет {fmt(sim['budget'])}/мес (минимумы + {fmt(extra)} сверху): "
              + (f"все долги закрыты через {sim['months']} мес., проценты {fmt(sim['total_interest'])}"
                 if sim["feasible"] else "при таком бюджете долги не гасятся (платежи ≤ процентов или минимумы неизвестны)")]
        if sim.get("rate_unknown"):
            L.append("_Есть долги с неизвестной ставкой — считались как 0 %, проценты занижены._")
    L += ["", "Защита базовых расходов: досрочные платежи берутся только из свободного остатка "
          "(см. /salary), после обязательных платежей и расходов на жильё, еду и транспорт."]
    return "\n".join(L)


def forecast(conn, ref=None):
    f = calc.forecast(conn, ref)
    L = [f"## Прогноз до следующего дохода (с {f['ref']})", ""]
    if f["next_income"]:
        L.append(f"Следующий доход: **{f['next_income']['date']}** "
                 f"({f['next_income']['description'] or f['next_income']['category'] or 'доход'}, "
                 f"{fmt(f['next_income']['amount'])} — **не учитывается**, пока не поступит). Дней: {f['days']}.")
    else:
        L.append(f"Дата следующего дохода **неизвестна** — горизонт 30 дней (до {f['horizon']}).")
    L += ["", f"- Фактически доступно: {fmt(f['available'])}"]
    for o in f["overdue"]:
        L.append(f"- ПРОСРОЧЕНО {o['date']}: {o['name']} — {fmt(-o['remaining'])}")
    for o in f["ahead"]:
        L.append(f"- {o['date']}: {o['name']} — {fmt(-o['remaining'])}")
    L += [f"- **Свободно после обязательных: {fmt(f['free'])}** "
          f"({fmt(f['available'])} − {fmt(f['obligations_total'])})",
          f"- Можно тратить в день до дохода: **{fmt(f['daily_allowance'])}** ({fmt(f['free'])} / {f['days']} дн.)"]
    if f["spending"]:
        s = f["spending"]
        L.append(f"- Средние переменные траты: {fmt(s['total'])}/день (за {s['days']} дн.; защищённые "
                 f"{fmt(s['essential'])}, прочие {fmt(s['other'])})")
        L.append(f"- Прогноз остатка к дате дохода: **{fmt(f['projected_end'])}** "
                 f"({fmt(f['free'])} − {fmt(s['total'])} × {f['days']})")
    else:
        L.append("- Средние траты: неизвестно (нужно ≥ 14 дней истории расходов)")
    if f["late_income"]:
        L.append(f"- ⚠ Просроченные ожидаемые поступления: {len(f['late_income'])} — не учтены")
    L.append("")
    L.append("**⚠ Риск кассового разрыва**" if f["cash_gap"] else "Кассового разрыва не прогнозируется.")
    return "\n".join(L)


def salary(conn, ref=None):
    a = calc.allocate(conn, ref)
    L = ["## Распределение денег до следующего дохода", "",
         "Считается от фактически поступивших денег. Если зарплата ещё не пришла — сначала отметьте "
         "её проведённой, план на невыплаченные деньги не строится.", ""]
    for label, amount in a["steps"]:
        L.append(f"- {label}" + (f": **{fmt(amount)}**" if amount is not None else ""))
    if a["allocation"]:
        L += ["", "### Предлагаемое распределение свободного остатка",
              _table(["Куда", "Сумма"], [[x["to"], fmt(x["amount"])] for x in a["allocation"]]),
              "", f"Итого распределено: {fmt(sum(x['amount'] for x in a['allocation']))} = свободный остаток "
                  f"{fmt(a['free'])}"]
    L += ["", f"**Бюджет на повседневные расходы: {fmt(a['daily_budget'])} в день** "
              f"(защищённые + личные траты / {a['forecast']['days']} дн.)"]
    for w in a["warnings"]:
        L.append(f"\n⚠ {w}")
    L += ["", "<details><summary>Правила</summary>", "", a["rules"], "", "</details>"]
    return "\n".join(L)


def budget(conn, month=None):
    month = month or calc.ym(date.today())
    b = calc.month_budget(conn, month)
    L = [f"## Бюджет на {month}", "",
         _table(["Категория", "Лимит", "Факт", "Остаток", "Среднее за 3 мес."],
                [[r["category"] + (" *" if r["role"] == "essential" else ""),
                  fmt(r["limit"]) if r["limit"] is not None else "не задан", fmt(r["fact"]),
                  fmt(r["left"]) if r["left"] is not None else "—", fmt(r["avg3"]) if r["avg3"] is not None else "неизвестно"] for r in b["rows"]]),
         "", "\\* защищённые расходы (жильё, еда, транспорт, здоровье)",
         f"\nЛимиты всего: {fmt(b['limit_total'])}; факт: {fmt(b['fact_total'])}.",
         f"Обязательные платежи месяца: {fmt(b['obligations_total'])}:"]
    for o in b["obligations"]:
        L.append(f"- {o['date']} {o['name']}: {fmt(o['amount'])}" + (" — оплачено" if o["remaining"] == 0 else
                                                                     f" — осталось {fmt(o['remaining'])}"))
    inc = calc.avg_monthly(conn, "income")
    if inc:
        L.append(f"\nСредний доход за 3 мес.: {fmt(inc)}; лимиты + обязательные = "
                 f"{fmt(b['limit_total'] + b['obligations_total'])} → остаток на долги/накопления "
                 f"{fmt(inc - b['limit_total'] - b['obligations_total'])} (оценка, обязательные могут пересекаться с лимитами).")
    return "\n".join(L)


def period(conn, start, end):
    f = calc.cash_flow(conn, start, end)
    L = [f"## Отчёт за {f['start']} — {f['end']}", "",
         _table(["Показатель", "Сумма"], [
             ["Доходы", fmt(f["income"])],
             ["Расходы (потребление, вкл. проценты)", fmt(-f["expenses"])],
             ["  из них защищённые", fmt(-f["essential"])],
             ["  из них проценты по долгам", fmt(-f["interest"])],
             ["**Доход − потребление**", f"**{fmt(f['net_operating'], sign=True)}**"],
             ["Погашение тела долга банкам", fmt(-f["principal_bank"])],
             ["Погашение тела долга физлицам", fmt(-f["principal_person"])],
             ["**Свободный поток после долгов**", f"**{fmt(f['net_after_debt'], sign=True)}**"],
             ["Отложено в накопления (нетто переводов)", fmt(f["to_savings"])],
             ["Новые займы (не доход!)", fmt(f["borrowed"])],
             ["Дал в долг", fmt(-f["lent"])],
             ["Мне вернули долг (не доход)", fmt(f["returned_to_me"])],
             ["Норма сбережений", f"{f['savings_rate'] * 100:.1f} %" if f["savings_rate"] is not None else "неизвестно"],
             ["Средние расходы в день", fmt(f["avg_daily_expense"])],
         ]), ""]
    if f["income_by_category"]:
        L += ["### Доходы по категориям", _table(["Категория", "Сумма"], [[r["name"], fmt(r["s"])]
                                                                       for r in f["income_by_category"]
                                                                       if r["role"] != "service"]), ""]
    if f["expenses_by_category"]:
        tot = f["expenses"] or 1
        L += ["### Структура расходов", _table(["Категория", "Сумма", "Доля"], [
            [k, fmt(v["amount"]), f"{v['amount'] * 100 / tot:.1f} %"] for k, v in f["expenses_by_category"].items()])]
    return "\n".join(L)


def goals(conn, ref=None):
    L = ["## Финансовые цели", ""]
    rows = []
    for g in calc.goals_progress(conn, ref):
        rows.append([g["priority"], g["name"],
                     fmt(g["current"]) if g["current"] is not None else "неизвестно",
                     fmt(g["target"]) if g["target"] is not None else "неизвестно",
                     f"{g['pct']:.0f} %" if g.get("pct") is not None else "—", g.get("eta") or "—",
                     "; ".join(g["details"])])
    L.append(_table(["#", "Цель", "Сейчас", "Цель", "Прогресс", "Срок (при текущем темпе)", "Детали"], rows))
    return "\n".join(L)


def audit(conn, ref=None):
    ref = ref or date.today()
    L = [f"## Аудит финансов на {ref.isoformat()}", "", "### Проверки расчётов и данных"]
    icon = {"ok": "✔", "warn": "⚠", "error": "✖"}
    L += [f"- {icon[lvl]} {msg}" for lvl, msg in checks.run(conn, ref)]
    L += ["", "### Выводы и рекомендации"] + ([f"- {r}" for r in calc.recommendations(conn, ref)] or ["- нет"])
    lk = calc.leaks(conn, ref)
    L += ["", "### Утечки и что можно сократить"] + ([f"- {x}" for x in lk] or ["- явных утечек не найдено "
                                                                              "(или мало истории)"])
    f = calc.forecast(conn, ref)
    L += ["", "### Риск кассового разрыва", "Есть" if f["cash_gap"] else "Не прогнозируется"]
    return "\n".join(L)


def income(conn, ref=None):
    ref = ref or date.today()
    L = ["## Доход: факт против целей", ""]
    rows = []
    start = calc.tracking_start(conn)
    for m in calc.last_full_months(6, ref) + [calc.ym(ref)]:
        if start is None or calc.month_bounds(m)[1] < start:
            rows.append([m, "учёт не вёлся", "—", "—"])
            continue
        f = calc.month_flow(conn, m)
        rows.append([m + (" (текущий)" if m == calc.ym(ref) else ""), fmt(f["income"]),
                     ", ".join(f"{r['name']}: {fmt(r['s'])}" for r in f["income_by_category"] if r["role"] != "service")
                     or "—", f"{f['income'] * 100 / 20_000_000:.0f} %"])
    L.append(_table(["Месяц", "Доход", "Источники", "% от 200 000"], rows))
    path = DOCS / "income-strategy.md"
    if path.exists():
        L += ["", path.read_text(encoding="utf-8")]
    return "\n".join(L)


def full_report(conn, ref=None):
    ref = ref or date.today()
    s, _ = calc.month_bounds(calc.ym(ref))
    last = calc.last_full_months(1, ref)[0]
    ls, le = calc.month_bounds(last)
    parts = [f"# Финансовый отчёт на {ref.isoformat()}", "",
             "_Сформировано локально из базы SQLite. Ожидаемые поступления и дебиторка не считаются доступными "
             "деньгами._", "",
             balance(conn, ref), forecast(conn, ref), debts(conn, ref), period(conn, s, ref), period(conn, ls, le),
             goals(conn, ref), audit(conn, ref)]
    hist = calc.net_worth_history(conn, 6, ref)
    parts += ["## Динамика чистого капитала", _table(["Месяц", "Чистый капитал", "Долги", "Финансовые активы"],
                                                    [[h["month"], fmt(h["net_worth"]), fmt(h["debt"]),
                                                      fmt(h["financial_assets"])] for h in hist])]
    return "\n\n".join(parts)
