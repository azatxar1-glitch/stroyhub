"""Проверки расчётов на сценариях с заранее посчитанным ответом.

Запуск: python -m unittest discover -s tests  (из папки finance)
"""

import os
import sqlite3
import tempfile
import unittest
from datetime import date
from pathlib import Path

from fin import backup, calc, checks, csvio, db, ops, reports
from fin.money import MoneyError, fmt, parse_money

REF = date(2026, 10, 19)


class Base(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        os.environ["FIN_DB"] = str(Path(self.tmp.name) / "t.db")
        self.conn = db.connect()
        c = self.conn
        self.card = ops.save_account(c, {"name": "Карта", "type": "debit", "opening_balance": "50000",
                                         "opening_date": "2026-07-01"})
        self.cash = ops.save_account(c, {"name": "Наличные", "type": "cash", "opening_balance": "3000",
                                         "opening_date": "2026-07-01"})
        self.save = ops.save_account(c, {"name": "Накопительный", "type": "savings", "opening_balance": "0",
                                         "opening_date": "2026-07-01"})
        self.cc = ops.save_account(c, {"name": "Кредитка", "type": "credit_card", "opening_balance": "-20000",
                                       "opening_date": "2026-07-01"})
        self.bank = ops.save_debt(c, {"creditor": "Банк А", "creditor_type": "bank", "kind": "loan",
                                      "balance_start": "300000", "start_date": "2026-07-01", "rate": "24",
                                      "min_payment": "15000", "payment_day": "25", "priority": "5"})
        self.friend = ops.save_debt(c, {"creditor": "Иван", "creditor_type": "person", "balance_start": "40000",
                                        "start_date": "2026-07-01", "due_date": "2026-12-31", "priority": "3"})
        self.rcv = ops.save_receivable(c, {"debtor": "Пётр", "amount_start": "10000", "start_date": "2026-07-01"})

    def tearDown(self):
        self.conn.close()
        self.tmp.cleanup()
        os.environ.pop("FIN_DB", None)

    def cat(self, name, kind="expense"):
        return db.category_id(self.conn, name, kind)

    def tx(self, **kw):
        kw.setdefault("account_id", self.card)
        return ops.add_transaction(self.conn, kw)


class MoneyTest(unittest.TestCase):
    def test_parse(self):
        self.assertEqual(parse_money("12 345,67"), 1234567)
        self.assertEqual(parse_money("1.234,56"), 123456)
        self.assertEqual(parse_money("1,234.56"), 123456)
        self.assertEqual(parse_money("-500"), -50000)
        self.assertEqual(parse_money("1 000 ₽"), 100000)
        self.assertEqual(parse_money("0.1"), 10)
        for bad in ("", "abc", "1.234", "nan"):
            if bad == "1.234":
                with self.assertRaises(MoneyError):
                    parse_money("1.2345")
                continue
            with self.assertRaises(MoneyError):
                parse_money(bad)

    def test_fmt(self):
        self.assertEqual(fmt(1234567), "12 345,67 ₽")
        self.assertEqual(fmt(-50000), "−500 ₽")
        self.assertEqual(fmt(None), "—")


class BalanceTest(Base):
    def test_balances_and_net_worth(self):
        self.tx(date="2026-10-05", kind="income", amount="150000", category_id=self.cat("Зарплата", "income"))
        self.tx(date="2026-10-06", kind="expense", amount="12000,50", category_id=self.cat("Продукты и питание"))
        self.tx(date="2026-10-07", kind="transfer", amount="30000", to_account_id=self.save)
        self.tx(date="2026-10-08", kind="expense", amount="5000", category_id=self.cat("Покупки"), account_id=self.cc)
        self.tx(date="2026-10-10", kind="debt_payment", amount="15000", principal="9000", debt_id=self.bank)
        self.tx(date="2026-10-11", kind="debt_payment", amount="10000", debt_id=self.friend)
        self.tx(date="2026-10-12", kind="lend_return", amount="4000", receivable_id=self.rcv)
        # ожидаемая зарплата — не деньги
        self.tx(date="2026-10-25", kind="income", status="planned", amount="150000",
                category_id=self.cat("Зарплата", "income"))
        bs = calc.balance_sheet(self.conn, REF)
        # Карта: 50000 + 150000 − 12000,50 − 30000 − 15000 − 10000 + 4000 = 136999,50; наличные 3000
        self.assertEqual(bs["liquid"], 13699950 + 300000)
        self.assertEqual(bs["reserve"], 3000000)
        self.assertEqual(bs["card_debt"], 2500000)
        self.assertEqual(bs["bank_debt"], 29100000 + 2500000)   # кредит 300000 − 9000 тело + кредитка
        self.assertEqual(bs["person_debt"], 3000000)
        self.assertEqual(bs["receivable_total"], 600000)
        self.assertEqual(bs["expected_total"], 15000000)
        # Чистый капитал = 139999,50 + 30000 − 25000 − 291000 − 30000 + 6000 = −170000,50
        self.assertEqual(bs["net_worth"], -17000050)
        self.assertEqual(bs["net_worth_conservative"], -17600050)

    def test_cash_flow_separates_debt_and_savings(self):
        self.tx(date="2026-10-05", kind="income", amount="200000", category_id=self.cat("Зарплата", "income"))
        self.tx(date="2026-10-06", kind="expense", amount="20000", category_id=self.cat("Продукты и питание"))
        self.tx(date="2026-10-07", kind="transfer", amount="30000", to_account_id=self.save)
        self.tx(date="2026-10-10", kind="debt_payment", amount="15000", principal="9000", debt_id=self.bank)
        self.tx(date="2026-10-12", kind="lend_return", amount="4000", receivable_id=self.rcv)
        f = calc.cash_flow(self.conn, "2026-10-01", "2026-10-31")
        self.assertEqual(f["income"], 20000000)            # возврат долга мне — не доход
        self.assertEqual(f["returned_to_me"], 400000)
        self.assertEqual(f["expenses"], 2000000 + 600000)  # продукты + проценты 6000
        self.assertEqual(f["interest"], 600000)
        self.assertEqual(f["principal"], 900000)           # тело долга — не расход
        self.assertEqual(f["to_savings"], 3000000)         # накопления — не расход
        self.assertEqual(f["net_operating"], 20000000 - 2600000)
        self.assertEqual(f["net_after_debt"], 20000000 - 2600000 - 900000)
        self.assertAlmostEqual(f["savings_rate"], 0.87)

    def test_checks_pass(self):
        self.tx(date="2026-10-05", kind="income", amount="200000", category_id=self.cat("Зарплата", "income"))
        self.tx(date="2026-10-07", kind="transfer", amount="30000", to_account_id=self.save)
        self.tx(date="2026-10-10", kind="debt_payment", amount="15000", principal="9000", debt_id=self.bank)
        self.tx(date="2026-10-11", kind="lend", amount="1000", receivable_id=self.rcv)
        self.tx(date="2026-10-12", kind="adjustment", amount="-123,45")
        res = checks.run(self.conn, REF)
        self.assertFalse(checks.has_errors(res), res)

    def test_checks_detect_corruption(self):
        self.tx(date="2026-10-05", kind="expense", amount="100", category_id=self.cat("Прочее"))
        # обходим валидацию — записываем погашение как расход напрямую
        self.conn.execute("UPDATE transactions SET category_id=?", (self.cat("Возврат личных долгов"),))
        self.conn.commit()
        self.assertTrue(checks.has_errors(checks.run(self.conn, REF)))


class RulesTest(Base):
    def test_service_category_rejected(self):
        with self.assertRaises(ops.ValidationError):
            self.tx(date="2026-10-05", kind="expense", amount="100", category_id=self.cat("Возврат личных долгов"))
        with self.assertRaises(ops.ValidationError):
            self.tx(date="2026-10-05", kind="expense", amount="100", category_id=self.cat("Накопления и инвестиции"))

    def test_overpayment_rejected(self):
        with self.assertRaises(ops.ValidationError):
            self.tx(date="2026-10-05", kind="debt_payment", amount="50000", debt_id=self.friend)
        with self.assertRaises(ops.ValidationError):
            self.tx(date="2026-10-05", kind="debt_payment", amount="100", principal="200", debt_id=self.bank)
        with self.assertRaises(ops.ValidationError):
            self.tx(date="2026-10-05", kind="lend_return", amount="10001", receivable_id=self.rcv)

    def test_transfer_same_account_rejected(self):
        with self.assertRaises(ops.ValidationError):
            self.tx(date="2026-10-05", kind="transfer", amount="1", to_account_id=self.card)

    def test_planned_income_completion(self):
        tid = self.tx(date="2026-10-25", kind="income", status="planned", amount="150000",
                      category_id=self.cat("Зарплата", "income"))
        self.assertEqual(calc.balance_sheet(self.conn, REF)["liquid"], 5300000)
        ops.complete_transaction(self.conn, tid, "2026-10-19", "148000")
        self.assertEqual(calc.balance_sheet(self.conn, REF)["liquid"], 5300000 + 14800000)


class ReceivableIncomeTest(Base):
    def test_earned_income_closes_receivable(self):
        r = ops.save_receivable(self.conn, {"debtor": "Работодатель", "amount_start": "13050", "start_date": "2026-10-01"})
        before = calc.balance_sheet(self.conn, REF)["net_worth"]
        self.tx(date="2026-10-15", kind="income", amount="13050", category_id=self.cat("Зарплата", "income"),
                receivable_id=r)
        bs = calc.balance_sheet(self.conn, REF)
        self.assertEqual(calc.receivable_balance(self.conn, r, REF), 0)
        self.assertEqual(bs["net_worth"], before)            # деньги пришли, дебиторка ушла
        self.assertEqual(calc.cash_flow(self.conn, "2026-10-01", "2026-10-31")["income"], 1305000)  # это доход
        with self.assertRaises(ops.ValidationError):
            self.tx(date="2026-10-16", kind="income", amount="1", category_id=self.cat("Зарплата", "income"),
                    receivable_id=r)
        self.assertFalse(checks.has_errors(checks.run(self.conn, REF)))


class PlanTest(Base):
    def test_multi_paycheck_plan(self):
        # Без истории трат: «жизнь» по бюджету 31 000 ₽ в октябре и 30 000 ₽ в ноябре = 1 000 ₽/день
        ops.set_budget(self.conn, "2026-10", self.cat("Продукты и питание"), "31000")
        ops.set_budget(self.conn, "2026-11", self.cat("Продукты и питание"), "30000")
        ops.save_recurring(self.conn, {"name": "Ипотека", "amount": "17000", "day": "18", "frequency": "monthly",
                                       "category_id": self.cat("Ипотека и жильё"), "start_date": "2026-10-20"})
        sal = self.cat("Зарплата", "income")
        self.tx(date="2026-10-29", kind="income", status="planned", amount="13050", category_id=sal)
        self.tx(date="2026-11-02", kind="income", status="planned", amount="93900", category_id=sal)
        self.tx(date="2026-11-02", kind="debt_payment", status="planned", amount="40000", debt_id=self.friend)
        p = calc.cash_plan(self.conn, "2026-11-30", REF)
        # старт 53 000 (карта 50 000 + наличные 3 000). Доходы (план) 106 950.
        # Обязательные: просрочка по кредиту за август и сентябрь 2 × 15 000 + кредит 25.10 и 25.11 2 × 15 000
        # + Иван 40 000 + ипотека 18.11 17 000 = 117 000. Жизнь: 43 дня (19.10–30.11) × 1 000 = 43 000.
        self.assertEqual(p["start"], 5300000)
        self.assertEqual(p["income"], 10695000)
        self.assertEqual(p["obligations"], 11700000)
        self.assertEqual(p["life"], 4300000)
        self.assertEqual(p["end"], 5300000 + 10695000 - 11700000 - 4300000)
        # без зарплат: 53 000 − 30 000 − 6 × 1 000 = 17 000 к 24.10; 25.10 −16 000 → 1 000; 27.10 → −1 000
        self.assertEqual(p["cash_only_negative"], "2026-10-27")
        with self.assertRaises(ValueError):
            calc.cash_plan(self.conn, "2026-11-30", REF, basis="history")   # истории нет
        self.assertEqual(calc.cash_plan(self.conn, "2026-11-30", REF, basis="budget")["end"], p["end"])
        # ожидаемые доходы не стали деньгами
        self.assertEqual(calc.balance_sheet(self.conn, REF)["liquid"], 5300000)


class BudgetForecastTest(Base):
    def test_gap_detected_from_budget_without_history(self):
        self.conn.execute("UPDATE accounts SET opening_balance=0")
        self.conn.execute("UPDATE debts SET closed=1 WHERE creditor_type='bank'")  # без просрочки по кредиту
        self.conn.commit()
        sal = self.cat("Зарплата", "income")
        self.tx(date="2026-10-29", kind="income", status="planned", amount="13050", category_id=sal)
        f = calc.forecast(self.conn, REF)
        self.assertTrue(f["gap_unknown"])           # ни истории, ни бюджета — неизвестно, а не «всё хорошо»
        self.assertFalse(f["cash_gap"])
        ops.set_budget(self.conn, "2026-10", self.cat("Продукты и питание"), "31000")
        f = calc.forecast(self.conn, REF)
        self.assertEqual(f["spend_basis"], "budget")
        self.assertEqual(f["projected_spend"], 10 * 100000)   # 10 дней × 1 000 ₽
        self.assertTrue(f["cash_gap"])
        self.assertEqual(calc.expense_base(self.conn, REF), 3100000)  # нет истории: обязательные (0) + бюджет


class ForecastTest(Base):
    def test_forecast_until_next_income(self):
        ops.save_recurring(self.conn, {"name": "Аренда", "amount": "30000", "day": "1", "frequency": "monthly",
                                       "category_id": self.cat("Ипотека и жильё"), "start_date": "2026-07-01"})
        ops.save_recurring(self.conn, {"name": "Интернет", "amount": "700", "day": "22", "frequency": "monthly",
                                       "category_id": self.cat("Связь и подписки"), "start_date": "2026-07-01"})
        rec = self.conn.execute("SELECT id FROM recurring WHERE name='Аренда'").fetchone()[0]
        self.tx(date="2026-10-01", kind="expense", amount="30000", category_id=self.cat("Ипотека и жильё"),
                recurring_id=rec)
        self.tx(date="2026-11-05", kind="income", status="planned", amount="150000",
                category_id=self.cat("Зарплата", "income"))
        f = calc.forecast(self.conn, REF)
        # Доступно: 50000 − 30000 + 3000 = 23000. Просрочка: платежи по кредиту за август и сентябрь
        # (2 × 15000). До 05.11: интернет 22.10 (700), кредит 25.10 (15000), аренда 01.11 (30000).
        # Ноябрьская зарплата не учитывается.
        self.assertEqual(f["available"], 2300000)
        self.assertEqual(sum(o["remaining"] for o in f["overdue"]), 3000000)
        self.assertEqual(f["obligations_total"], 3000000 + 70000 + 1500000 + 3000000)
        self.assertEqual(f["free"], 2300000 - 7570000)
        self.assertEqual(f["days"], 17)
        self.assertTrue(f["cash_gap"])
        self.assertEqual(f["expected_not_counted"], 15000000)

    def test_debt_overdue_detected(self):
        f = calc.forecast(self.conn, date(2026, 11, 2))
        names = [o["name"] for o in f["overdue"]]
        self.assertIn("Платёж: Банк А", names)   # 25.10 не оплачен

    def test_allocation_sums_to_free(self):
        for i in range(30):
            d = date(2026, 9, 15 + i % 15).isoformat() if i < 15 else date(2026, 10, 1 + i % 15).isoformat()
            self.tx(date=d, kind="expense", amount="500", category_id=self.cat("Продукты и питание"))
        self.tx(date="2026-10-18", kind="income", amount="300000", category_id=self.cat("Зарплата", "income"))
        self.tx(date="2026-11-05", kind="income", status="planned", amount="150000",
                category_id=self.cat("Зарплата", "income"))
        a = calc.allocate(self.conn, REF)
        self.assertGreater(a["free"], 0)
        self.assertEqual(sum(x["amount"] for x in a["allocation"]), a["free"])
        self.assertTrue(any(x["kind"] == "debt" for x in a["allocation"]))
        self.assertFalse(any(x["kind"] == "capital" for x in a["allocation"]))  # нет инвестиций при долгах

    def test_allocation_without_data_refuses(self):
        a = calc.allocate(self.conn, REF)
        self.assertIsNone(a["free"])
        self.assertTrue(a["warnings"])


class TrackingTest(Base):
    def test_averages_ignore_untracked_months(self):
        # учёт начат 01.07; доход только в сентябре — среднее за 3 полных месяца (июль–сентябрь)
        self.tx(date="2026-09-05", kind="income", amount="90000", category_id=self.cat("Зарплата", "income"))
        self.assertEqual(calc.avg_monthly(self.conn, "income", ref=REF), 3000000)
        # если учёт начат в середине сентября — полных месяцев нет, среднее неизвестно
        self.conn.execute("UPDATE accounts SET opening_date='2026-09-15'")
        self.conn.execute("UPDATE debts SET start_date='2026-09-15'")
        self.conn.execute("UPDATE receivables SET start_date='2026-09-15'")
        self.conn.execute("UPDATE transactions SET date='2026-09-16'")
        self.conn.commit()
        self.assertIsNone(calc.avg_monthly(self.conn, "income", ref=REF))
        self.assertEqual(calc.leaks(self.conn, REF)[:0], [])

    def test_capital_growth_from_tracking_start(self):
        self.tx(date="2026-08-05", kind="income", amount="30000", category_id=self.cat("Зарплата", "income"))
        cap = next(g for g in calc.goals_progress(self.conn, REF) if g["kind"] == "capital")
        # рост +30000 за период с 19.07 (3 мес. назад, но учёт с 01.07) ≈ 3 мес.
        self.assertTrue(any("+" in d for d in cap["details"]), cap["details"])

    def test_debt_goal_unknown_without_debts(self):
        self.conn.execute("DELETE FROM debts")
        self.conn.execute("UPDATE accounts SET opening_balance=0 WHERE type='credit_card'")
        self.conn.commit()
        g = next(g for g in calc.goals_progress(self.conn, REF) if g["kind"] == "debt_free")
        self.assertEqual(g["eta"], "долги не внесены")


class GamblingTest(Base):
    def test_gambling_category_flagged(self):
        self.tx(date="2026-10-05", kind="income", amount="50000", category_id=self.cat("Зарплата", "income"))
        self.tx(date="2026-10-10", kind="expense", amount="5000", category_id=self.cat("Азартные игры"))
        self.assertTrue(any("Азартные игры" in x for x in calc.leaks(self.conn, REF)))
        self.assertTrue(calc.recommendations(self.conn, REF)[0].startswith("Азартные игры за 30 дней: 5"))

    def test_cushion_base_excludes_gambling(self):
        self.tx(date="2026-09-10", kind="expense", amount="20000", category_id=self.cat("Продукты и питание"))
        self.tx(date="2026-09-11", kind="expense", amount="50000", category_id=self.cat("Азартные игры"))
        # 3 полных месяца (июль–сентябрь): среднее расходов 70 000 / 3 минус среднее игр 50 000 / 3
        self.assertEqual(calc.expense_base(self.conn, REF), 7000000 // 3 - 5000000 // 3)

    def test_new_category_added_to_existing_db(self):
        self.conn.execute("DELETE FROM categories WHERE name='Азартные игры'")
        self.conn.commit()
        db.init(self.conn)
        self.assertTrue(self.cat("Азартные игры"))


class PayoffTest(unittest.TestCase):
    def test_simple_payoff(self):
        d = [{"id": 1, "name": "A", "balance": 1_200_000, "rate": 0, "min_payment": 100_000, "priority": 5}]
        self.assertEqual(calc.simulate_payoff(d)["months"], 12)
        d[0]["rate"] = 12.0
        sim = calc.simulate_payoff(d)
        self.assertEqual(sim["months"], 13)
        self.assertGreater(sim["total_interest"], 60_000)
        d[0]["min_payment"] = 10_000  # меньше процентов (12 000/мес)
        self.assertFalse(calc.simulate_payoff(d)["feasible"])

    def test_avalanche_beats_snowball_on_interest(self):
        d = [{"id": 1, "name": "Дорогой", "balance": 50_000_00, "rate": 30, "min_payment": 2_000_00, "priority": 5},
             {"id": 2, "name": "Дешёвый", "balance": 10_000_00, "rate": 5, "min_payment": 1_000_00, "priority": 5}]
        av = calc.simulate_payoff(d, 5_000_00, "avalanche")
        sb = calc.simulate_payoff(d, 5_000_00, "snowball")
        self.assertLessEqual(av["total_interest"], sb["total_interest"])


class DataTest(Base):
    def test_csv_roundtrip_and_atomic_import(self):
        self.tx(date="2026-10-05", kind="income", amount="1000,50", category_id=self.cat("Зарплата", "income"),
                description='Аванс; "сентябрь"')
        self.tx(date="2026-10-10", kind="debt_payment", amount="15000", principal="9000", debt_id=self.bank)
        text = csvio.export_transactions(self.conn)
        r0 = csvio.import_transactions(self.conn, text)          # свой же экспорт — всё дубликаты
        self.assertEqual((r0["added"], r0["skipped"]), (0, 2))
        self.conn.execute("DELETE FROM transactions")
        self.conn.commit()
        r = csvio.import_transactions(self.conn, text)
        self.assertEqual(r["errors"], [])
        self.assertEqual(r["added"], 2)
        self.assertEqual(csvio.export_transactions(self.conn), text)
        r2 = csvio.import_transactions(self.conn, text)
        self.assertEqual((r2["added"], r2["skipped"]), (0, 2))
        bad = text + "2026-10-11;Расход;;abc;Карта;;Прочее;;;;;;\r\n2026-10-12;Расход;;100;Карта;;Прочее;;;;;;x\r\n"
        r3 = csvio.import_transactions(self.conn, bad)
        self.assertEqual(r3["added"], 0)
        self.assertEqual(len(r3["errors"]), 1)
        self.assertEqual(self.conn.execute("SELECT COUNT(*) FROM transactions").fetchone()[0], 2)
        # две одинаковые покупки в одном файле — обе сохраняются, повторный импорт их не задваивает
        twins = "Дата;Вид;Сумма;Счёт;Категория\n2026-10-13;Расход;250;Карта;Прочее\n2026-10-13;Расход;250;Карта;Прочее\n"
        self.assertEqual(csvio.import_transactions(self.conn, twins)["added"], 2)
        self.assertEqual(csvio.import_transactions(self.conn, twins)["added"], 0)

    def test_recurring_link_survives_csv(self):
        rid = ops.save_recurring(self.conn, {"name": "Ипотека", "amount": "17000", "day": "18",
                                             "category_id": self.cat("Ипотека и жильё"), "start_date": "2026-09-01"})
        self.tx(date="2026-09-17", kind="expense", amount="17000", category_id=self.cat("Ипотека и жильё"),
                recurring_id=rid)
        text = csvio.export_transactions(self.conn)
        self.assertIn(";Ипотека", text)
        self.conn.execute("DELETE FROM transactions")
        self.conn.commit()
        self.assertEqual(csvio.import_transactions(self.conn, text)["added"], 1)
        self.assertEqual(self.conn.execute("SELECT recurring_id FROM transactions").fetchone()[0], rid)

    def test_table_export_import(self):
        text = csvio.export_table(self.conn, "debts")
        self.conn.execute("UPDATE debts SET rate=1")
        self.conn.commit()
        r = csvio.import_table(self.conn, "debts", text)
        self.assertEqual(r["errors"], [])
        self.assertEqual(self.conn.execute("SELECT rate FROM debts WHERE id=?", (self.bank,)).fetchone()[0], 24)
        broken = text.replace("bank", "alien")
        r = csvio.import_table(self.conn, "debts", broken)
        self.assertTrue(r["errors"])

    def test_backup_restore(self):
        self.tx(date="2026-10-05", kind="income", amount="1000", category_id=self.cat("Зарплата", "income"))
        path = backup.create(self.conn, "manual")
        self.assertTrue(backup.verify(path))
        self.conn.execute("DELETE FROM transactions")
        self.conn.commit()
        safety = backup.restore(self.conn, path)
        self.assertTrue(safety.exists())
        self.assertEqual(self.conn.execute("SELECT COUNT(*) FROM transactions").fetchone()[0], 1)
        Path(self.tmp.name, "bad.db").write_bytes(b"not a db")
        with self.assertRaises(RuntimeError):
            backup.restore(self.conn, Path(self.tmp.name, "bad.db"))

    def test_reports_render(self):
        self.tx(date="2026-10-05", kind="income", amount="1000", category_id=self.cat("Зарплата", "income"))
        text = reports.full_report(self.conn, REF)
        for part in ("Баланс", "Прогноз", "Долги", "Финансовые цели", "Аудит"):
            self.assertIn(part, text)
        self.assertIn("Иван", reports.debts(self.conn, REF))
        reports.salary(self.conn, REF)
        reports.budget(self.conn, "2026-10")
        reports.income(self.conn, REF)

    def test_goals(self):
        gs = calc.goals_progress(self.conn, REF)
        names = [g["name"] for g in gs]
        self.assertIn("Доход 200 000 ₽ в месяц", names)
        car = next(g for g in gs if g["name"] == "Покупка автомобиля")
        self.assertIsNone(car["target"])
        self.assertEqual(car["eta"], "неизвестно")


if __name__ == "__main__":
    unittest.main()
