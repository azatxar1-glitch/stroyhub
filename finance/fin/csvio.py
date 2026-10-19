"""Импорт и экспорт CSV. Разделитель — «;», кодировка UTF-8 с BOM (открывается в Excel).

Экспорт использует названия (счетов, категорий, долгов), а не внутренние id,
поэтому файл понятен человеку и пригоден для обратного импорта.
"""

import csv
import io
import zipfile
from datetime import datetime

from . import backup, db, ops
from .money import to_plain

TX_COLUMNS = ["date", "kind", "status", "amount", "account", "to_account", "category", "subcategory",
              "debt", "principal", "receivable", "goal", "description"]
TX_HEADERS_RU = {
    "date": "Дата", "kind": "Вид", "status": "Статус", "amount": "Сумма", "account": "Счёт",
    "to_account": "Счёт зачисления", "category": "Категория", "subcategory": "Подкатегория", "debt": "Долг",
    "principal": "Основной долг", "receivable": "Дебитор", "goal": "Цель", "description": "Описание",
}
_RU_TO_KEY = {v.lower(): k for k, v in TX_HEADERS_RU.items()}
_KIND_ALIASES = {v.lower(): k for k, v in db.TX_KINDS.items()} | {"доход": "income", "расход": "expense",
                                                                   "перевод": "transfer"}
_STATUS_ALIASES = {v.lower(): k for k, v in db.TX_STATUSES.items()}


def _write(rows, header):
    buf = io.StringIO()
    buf.write("﻿")
    w = csv.writer(buf, delimiter=";", lineterminator="\r\n")
    w.writerow(header)
    w.writerows(rows)
    return buf.getvalue()


def export_transactions(conn, start=None, end=None) -> str:
    q = """SELECT t.*, a.name acc, ta.name to_acc, c.name cat, d.name debt, r.name rcv, g.name goal
           FROM transactions t LEFT JOIN accounts a ON a.id=t.account_id LEFT JOIN accounts ta ON ta.id=t.to_account_id
           LEFT JOIN categories c ON c.id=t.category_id LEFT JOIN debts d ON d.id=t.debt_id
           LEFT JOIN receivables r ON r.id=t.receivable_id LEFT JOIN goals g ON g.id=t.goal_id WHERE 1=1"""
    params = []
    if start:
        q += " AND t.date>=?"
        params.append(start)
    if end:
        q += " AND t.date<=?"
        params.append(end)
    rows = []
    for t in conn.execute(q + " ORDER BY t.date, t.id", params):
        auto_cat = t["kind"] not in ("income", "expense")  # категорию остальных видов ставит система
        rows.append([t["date"], db.TX_KINDS[t["kind"]], db.TX_STATUSES[t["status"]], to_plain(t["amount"]), t["acc"] or "", t["to_acc"] or "",
                     "" if auto_cat else (t["cat"] or ""), t["subcategory"], t["debt"] or "",
                     to_plain(t["principal"]) if t["principal"] is not None else "", t["rcv"] or "",
                     t["goal"] or "", t["description"]])
    return _write(rows, [TX_HEADERS_RU[c] for c in TX_COLUMNS])


TABLE_EXPORTS = {
    "accounts": ("SELECT name, type, opening_balance, opening_date, archived, note FROM accounts ORDER BY id",
                 ["opening_balance"]),
    "debts": ("""SELECT name, creditor, creditor_type, kind, balance_start, start_date, rate, min_payment, payment_day,
                 due_date, penalty, priority, closed, note FROM debts ORDER BY id""", ["balance_start", "min_payment"]),
    "receivables": ("SELECT name, debtor, amount_start, start_date, due_date, closed, note FROM receivables ORDER BY id",
                    ["amount_start"]),
    "recurring": ("""SELECT r.name, r.amount, c.name AS category, r.frequency, r.day, r.month, r.start_date,
                     r.end_date, r.active, r.note FROM recurring r LEFT JOIN categories c ON c.id=r.category_id
                     ORDER BY r.id""", ["amount"]),
    "goals": ("""SELECT g.name, g.kind, g.target, g.months, g.target_date, a.name AS account, g.priority, g.active,
                 g.note FROM goals g LEFT JOIN accounts a ON a.id=g.account_id ORDER BY g.id""", ["target"]),
    "budgets": ("""SELECT b.month, c.name AS category, b.amount FROM budgets b JOIN categories c
                   ON c.id=b.category_id ORDER BY b.month, c.id""", ["amount"]),
    "categories": ("SELECT name, kind, role FROM categories ORDER BY kind, id", []),
}


