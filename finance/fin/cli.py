"""Командная строка: python -m fin <команда>.

Команды соответствуют режимам /add, /balance, /debts, /budget, /salary,
/report, /forecast, /goals, /audit, /income."""

import argparse
import sys
from datetime import date
from pathlib import Path

from . import backup, calc, checks, csvio, db, ops, reports
from .money import fmt


def _ref(a):
    return date.fromisoformat(a.date) if getattr(a, "date", None) else date.today()


def _id(conn, table, name, label, extra=""):
    if not name:
        return None
    if name.isdigit():
        return int(name)
    return csvio._lookup(conn, table, name, label, extra)


def cmd_add(conn, a):
    kind = csvio._KIND_ALIASES.get(a.kind.lower(), a.kind)
    data = {"date": a.date or date.today().isoformat(), "kind": kind, "status": a.status, "amount": a.amount,
            "account_id": _id(conn, "accounts", a.account, "Счёт"),
            "to_account_id": _id(conn, "accounts", a.to, "Счёт зачисления"),
            "category_id": _id(conn, "categories", a.category, "Категория",
                               f"AND kind='{'income' if kind == 'income' else 'expense'}'") if a.category else None,
            "subcategory": a.sub, "debt_id": _id(conn, "debts", a.debt, "Долг"), "principal": a.principal,
            "receivable_id": _id(conn, "receivables", a.receivable, "Дебитор"),
            "goal_id": _id(conn, "goals", a.goal, "Цель"), "description": a.desc}
    tid = ops.add_transaction(conn, data)
    print(f"Записано в базу: операция #{tid}")
    b = calc.balance_sheet(conn)
    print(f"Фактически доступно: {fmt(b['liquid'])}; долги: {fmt(b['total_debt'])}; чистый капитал: {fmt(b['net_worth'])}")


def cmd_check(conn, a):
    res = checks.run(conn, _ref(a))
    icon = {"ok": "✔", "warn": "⚠", "error": "✖"}
    for lvl, msg in res:
        print(icon[lvl], msg)
    return 1 if checks.has_errors(res) else 0


def cmd_backup(conn, a):
    print("Резервная копия:", backup.create(conn, "manual", a.dir))


def cmd_backups(conn, a):
    for p in backup.list_backups():
        print(p.name, f"{p.stat().st_size // 1024} КБ")


def cmd_restore(conn, a):
    p = Path(a.file)
    if not p.exists():
        p = backup.backup_dir() / a.file
    safety = backup.restore(conn, p)
    print(f"Восстановлено из {p.name}. Предыдущее состояние сохранено: {safety.name}")


def cmd_export(conn, a):
    out = Path(a.out or f"finance-export-{csvio.timestamp()}.zip")
    if out.suffix == ".zip":
        out.write_bytes(csvio.export_all_zip(conn))
    elif a.table == "transactions":
        out.write_text(csvio.export_transactions(conn, a.start, a.end), encoding="utf-8")
    else:
        out.write_text(csvio.export_table(conn, a.table), encoding="utf-8")
    print("Экспорт:", out.resolve())


def cmd_import(conn, a):
    text = Path(a.file).read_text(encoding="utf-8-sig")
    if a.table == "transactions":
        r = csvio.import_transactions(conn, "﻿" + text, dry_run=a.dry_run)
    else:
        r = csvio.import_table(conn, a.table, text, dry_run=a.dry_run)
    for e in r["errors"]:
        print("✖", e)
    if r["errors"]:
        print("Импорт не выполнен — база не изменена.")
        return 1
    print(("Проверка: корректных строк " + str(r.get("valid", 0))) if a.dry_run else f"Импортировано: {r['added']}",
          f"(дубликатов пропущено: {r['skipped']})" if r.get("skipped") else "")
    return 0


def cmd_report(conn, a):
    if a.full or a.out:
        text = reports.full_report(conn, _ref(a))
    else:
        start = a.start or _ref(a).replace(day=1).isoformat()
        text = reports.period(conn, start, a.end or _ref(a).isoformat())
    if a.out:
        Path(a.out).write_text(text, encoding="utf-8")
        print("Отчёт сохранён:", Path(a.out).resolve())
    else:
        print(text)


def build_parser():
    p = argparse.ArgumentParser(prog="python -m fin", description="Личные финансы: учёт, баланс, долги, прогноз")
    p.add_argument("--db", help="путь к базе (по умолчанию data/finance.db или $FIN_DB)")
    sub = p.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("serve", help="запустить веб-интерфейс")
    s.add_argument("--port", type=int, default=8765)
    s.add_argument("--open", action="store_true", help="открыть браузер")

    sub.add_parser("init", help="создать базу")

    s = sub.add_parser("add", help="/add — добавить операцию")
    s.add_argument("kind", help="income|expense|transfer|debt_payment|debt_draw|debt_adjust|lend|lend_return|adjustment "
                                "или «доход»/«расход»/«перевод»")
    s.add_argument("amount")
    s.add_argument("--account", "-a", help="счёт (название или id)")
    s.add_argument("--to", help="счёт зачисления (для перевода)")
    s.add_argument("--category", "-c")
    s.add_argument("--sub", default="", help="подкатегория")
    s.add_argument("--debt")
    s.add_argument("--principal", help="часть платежа в основной долг")
    s.add_argument("--receivable")
    s.add_argument("--goal")
    s.add_argument("--status", default="done", help="done|planned|cancelled")
    s.add_argument("--date")
    s.add_argument("--desc", default="")

    for name, helptext in (("balance", "/balance — баланс"), ("debts", "/debts — долги и план погашения"),
                           ("salary", "/salary — распределить деньги до следующего дохода"),
                           ("forecast", "/forecast — прогноз до следующего дохода"),
                           ("goals", "/goals — прогресс по целям"), ("audit", "/audit — полный аудит"),
                           ("income", "/income — доход и стратегия роста"), ("check", "проверки расчётов")):
        s = sub.add_parser(name, help=helptext)
        s.add_argument("--date", help="на дату (ГГГГ-ММ-ДД)")
        if name == "debts":
            s.add_argument("--extra", default="0", help="сумма сверх минимальных платежей в месяц")

    s = sub.add_parser("plan", help="план денег по датам через несколько выплат")
    s.add_argument("until", help="до даты ГГГГ-ММ-ДД")
    s.add_argument("--date", help="начальная дата")

    s = sub.add_parser("budget", help="/budget — бюджет на месяц")
    s.add_argument("--month", help="ГГГГ-ММ")
    s.add_argument("--set", nargs=2, metavar=("КАТЕГОРИЯ", "СУММА"), action="append", help="задать лимит")

    s = sub.add_parser("report", help="/report — отчёт за период")
    s.add_argument("--start")
    s.add_argument("--end")
    s.add_argument("--date")
    s.add_argument("--full", action="store_true", help="полный отчёт")
    s.add_argument("--out", help="сохранить полный отчёт в файл .md")

    s = sub.add_parser("backup", help="создать резервную копию")
    s.add_argument("--dir", help="куда (по умолчанию data/backups)")
    sub.add_parser("backups", help="список резервных копий")
    s = sub.add_parser("restore", help="восстановить из копии")
    s.add_argument("file")

    s = sub.add_parser("export", help="экспорт CSV / ZIP")
    s.add_argument("--table", default="transactions", choices=["transactions", *csvio.TABLE_EXPORTS])
    s.add_argument("--start")
    s.add_argument("--end")
    s.add_argument("--out", help="файл .csv или .zip (по умолчанию — полный архив .zip)")

    s = sub.add_parser("import", help="импорт CSV")
    s.add_argument("file")
    s.add_argument("--table", default="transactions",
                   choices=["transactions", "accounts", "debts", "receivables", "recurring", "goals", "budgets"])
    s.add_argument("--dry-run", action="store_true", help="только проверить")
    return p


def main(argv=None):
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    a = build_parser().parse_args(argv)
    if a.cmd == "serve":
        from . import web
        web.serve(a.port, a.db, a.open)
        return 0
    conn = db.connect(a.db)
    try:
        if a.cmd == "init":
            print("База готова:", a.db or db.db_path())
        elif a.cmd == "add":
            cmd_add(conn, a)
        elif a.cmd == "balance":
            print(reports.balance(conn, _ref(a)))
        elif a.cmd == "debts":
            print(reports.debts(conn, _ref(a), ops._money(a.extra, allow_zero=True)))
        elif a.cmd == "salary":
            print(reports.salary(conn, _ref(a)))
        elif a.cmd == "forecast":
            print(reports.forecast(conn, _ref(a)))
        elif a.cmd == "plan":
            print(reports.plan(conn, a.until, _ref(a)))
        elif a.cmd == "goals":
            print(reports.goals(conn, _ref(a)))
        elif a.cmd == "audit":
            print(reports.audit(conn, _ref(a)))
        elif a.cmd == "income":
            print(reports.income(conn, _ref(a)))
        elif a.cmd == "budget":
            month = a.month or calc.ym(date.today())
            for cat, amount in a.set or []:
                ops.set_budget(conn, month, _id(conn, "categories", cat, "Категория", "AND kind='expense'"), amount)
            print(reports.budget(conn, month))
        elif a.cmd == "report":
            cmd_report(conn, a)
        else:
            return {"check": cmd_check, "backup": cmd_backup, "backups": cmd_backups, "restore": cmd_restore,
                    "export": cmd_export, "import": cmd_import}[a.cmd](conn, a) or 0
    except (ops.ValidationError, RuntimeError, ValueError) as e:
        print("Ошибка:", e, file=sys.stderr)
        return 2
    finally:
        conn.close()
    return 0