def export_table(conn, table) -> str:
    sql, money_cols = TABLE_EXPORTS[table]
    cur = conn.execute(sql)
    header = [d[0] for d in cur.description]
    rows = []
    for r in cur:
        rows.append(["" if r[c] is None else (to_plain(r[c]) if c in money_cols else r[c]) for c in header])
    return _write(rows, header)


def export_all_zip(conn) -> bytes:
    from . import reports
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("transactions.csv", export_transactions(conn))
        for t in TABLE_EXPORTS:
            z.writestr(f"{t}.csv", export_table(conn, t))
        z.writestr("report.md", reports.full_report(conn))
    return buf.getvalue()


# ------------------------------------------------------------------ импорт

def _read(text: str):
    text = text.lstrip("﻿")
    sample = text[:2000]
    delim = ";" if sample.count(";") >= sample.count(",") else ","
    reader = csv.reader(io.StringIO(text), delimiter=delim)
    rows = [r for r in reader if any(c.strip() for c in r)]
    if not rows:
        return [], []
    return [h.strip() for h in rows[0]], rows[1:]


def _lookup(conn, table, name, label, extra=""):
    if not name:
        return None
    row = conn.execute(f"SELECT id FROM {table} WHERE name=? {extra}", (name,)).fetchone()
    if row is None:
        raise ops.ValidationError(f"{label} «{name}» не найден(а) — сначала создайте")
    return row["id"]


_FP_FIELDS = ("date", "kind", "status", "amount", "account_id", "to_account_id", "category_id", "debt_id",
              "principal", "receivable_id", "description")


def _existing_count(conn, tx):
    where = " AND ".join(f"{f} IS ?" for f in _FP_FIELDS)
    return conn.execute(f"SELECT COUNT(*) FROM transactions WHERE {where}", [tx[f] for f in _FP_FIELDS]).fetchone()[0]


def import_transactions(conn, text: str, dry_run=False) -> dict:
    """Импорт операций: всё или ничего.

    Дубликаты определяются по содержимому: n-я одинаковая строка файла пропускается,
    если в базе уже есть не меньше n таких операций. Поэтому повторный импорт того же
    файла ничего не задвоит, а две одинаковые покупки в одном файле сохранятся обе.
    Обязательные столбцы: Дата, Вид, Сумма. Перед записью создаётся резервная копия."""
    header, rows = _read(text)
    keys = [_RU_TO_KEY.get(h.lower(), h.lower()) for h in header]
    missing = [TX_HEADERS_RU[k] for k in ("date", "kind", "amount") if k not in keys]
    if missing:
        return {"added": 0, "skipped": 0, "valid": 0, "errors": [f"Нет столбцов: {', '.join(missing)}"],
                "dry_run": dry_run}
    errors, prepared, skipped, occurrences = [], [], 0, {}
    for n, raw in enumerate(rows, start=2):
        rec = {k: (raw[i].strip() if i < len(raw) else "") for i, k in enumerate(keys)}
        try:
            kind = _KIND_ALIASES.get(rec.get("kind", "").lower(), rec.get("kind", "").lower())
            status = _STATUS_ALIASES.get(rec.get("status", "").lower(), rec.get("status", "").lower()) or "done"
            cat_kind = "income" if kind == "income" else "expense"
            data = {
                "date": rec.get("date"), "kind": kind, "status": status, "amount": rec.get("amount"),
                "account_id": _lookup(conn, "accounts", rec.get("account"), "Счёт"),
                "to_account_id": _lookup(conn, "accounts", rec.get("to_account"), "Счёт зачисления"),
                "category_id": _lookup(conn, "categories", rec.get("category"), "Категория",
                                       f"AND kind='{cat_kind}'") if kind in ("income", "expense") else None,
                "subcategory": rec.get("subcategory"),
                "debt_id": _lookup(conn, "debts", rec.get("debt"), "Долг"),
                "principal": rec.get("principal") or None,
                "receivable_id": _lookup(conn, "receivables", rec.get("receivable"), "Дебитор"),
                "goal_id": _lookup(conn, "goals", rec.get("goal"), "Цель"),
                "description": rec.get("description"),
            }
            if kind in ("income", "expense") and (data["amount"] or "").lstrip().startswith("-"):
                raise ops.ValidationError("Сумма должна быть положительной — направление задаёт «Вид»")
            tx = ops.clean_transaction(conn, data)
        except ops.ValidationError as e:
            errors.append(f"Строка {n}: {e}")
            continue
        fp = tuple(tx[f] for f in _FP_FIELDS)
        occurrences[fp] = occurrences.get(fp, 0) + 1
        if _existing_count(conn, tx) >= occurrences[fp]:
            skipped += 1
            continue
        prepared.append((n, data))
    result = {"added": 0, "skipped": skipped, "errors": errors, "dry_run": dry_run, "valid": len(prepared)}
    if errors or dry_run or not prepared:
        return result
    result["backup"] = str(backup.create(conn, "before-import"))
    try:
        for n, data in prepared:
            try:
                ops.add_transaction(conn, data, commit=False)
            except ops.ValidationError as e:
                raise ops.ValidationError(f"Строка {n}: {e}") from None
        conn.commit()
        result["added"] = len(prepared)
    except Exception as e:
        conn.rollback()
        result["errors"] = [str(e)]
    return result


def import_table(conn, table: str, text: str, dry_run=False) -> dict:
    """Импорт справочников (accounts, debts, receivables, recurring, goals, budgets) из экспортного формата.
    Записи с существующим названием обновляются. Сначала прогон на копии БД в памяти:
    при любой ошибке реальная база не меняется."""
    import sqlite3
    savers = {"accounts": ops.save_account, "debts": ops.save_debt, "receivables": ops.save_receivable,
              "recurring": ops.save_recurring, "goals": ops.save_goal}
    if table not in savers and table != "budgets":
        return {"added": 0, "valid": 0, "errors": [f"Импорт таблицы {table} не поддерживается"], "dry_run": dry_run}
    header, rows = _read(text)

    def apply(target):
        errors = []
        for n, raw in enumerate(rows, start=2):
            rec = {h: (raw[i].strip() if i < len(raw) else "") for i, h in enumerate(header)}
            try:
                if table == "budgets":
                    ops.set_budget(target, rec["month"], _lookup(target, "categories", rec["category"], "Категория",
                                                                "AND kind='expense'"), rec["amount"])
                    continue
                if "category" in rec:
                    rec["category_id"] = _lookup(target, "categories", rec.pop("category"), "Категория",
                                                 "AND kind='expense'")
                if "account" in rec:
                    rec["account_id"] = _lookup(target, "accounts", rec.pop("account"), "Счёт")
                existing = target.execute(f"SELECT id FROM {table} WHERE name=?", (rec.get("name"),)).fetchone()
                savers[table](target, rec, existing["id"] if existing else None)
            except (ops.ValidationError, KeyError) as e:
                errors.append(f"Строка {n}: {e}")
        return errors

    mem = sqlite3.connect(":memory:")
    conn.backup(mem)
    mem.row_factory = sqlite3.Row
    mem.execute("PRAGMA foreign_keys = ON")
    errors = apply(mem)
    mem.close()
    result = {"added": 0, "valid": len(rows) - len(errors), "errors": errors, "dry_run": dry_run}
    if errors or dry_run or not rows:
        return result
    result["backup"] = str(backup.create(conn, f"before-import-{table}"))
    result["errors"] = apply(conn)
    result["added"] = len(rows) - len(result["errors"])
    return result


def timestamp():
    return datetime.now().strftime("%Y%m%d-%H%M")
