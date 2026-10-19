"""Локальный веб-интерфейс на стандартной библиотеке (http.server).

Слушает только 127.0.0.1. Все изменяющие запросы — POST с CSRF-токеном,
заголовок Host проверяется (защита от DNS rebinding)."""

import html
import re
import secrets
import sqlite3
import threading
from datetime import date
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, quote, urlparse

from . import backup, calc, checks, csvio, db, ops, reports
from .money import fmt, to_plain

CSRF = secrets.token_urlsafe(24)
_lock = threading.Lock()


def h(x):
    return html.escape("" if x is None else str(x))


def m(kop, sign=False):
    cls = "neg" if kop is not None and kop < 0 else ""
    return f'<span class="num {cls}">{h(fmt(kop, sign))}</span>'


def money_input(kop):
    return "" if kop is None else to_plain(kop).replace(".", ",")


# ------------------------------------------------------------- mini-markdown

def _inline(s):
    s = h(s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", s)
    s = re.sub(r"(?<![\w/])_(.+?)_(?!\w)", r"<i>\1</i>", s)
    return s.replace("\\*", "*")


def md(text):
    out, para, lst, table = [], [], None, []

    def flush():
        nonlocal para, lst, table
        if para:
            out.append("<p>" + " ".join(_inline(p) for p in para) + "</p>")
            para = []
        if lst:
            tag, items = lst
            out.append(f"<{tag}>" + "".join(f"<li>{_inline(i)}</li>" for i in items) + f"</{tag}>")
            lst = None
        if table:
            rows = [r for r in table if not re.fullmatch(r"\|(-+\|)+", r.replace(" ", ""))]
            cells = [[c.strip() for c in r.strip().strip("|").split("|")] for r in rows]
            body = "".join("<tr>" + "".join(f"<td>{_inline(c)}</td>" for c in r) + "</tr>" for r in cells[1:])
            out.append('<div class="tw"><table><thead><tr>' + "".join(f"<th>{_inline(c)}</th>" for c in cells[0])
                       + f"</tr></thead><tbody>{body}</tbody></table></div>")
            table = []

    for line in text.splitlines():
        s = line.rstrip()
        if s.startswith("<details><summary>"):
            flush()
            out.append("<details><summary>" + h(s[18:].replace("</summary>", "")) + "</summary>")
            continue
        if s == "</details>":
            flush()
            out.append("</details>")
            continue
        if s.startswith("|"):
            if para or lst:
                flush()
            table.append(s)
            continue
        if table:
            flush()
        mh = re.match(r"(#{1,4}) (.*)", s)
        ml = re.match(r"(- |\d+\. )(.*)", s)
        if mh:
            flush()
            lvl = min(4, len(mh.group(1)) + 1)
            out.append(f"<h{lvl}>{_inline(mh.group(2))}</h{lvl}>")
        elif ml:
            tag = "ul" if ml.group(1) == "- " else "ol"
            if para or (lst and lst[0] != tag):
                flush()
            if not lst:
                lst = (tag, [])
            lst[1].append(ml.group(2))
        elif not s.strip():
            flush()
        else:
            if lst:
                flush()
            para.append(s)
    flush()
    return "\n".join(out)


# ------------------------------------------------------------------ layout

NAV = [("/", "Сводка"), ("/tx", "Операции"), ("/add", "+ Операция"), ("/accounts", "Счета"), ("/debts", "Долги"),
       ("/receivables", "Мне должны"), ("/recurring", "Платежи"), ("/budget", "Бюджет"), ("/salary", "Зарплата"),
       ("/forecast", "Прогноз"), ("/goals", "Цели"), ("/report", "Отчёт"), ("/audit", "Аудит"),
       ("/income", "Рост дохода"), ("/data", "Данные")]

CSS = """
:root{--bg:#f6f7f9;--card:#fff;--ink:#1d2433;--muted:#667085;--line:#e3e6eb;--acc:#1f6feb;--neg:#c62828;--pos:#1b7f3b;--warn:#b26a00}
@media (prefers-color-scheme:dark){:root{--bg:#12151b;--card:#1b2029;--ink:#e6e9ef;--muted:#98a2b3;--line:#2b3240;--acc:#5b9dff;--neg:#ff6b6b;--pos:#4cc27a;--warn:#ffb74d}}
*{box-sizing:border-box}body{margin:0;font:15px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:var(--bg);color:var(--ink)}
header{background:var(--card);border-bottom:1px solid var(--line);padding:8px 16px;position:sticky;top:0;z-index:2}
header b{margin-right:12px}nav{display:flex;flex-wrap:wrap;gap:2px 4px;align-items:center}
nav a{color:var(--ink);text-decoration:none;padding:4px 8px;border-radius:6px}nav a.on,nav a:hover{background:var(--bg);color:var(--acc)}
main{max-width:1180px;margin:0 auto;padding:16px}h1{font-size:22px;margin:4px 0 12px}h2{font-size:18px;margin:20px 0 8px}h3{font-size:16px;margin:16px 0 6px}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-bottom:14px}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px}.card .l{color:var(--muted);font-size:13px}.card .v{font-size:20px;font-weight:600;margin-top:2px}
.card.main{border-color:var(--acc)}.box{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px 14px;margin-bottom:14px}
.tw{overflow-x:auto}table{border-collapse:collapse;width:100%;background:var(--card)}th,td{border-bottom:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}
th{font-size:13px;color:var(--muted);font-weight:600}.num{white-space:nowrap;font-variant-numeric:tabular-nums}.neg{color:var(--neg)}.pos{color:var(--pos)}
form.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px 12px;align-items:end}
label{display:flex;flex-direction:column;font-size:13px;color:var(--muted);gap:3px}
input,select,textarea{font:inherit;padding:6px 8px;border:1px solid var(--line);border-radius:6px;background:var(--bg);color:var(--ink);width:100%}
textarea{min-height:160px;font-family:ui-monospace,Consolas,monospace;font-size:13px}
button,.btn{font:inherit;padding:7px 14px;border-radius:6px;border:1px solid var(--acc);background:var(--acc);color:#fff;cursor:pointer;text-decoration:none;display:inline-block}
button.sec,.btn.sec{background:transparent;color:var(--acc)}button.danger{background:transparent;border-color:var(--neg);color:var(--neg)}
form.inline{display:inline}form.inline button{padding:2px 8px;font-size:13px}
.msg{padding:8px 12px;border-radius:8px;margin-bottom:12px;background:#e7f5ec;color:#14532d}.err{background:#fdecec;color:#7f1d1d}
@media (prefers-color-scheme:dark){.msg{background:#183b26;color:#c6f6d5}.err{background:#4a1d1d;color:#fecaca}}
.muted{color:var(--muted)}.warn{color:var(--warn)}.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
details{margin:8px 0}summary{cursor:pointer;color:var(--acc)}.bar{height:8px;background:var(--line);border-radius:4px;overflow:hidden}.bar i{display:block;height:100%;background:var(--acc)}
svg.chart{width:100%;height:140px;background:var(--card);border:1px solid var(--line);border-radius:10px}
"""


def page(path, title, body, msg=None, err=None):
    nav = "".join(f'<a href="{u}" class="{"on" if u == path else ""}">{h(t)}</a>' for u, t in NAV)
    flash = (f'<div class="msg">{h(msg)}</div>' if msg else "") + (f'<div class="msg err">{h(err)}</div>' if err else "")
    return f"""<!doctype html><html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>{h(title)} — Финансы</title>
<style>{CSS}</style></head><body><header><nav><b>₽ Финансы</b>{nav}</nav></header>
<main><h1>{h(title)}</h1>{flash}{body}</main></body></html>"""


def csrf():
    return f'<input type="hidden" name="csrf" value="{CSRF}">'


def select(name, options, selected=None, empty=None, attrs=""):
    sel = "" if selected is None else str(selected)
    opts = f'<option value="">{h(empty)}</option>' if empty is not None else ""
    for v, label in options:
        if isinstance(label, list):  # optgroup
            opts += f'<optgroup label="{h(v)}">' + "".join(
                f'<option value="{h(vv)}"{" selected" if str(vv) == sel else ""}>{h(ll)}</option>' for vv, ll in label
            ) + "</optgroup>"
        else:
            opts += f'<option value="{h(v)}"{" selected" if str(v) == sel else ""}>{h(label)}</option>'
    return f'<select name="{name}" {attrs}>{opts}</select>'


def field(label, name, value="", type_="text", extra=""):
    return f'<label>{h(label)}<input type="{type_}" name="{name}" value="{h(value)}" {extra}></label>'


def del_button(action, id_, text="удалить"):
    return (f'<form class="inline" method="post" action="{action}" onsubmit="return confirm(\'Удалить?\')">{csrf()}'
            f'<input type="hidden" name="id" value="{id_}"><button class="danger">{h(text)}</button></form>')


# ------------------------------------------------------------------ pages

def p_dashboard(conn, q):
    ref = date.today()
    bs = calc.balance_sheet(conn, ref)
    f = calc.forecast(conn, ref)
    flow = calc.cash_flow(conn, ref.replace(day=1), ref)
    cards = [("Фактически доступно", bs["liquid"], "main"), ("Свободно до дохода", f["free"], ""),
             ("Можно в день", f["daily_allowance"], ""), ("Накопления", bs["reserve"] + bs["investments"], ""),
             ("Я должен", -bs["total_debt"], ""), ("Мне должны", bs["receivable_total"], ""),
             ("Ожидается (не учтено)", bs["expected_total"], ""), ("Чистый капитал", bs["net_worth"], "")]
    body = '<div class="cards">' + "".join(
        f'<div class="card {c}"><div class="l">{h(l)}</div><div class="v">{m(v)}</div></div>' for l, v, c in cards
    ) + "</div>"
    if not bs["accounts"]:
        body += ('<div class="box"><b>С чего начать.</b><ol><li>Внесите счета с <b>фактическими</b> остатками на сегодня '
                 '(<a href="/accounts">Счета</a>).</li><li>Внесите долги: банки и людей (<a href="/debts">Долги</a>), '
                 'и кто должен вам (<a href="/receivables">Мне должны</a>).</li><li>Добавьте обязательные платежи '
                 '(<a href="/recurring">Платежи</a>) и дату следующей зарплаты — доход со статусом «запланирована» '
                 '(<a href="/add?kind=income&status=planned">добавить</a>).</li><li>Записывайте операции '
                 '(<a href="/add">+ Операция</a>) или импортируйте CSV (<a href="/data">Данные</a>).</li></ol></div>')
    recs = calc.recommendations(conn, ref)
    if recs:
        body += '<div class="box"><h3 style="margin-top:0">Что важно сейчас</h3><ul>' + "".join(
            f"<li>{h(r)}</li>" for r in recs) + "</ul></div>"
    body += '<div class="box">' + md(reports.forecast(conn, ref).split("\n", 1)[1]) + chart(conn) + "</div>"
    body += (f'<div class="box"><h3 style="margin-top:0">Текущий месяц</h3>Доходы {m(flow["income"])} · '
             f'расходы {m(-flow["expenses"])} · погашено тела долга {m(-flow["principal"])} · '
             f'отложено {m(flow["to_savings"])} · поток после долгов {m(flow["net_after_debt"], True)}</div>')
    return "Сводка", body


def chart(conn):
    series = calc.daily_series(conn)
    if len(series) < 2:
        return ""
    vals = [v for _, v in series]
    lo, hi = min(vals + [0]), max(vals + [0])
    span = (hi - lo) or 1
    W, H = 600, 120
    pts = " ".join(f"{i * W / (len(vals) - 1):.1f},{H - (v - lo) * H / span:.1f}" for i, v in enumerate(vals))
    zero = H - (0 - lo) * H / span
    return (f'<p class="muted">Ожидаемый остаток доступных денег по дням до {h(series[-1][0])} '
            f'(обязательные платежи по датам + средние траты):</p>'
            f'<svg class="chart" viewBox="0 -5 {W} {H + 10}" preserveAspectRatio="none">'
            f'<line x1="0" x2="{W}" y1="{zero:.1f}" y2="{zero:.1f}" stroke="var(--neg)" stroke-dasharray="4"/>'
            f'<polyline fill="none" stroke="var(--acc)" stroke-width="2" points="{pts}"/></svg>')


def _options(conn):
    accs = [(a["id"], f"{a['name']} ({fmt(a['balance'])})") for a in calc.account_balances(conn) if not a["archived"]]
    cats_in = [(c["id"], c["name"]) for c in conn.execute(
        "SELECT * FROM categories WHERE kind='income' AND role<>'service' ORDER BY id")]
    cats_ex = [(c["id"], c["name"]) for c in conn.execute(
        "SELECT * FROM categories WHERE kind='expense' AND role<>'service' ORDER BY id")]
    debts = [(d["id"], f"{d['name']} (остаток {fmt(d['balance'])})") for d in calc.debt_balances(conn)
             if not d["closed"]]
    rcv = [(r["id"], f"{r['name']} ({fmt(r['balance'])})") for r in calc.receivable_balances(conn) if not r["closed"]]
    goals = [(g["id"], g["name"]) for g in conn.execute("SELECT * FROM goals WHERE active=1 ORDER BY priority")]
    rec = [(r["id"], f"{r['name']} ({fmt(r['amount'])})") for r in conn.execute("SELECT * FROM recurring WHERE active=1")]
    return accs, cats_in, cats_ex, debts, rcv, goals, rec


TX_JS = """<script>
(function(){const f=document.getElementById('txf');if(!f)return;
const show={income:['account','category','recurring_x','goal'],expense:['account','category','recurring','goal'],
transfer:['account','to_account','goal'],debt_payment:['account','debt','principal'],debt_draw:['account','debt'],
debt_adjust:['debt'],lend:['account','receivable'],lend_return:['account','receivable'],adjustment:['account']};
function upd(){const k=f.kind.value;f.querySelectorAll('[data-f]').forEach(e=>{e.style.display=(show[k]||[]).includes(e.dataset.f)?'':'none'});
f.querySelectorAll('optgroup').forEach(g=>{g.disabled=!(g.label==='Доходы'?k==='income':k==='expense')});
const st=f.status;[...st.options].forEach(o=>{if(o.value==='planned')o.disabled=!['income','expense','transfer','debt_payment'].includes(k)});}
f.kind.addEventListener('change',upd);upd();})();
</script>"""


def tx_form(conn, q, tx=None):
    accs, cats_in, cats_ex, debts, rcv, goals, rec = _options(conn)
    t = dict(tx) if tx else {}
    kind = t.get("kind") or q.get("kind", "expense")
    status = t.get("status") or q.get("status", "done")
    amt = money_input(t["amount"]) if "amount" in t else ""
    pr = money_input(t.get("principal")) if t.get("principal") is not None else ""
    wrap = lambda key, html_: f'<div data-f="{key}">{html_}</div>'  # noqa: E731
    return f"""<form id="txf" class="grid box" method="post" action="/tx/save">{csrf()}
<input type="hidden" name="id" value="{h(t.get('id', ''))}">
<label>Вид операции{select('kind', db.TX_KINDS.items(), kind)}</label>
<label>Статус{select('status', db.TX_STATUSES.items(), status)}</label>
{field('Дата', 'date', t.get('date') or date.today().isoformat(), 'date', 'required')}
{field('Сумма, ₽', 'amount', amt, 'text', 'required inputmode="decimal" placeholder="12 345,67"')}
{wrap('account', '<label>Счёт / способ оплаты' + select('account_id', accs, t.get('account_id'), '—') + '</label>')}
{wrap('to_account', '<label>Счёт зачисления' + select('to_account_id', accs, t.get('to_account_id'), '—') + '</label>')}
{wrap('category', '<label>Категория' + select('category_id', [('Доходы', cats_in), ('Расходы', cats_ex)], t.get('category_id'), '—') + '</label>')}
{wrap('category', field('Подкатегория', 'subcategory', t.get('subcategory', ''), 'text', 'placeholder="необязательно"'))}
{wrap('debt', '<label>Долг' + select('debt_id', debts, t.get('debt_id'), '—') + '</label>')}
{wrap('principal', field('Из них основной долг, ₽', 'principal', pr, 'text', 'placeholder="пусто = весь платёж"'))}
{wrap('receivable', '<label>Кто должен' + select('receivable_id', rcv, t.get('receivable_id'), '—') + '</label>')}
{wrap('recurring', '<label>Обязательный платёж' + select('recurring_id', rec, t.get('recurring_id'), 'не связан') + '</label>')}
{wrap('goal', '<label>Финансовая цель' + select('goal_id', goals, t.get('goal_id'), 'не связана') + '</label>')}
{field('Описание', 'description', t.get('description', ''))}
<div><button>{'Сохранить' if t else 'Добавить'}</button></div></form>
<p class="muted">Сверка долга — если банк показывает другой остаток: положительная сумма увеличивает долг,
отрицательная уменьшает. Корректировка счёта — разница с фактическим остатком или переоценка имущества (со знаком).
Ожидаемая зарплата — «Доход» со статусом «Запланирована»: в деньги не входит, пока не отметите поступление.</p>{TX_JS}"""


def p_add(conn, q):
    tx = None
    if q.get("id"):
        tx = conn.execute("SELECT * FROM transactions WHERE id=?", (int(q["id"]),)).fetchone()
    return ("Редактировать операцию" if tx else "Новая операция"), tx_form(conn, q, tx)


def p_tx(conn, q):
    month = q.get("month") or calc.ym(date.today())
    where, params = ["1=1"], []
    if month != "all":
        s, e = calc.month_bounds(month)
        where.append("t.date BETWEEN ? AND ?")
        params += [s.isoformat(), e.isoformat()]
    for key in ("kind", "status", "account_id", "category_id"):
        if q.get(key):
            if key == "account_id":
                where.append("(t.account_id=? OR t.to_account_id=?)")
                params += [q[key], q[key]]
            else:
                where.append(f"t.{key}=?")
                params.append(q[key])
    if q.get("q"):
        where.append("(t.description LIKE ? OR t.subcategory LIKE ?)")
        params += [f"%{q['q']}%"] * 2
    rows = conn.execute(f"""SELECT t.*, a.name acc, ta.name to_acc, c.name cat, d.name debt, r.name rcv, g.name goal
        FROM transactions t LEFT JOIN accounts a ON a.id=t.account_id LEFT JOIN accounts ta ON ta.id=t.to_account_id
        LEFT JOIN categories c ON c.id=t.category_id LEFT JOIN debts d ON d.id=t.debt_id
        LEFT JOIN receivables r ON r.id=t.receivable_id LEFT JOIN goals g ON g.id=t.goal_id
        WHERE {' AND '.join(where)} ORDER BY t.date DESC, t.id DESC LIMIT 1000""", params).fetchall()
    accs, cats_in, cats_ex, *_ = _options(conn)
    months = sorted({r[0] for r in conn.execute("SELECT substr(date,1,7) FROM transactions")} | {calc.ym(date.today())},
                    reverse=True)
    filt = f"""<form class="row box" method="get">
{select('month', [(x, x) for x in months] + [('all', 'все месяцы')], month)}
{select('kind', db.TX_KINDS.items(), q.get('kind'), 'все виды')}
{select('status', db.TX_STATUSES.items(), q.get('status'), 'все статусы')}
{select('account_id', accs, q.get('account_id'), 'все счета')}
{select('category_id', [('Доходы', cats_in), ('Расходы', cats_ex)], q.get('category_id'), 'все категории')}
<input name="q" value="{h(q.get('q', ''))}" placeholder="поиск в описании" style="max-width:200px">
<button class="sec">Показать</button> <a class="btn" href="/add">+ Операция</a></form>"""
    trs = []
    for t in rows:
        sign = {"income": 1, "debt_draw": 1, "lend_return": 1, "expense": -1, "debt_payment": -1, "lend": -1}.get(t["kind"])
        amount = t["amount"] * sign if sign else t["amount"]
        where_ = t["acc"] or ""
        if t["kind"] == "transfer":
            where_ += f" → {t['to_acc']}"
        what = " / ".join(x for x in (t["cat"] if t["kind"] in ("income", "expense") else None, t["subcategory"],
                                      t["debt"], t["rcv"], t["goal"] and "цель: " + t["goal"]) if x)
        if t["kind"] == "debt_payment":
            what += f" (тело {fmt(t['principal'])}, проценты {fmt(t['amount'] - t['principal'])})"
        actions = f'<a href="/add?id={t["id"]}">изм.</a> ' + del_button("/tx/delete", t["id"], "×")
        if t["status"] == "planned":
            actions = (f'<form class="inline" method="post" action="/tx/complete">{csrf()}<input type="hidden" name="id" '
                       f'value="{t["id"]}"><input type="date" name="date" value="{date.today().isoformat()}" '
                       f'style="width:auto"><input name="amount" placeholder="факт. сумма" style="width:110px">'
                       f'<button>проведено</button></form> ') + actions
        st = "" if t["status"] == "done" else f' <span class="warn">[{db.TX_STATUSES[t["status"]]}]</span>'
        trs.append(f"<tr><td class='num'>{h(t['date'])}</td><td>{h(db.TX_KINDS[t['kind']])}{st}</td>"
                   f"<td>{m(amount, sign is not None)}</td><td>{h(where_)}</td><td>{h(what)}</td>"
                   f"<td>{h(t['description'])}</td><td>{actions}</td></tr>")
    table = ('<div class="tw"><table><thead><tr><th>Дата</th><th>Вид</th><th>Сумма</th><th>Счёт</th><th>Категория / '
             'связь</th><th>Описание</th><th></th></tr></thead><tbody>' + "".join(trs) + "</tbody></table></div>")
    if not rows:
        table = '<p class="muted">Операций нет.</p>'
    return "Операции", filt + table


def p_accounts(conn, q):
    edit = conn.execute("SELECT * FROM accounts WHERE id=?", (int(q["edit"]),)).fetchone() if q.get("edit") else None
    e = dict(edit) if edit else {}
    rows = "".join(
        f"<tr><td>{h(a['name'])}{' <span class=muted>(архив)</span>' if a['archived'] else ''}</td>"
        f"<td>{h(db.ACCOUNT_TYPES[a['type']])}</td><td>{m(a['balance'])}</td>"
        f"<td class='muted'>{m(a['opening_balance'])} на {h(a['opening_date'])}</td><td>{h(a['note'])}</td>"
        f"<td><a href='/accounts?edit={a['id']}'>изм.</a> <a href='/tx?account_id={a['id']}&month=all'>операции</a> "
        f"{del_button('/accounts/delete', a['id'], '×')}</td></tr>" for a in calc.account_balances(conn))
    lst = ('<div class="tw"><table><thead><tr><th>Счёт</th><th>Тип</th><th>Остаток</th><th>Начальный остаток</th>'
           f'<th>Заметка</th><th></th></tr></thead><tbody>{rows}</tbody></table></div>') if rows else \
        '<p class="muted">Счетов нет.</p>'
    form = f"""<h2>{'Изменить счёт' if e else 'Добавить счёт'}</h2>
<form class="grid box" method="post" action="/accounts/save">{csrf()}<input type="hidden" name="id" value="{h(e.get('id', ''))}">
{field('Название', 'name', e.get('name', ''), 'text', 'required placeholder="Сбер дебет"')}
<label>Тип{select('type', db.ACCOUNT_TYPES.items(), e.get('type', 'debit'))}</label>
{field('Остаток на дату, ₽ (кредитка: долг со знаком минус)', 'opening_balance', money_input(e.get('opening_balance', 0)))}
{field('Дата остатка', 'opening_date', e.get('opening_date') or date.today().isoformat(), 'date', 'required')}
{field('Заметка', 'note', e.get('note', ''))}
<label><span><input type="checkbox" name="archived" style="width:auto" {'checked' if e.get('archived') else ''}> в архиве</span></label>
<div><button>Сохранить</button></div></form>
<p class="muted">Вносите остаток, который видите в банке на эту дату <b>до</b> операций этого дня. Более ранние операции
по счёту на остаток не влияют. Пароли и коды от банков системе не нужны и не запрашиваются.</p>"""
    return "Счета", lst + form


def p_debts(conn, q):
    edit = conn.execute("SELECT * FROM debts WHERE id=?", (int(q["edit"]),)).fetchone() if q.get("edit") else None
    e = dict(edit) if edit else {}
    try:
        extra = ops._money(q.get("extra") or "0", allow_zero=True)
    except ops.ValidationError:
        extra = 0
    actions = "".join(f"<li>{h(d['name'])}: <a href='/debts?edit={d['id']}'>изменить</a> · "
                      f"<a href='/add?kind=debt_payment'>внести платёж</a> · {del_button('/debts/delete', d['id'], 'удалить')}</li>"
                      for d in calc.debt_balances(conn))
    calc_form = f"""<form class="row box" method="get">Сколько сверх минимальных платежей можете направлять в месяц:
<input name="extra" value="{h(money_input(extra))}" style="max-width:140px"> ₽ <button class="sec">Пересчитать план</button></form>"""
    form = f"""<h2>{'Изменить долг' if e else 'Добавить долг'}</h2>
<form class="grid box" method="post" action="/debts/save">{csrf()}<input type="hidden" name="id" value="{h(e.get('id', ''))}">
{field('Кредитор (банк или человек)', 'creditor', e.get('creditor', ''), 'text', 'required')}
{field('Название долга', 'name', e.get('name', ''), 'text', 'placeholder="по умолчанию = кредитор"')}
<label>Тип кредитора{select('creditor_type', db.CREDITOR_TYPES.items(), e.get('creditor_type', 'bank'))}</label>
<label>Вид{select('kind', db.DEBT_KINDS.items(), e.get('kind', 'loan'))}</label>
{field('Остаток основного долга, ₽', 'balance_start', money_input(e.get('balance_start')), 'text', 'required')}
{field('На дату', 'start_date', e.get('start_date') or date.today().isoformat(), 'date', 'required')}
{field('Ставка, % годовых', 'rate', '' if e.get('rate') is None else e['rate'], 'text', 'placeholder="пусто = неизвестно"')}
{field('Минимальный платёж, ₽', 'min_payment', money_input(e.get('min_payment')), 'text', 'placeholder="пусто = неизвестно"')}
{field('День платежа', 'payment_day', e.get('payment_day') or '', 'number', 'min=1 max=31')}
{field('Срок полного возврата', 'due_date', e.get('due_date') or '', 'date')}
{field('Штрафы / пени', 'penalty', e.get('penalty', ''))}
{field('Приоритет (1 — важнейший)', 'priority', e.get('priority', 5), 'number', 'min=1 max=10')}
{field('Заметка (договорённости, отношения)', 'note', e.get('note', ''))}
<label><span><input type="checkbox" name="closed" style="width:auto" {'checked' if e.get('closed') else ''}> закрыт</span></label>
<div><button>Сохранить</button></div></form>
<p class="muted">Кредитные карты ведутся как счета типа «Кредитная карта» (отрицательный остаток = долг), чтобы не было двойного учёта.
Платёж по долгу — операция «Платёж по долгу»: укажите, сколько из платежа ушло в основной долг (из графика банка), остальное — проценты.</p>"""
    return "Долги", calc_form + md(reports.debts(conn, extra=extra).split("\n", 1)[1]) + \
        (f"<h3>Действия</h3><ul>{actions}</ul>" if actions else "") + form


def p_receivables(conn, q):
    edit = conn.execute("SELECT * FROM receivables WHERE id=?", (int(q["edit"]),)).fetchone() if q.get("edit") else None
    e = dict(edit) if edit else {}
    today_ = date.today().isoformat()
    rows = "".join(
        f"<tr><td>{h(r['debtor'])}</td><td>{h(r['name'])}</td><td>{m(r['balance'])}</td>"
        f"<td>{h(r['due_date'] or 'неизвестно')}{' <span class=warn>просрочено</span>' if r['due_date'] and r['due_date'] < today_ and r['balance'] > 0 else ''}</td>"
        f"<td>{h(r['note'])}</td><td><a href='/receivables?edit={r['id']}'>изм.</a> "
        f"<a href='/add?kind=lend_return'>вернули</a> {del_button('/receivables/delete', r['id'], '×')}</td></tr>"
        for r in calc.receivable_balances(conn))
    lst = ('<div class="tw"><table><thead><tr><th>Кто</th><th>За что</th><th>Остаток</th><th>Срок</th><th>Заметка</th>'
           f'<th></th></tr></thead><tbody>{rows}</tbody></table></div>') if rows else '<p class="muted">Никто не должен.</p>'
    form = f"""<h2>{'Изменить' if e else 'Добавить'}</h2>
<form class="grid box" method="post" action="/receivables/save">{csrf()}<input type="hidden" name="id" value="{h(e.get('id', ''))}">
{field('Кто должен', 'debtor', e.get('debtor', ''), 'text', 'required')}
{field('Название', 'name', e.get('name', ''), 'text', 'placeholder="по умолчанию = имя"')}
{field('Сумма долга на дату, ₽', 'amount_start', money_input(e.get('amount_start')), 'text', 'required')}
{field('Дата', 'start_date', e.get('start_date') or today_, 'date', 'required')}
{field('Обещанный срок возврата', 'due_date', e.get('due_date') or '', 'date')}
{field('Заметка', 'note', e.get('note', ''))}
<label><span><input type="checkbox" name="closed" style="width:auto" {'checked' if e.get('closed') else ''}> закрыто</span></label>
<div><button>Сохранить</button></div></form>
<p class="muted">Дебиторка не входит в доступные деньги. Новый заём другу — операция «Дал в долг», возврат — «Мне вернули долг»
(это не доход и не идёт в цель по доходу).</p>"""
    return "Мне должны", lst + form


def p_recurring(conn, q):
    edit = conn.execute("SELECT * FROM recurring WHERE id=?", (int(q["edit"]),)).fetchone() if q.get("edit") else None
    e = dict(edit) if edit else {}
    cats = [(c["id"], c["name"]) for c in conn.execute("SELECT * FROM categories WHERE kind='expense' AND role<>'service'")]
    rows = ""
    for r in conn.execute("SELECT r.*, c.name cat FROM recurring r LEFT JOIN categories c ON c.id=r.category_id"):
        when = f"{db.FREQUENCIES[r['frequency']]}, {'день недели' if r['frequency'] == 'weekly' else 'число'} {r['day']}"
        if r["month"]:
            when += f", месяц {r['month']}"
        rows += (f"<tr><td>{h(r['name'])}</td><td>{m(r['amount'])}</td><td>{h(when)}</td>"
                 f"<td>{h(r['cat'] or '')}</td><td>{'активен' if r['active'] else 'выключен'}</td>"
                 f"<td><a href='/recurring?edit={r['id']}'>изм.</a> {del_button('/recurring/delete', r['id'], '×')}</td></tr>")
    lst = ('<div class="tw"><table><thead><tr><th>Платёж</th><th>Сумма</th><th>Когда</th><th>Категория</th><th></th><th></th>'
           f'</tr></thead><tbody>{rows}</tbody></table></div>') if rows else '<p class="muted">Обязательных платежей нет.</p>'
    s, e_ = calc.month_bounds(calc.ym(date.today()))
    obl = calc.obligations(conn, s, e_)
    month = "".join(f"<tr><td class='num'>{h(o['date'])}</td><td>{h(o['name'])}</td><td>{m(o['amount'])}</td>"
                    f"<td>{'<span class=pos>оплачено</span>' if o['remaining'] == 0 else m(o['remaining'])}</td></tr>"
                    for o in obl)
    load = calc.monthly_obligation_load(conn)
    form = f"""<h2>{'Изменить' if e else 'Добавить обязательный платёж'}</h2>
<form class="grid box" method="post" action="/recurring/save">{csrf()}<input type="hidden" name="id" value="{h(e.get('id', ''))}">
{field('Название', 'name', e.get('name', ''), 'text', 'required placeholder="Аренда, ЖКУ, связь"')}
{field('Сумма, ₽', 'amount', money_input(e.get('amount')), 'text', 'required')}
<label>Категория{select('category_id', cats, e.get('category_id'), '—')}</label>
<label>Периодичность{select('frequency', db.FREQUENCIES.items(), e.get('frequency', 'monthly'))}</label>
{field('Число месяца (для еженедельных — день недели 1–7)', 'day', e.get('day', ''), 'number', 'required min=1 max=31')}
{field('Месяц (для ежегодных)', 'month', e.get('month') or '', 'number', 'min=1 max=12')}
{field('Действует с', 'start_date', e.get('start_date') or date.today().isoformat(), 'date', 'required')}
{field('Действует по', 'end_date', e.get('end_date') or '', 'date')}
<label>Статус{select('active', [(1, 'активен'), (0, 'выключен')], e.get('active', 1))}</label>
<div><button>Сохранить</button></div></form>
<p class="muted">Минимальные платежи по долгам добавляются автоматически из раздела «Долги» — не дублируйте их здесь.
Чтобы платёж считался оплаченным, при вводе расхода выберите его в поле «Обязательный платёж».</p>"""
    return "Обязательные платежи", (lst + f"<h2>В этом месяце</h2><p>Нагрузка в месяц (включая минимальные платежи по долгам): "
                                    f"{m(load)}</p><div class='tw'><table><thead><tr><th>Дата</th><th>Платёж</th><th>Сумма</th>"
                                    f"<th>Осталось</th></tr></thead><tbody>{month}</tbody></table></div>" + form)


def p_budget(conn, q):
    month = q.get("month") or calc.ym(date.today())
    try:
        calc.month_bounds(month)
    except ValueError:
        month = calc.ym(date.today())
    b = calc.month_budget(conn, month)
    inputs = "".join(f'<label>{h(r["category"])}{" *" if r["role"] == "essential" else ""} '
                     f'<span class="muted">(ср. {h(fmt(r["avg3"]))})</span>'
                     f'<input name="cat_{r["category_id"]}" value="{h(money_input(r["limit"]))}" placeholder="не задан"></label>'
                     for r in b["rows"])
    form = f"""<form class="row box" method="get"><input type="month" name="month" value="{h(month)}" style="max-width:180px">
<button class="sec">Открыть</button></form>
<h2>Лимиты</h2><form class="grid box" method="post" action="/budget/save">{csrf()}<input type="hidden" name="month" value="{h(month)}">
{inputs}<div><button>Сохранить бюджет</button></div></form>"""
    return "Бюджет", md(reports.budget(conn, month).split("\n", 1)[1]) + form


def p_report(conn, q):
    today_ = date.today()
    start = q.get("start") or today_.replace(day=1).isoformat()
    end = q.get("end") or today_.isoformat()
    try:
        date.fromisoformat(start), date.fromisoformat(end)
    except ValueError:
        start, end = today_.replace(day=1).isoformat(), today_.isoformat()
    form = f"""<form class="row box" method="get">{field('С', 'start', start, 'date')}{field('По', 'end', end, 'date')}
<button class="sec">Сформировать</button> <a class="btn sec" href="/report.md">Скачать полный отчёт (.md)</a>
<a class="btn sec" href="/export/transactions.csv?start={h(start)}&end={h(end)}">Операции периода (CSV)</a></form>"""
    hist = calc.net_worth_history(conn, 12)
    rows = "".join(f"<tr><td>{h(x['month'])}</td><td>{m(x['net_worth'])}</td><td>{m(-x['debt'])}</td>"
                   f"<td>{m(x['financial_assets'])}</td></tr>" for x in hist)
    nw = ("<h2>Динамика чистого капитала (на конец месяца)</h2><div class='tw'><table><thead><tr><th>Месяц</th>"
          f"<th>Чистый капитал</th><th>Долги</th><th>Финансовые активы</th></tr></thead><tbody>{rows}</tbody></table></div>")
    return "Отчёт за период", form + md(reports.period(conn, start, end).split("\n", 1)[1]) + nw


def p_data(conn, q):
    bks = backup.list_backups()
    blist = "".join(
        f"<tr><td>{h(p.name)}</td><td class='num'>{p.stat().st_size // 1024} КБ</td><td>"
        f"<form class='inline' method='post' action='/data/restore' onsubmit=\"return confirm('Восстановить базу из этой копии? "
        f"Текущее состояние будет сохранено отдельной копией.')\">{csrf()}<input type='hidden' name='name' value='{h(p.name)}'>"
        f"<button class='sec'>восстановить</button></form></td></tr>" for p in bks[:40])
    tables = [("transactions", "Операции"), ("accounts", "Счета"), ("debts", "Долги"), ("receivables", "Мне должны"),
              ("recurring", "Обязательные платежи"), ("goals", "Цели"), ("budgets", "Бюджеты")]
    exports = " ".join(f'<a class="btn sec" href="/export/{t}.csv">{h(n)}</a>' for t, n in tables)
    body = f"""<div class="box"><h3 style="margin-top:0">Экспорт</h3><div class="row">{exports}
<a class="btn" href="/export/all.zip">Всё одним архивом (CSV + отчёт)</a></div>
<p class="muted">CSV: разделитель «;», UTF-8 — открывается в Excel. Названия вместо id — файл можно править и импортировать обратно.</p></div>
<div class="box"><h3 style="margin-top:0">Импорт CSV</h3>
<form method="post" action="/data/import">{csrf()}<div class="row">
<label style="max-width:260px">Что импортируем{select('table', tables, 'transactions')}</label>
<label style="max-width:320px">Файл<input type="file" accept=".csv,text/csv" id="file"></label></div>
<p><textarea name="text" id="csvtext" placeholder="Дата;Вид;Статус;Сумма;Счёт;Счёт зачисления;Категория;Подкатегория;Долг;Основной долг;Дебитор;Цель;Описание
2026-10-05;Доход;Проведена;150000;Сбер дебет;;Зарплата;;;;;;Зарплата за сентябрь
2026-10-06;Расход;;1234,50;Сбер дебет;;Продукты и питание;Супермаркет;;;;;"></textarea></p>
<div class="row"><button name="dry_run" value="1" class="sec">Проверить без записи</button><button>Импортировать</button></div></form>
<p class="muted">Импорт атомарный: при любой ошибке не записывается ничего. Повторный импорт тех же строк пропускается (дубликаты).
Перед записью создаётся резервная копия. Счета, категории и долги в файле должны уже существовать.</p></div>
<div class="box"><h3 style="margin-top:0">Резервные копии</h3>
<form method="post" action="/data/backup">{csrf()}<button>Создать резервную копию сейчас</button></form>
<p class="muted">Папка: {h(backup.backup_dir())}. Автокопии создаются перед импортом и восстановлением (хранятся последние {backup.KEEP_AUTO}).
Копируйте эту папку на внешний диск или в зашифрованное облако — база содержит личные финансовые данные.</p>
{'<div class="tw"><table><thead><tr><th>Файл</th><th>Размер</th><th></th></tr></thead><tbody>' + blist + '</tbody></table></div>' if blist else '<p class="muted">Копий пока нет.</p>'}</div>
<script>document.getElementById('file').addEventListener('change',e=>{{const f=e.target.files[0];if(!f)return;
const r=new FileReader();r.onload=()=>{{document.getElementById('csvtext').value=r.result}};r.readAsText(f,'utf-8');}});</script>"""
    return "Данные: импорт, экспорт, резервные копии", body


def p_goals(conn, q):
    edit = conn.execute("SELECT * FROM goals WHERE id=?", (int(q["edit"]),)).fetchone() if q.get("edit") else None
    e = dict(edit) if edit else {}
    accs = [(a["id"], a["name"]) for a in conn.execute("SELECT * FROM accounts WHERE archived=0")]
    cards = ""
    for g in calc.goals_progress(conn):
        pct = g.get("pct")
        bar = f'<div class="bar"><i style="width:{pct:.0f}%"></i></div>' if pct is not None else ""
        cards += (f'<div class="box"><div class="row" style="justify-content:space-between"><b>{h(g["name"])}</b>'
                  f'<span class="muted">приоритет {g["priority"]} · <a href="/goals?edit={g["id"]}">изм.</a> '
                  f'{del_button("/goals/delete", g["id"], "×")}</span></div>'
                  f'<p>Сейчас: {m(g["current"]) if g["current"] is not None else "неизвестно"} · цель: '
                  f'{m(g["target"]) if g["target"] is not None else "неизвестно"}'
                  f'{f" · {pct:.0f} %" if pct is not None else ""} · срок при текущем темпе: {h(g.get("eta") or "—")}</p>'
                  f'{bar}<p class="muted">{h("; ".join(g["details"]))}{" · " + h(g["note"]) if g["note"] else ""}</p></div>')
    form = f"""<h2>{'Изменить цель' if e else 'Добавить цель'}</h2>
<form class="grid box" method="post" action="/goals/save">{csrf()}<input type="hidden" name="id" value="{h(e.get('id', ''))}">
{field('Название', 'name', e.get('name', ''), 'text', 'required')}
<label>Тип{select('kind', db.GOAL_KINDS.items(), e.get('kind', 'savings'))}</label>
{field('Целевая сумма, ₽', 'target', money_input(e.get('target')), 'text', 'placeholder="пусто = неизвестно"')}
{field('Месяцев расходов (для подушки)', 'months', e.get('months') or '')}
{field('Желаемый срок', 'target_date', e.get('target_date') or '', 'date')}
<label>Счёт цели{select('account_id', accs, e.get('account_id'), 'не привязан')}</label>
{field('Приоритет', 'priority', e.get('priority', 5), 'number', 'min=1 max=10')}
{field('Заметка', 'note', e.get('note', ''))}
<div><button>Сохранить</button></div></form>
<p class="muted">Накопления на цель без отдельного счёта: при переводе на накопительный счёт выберите цель в операции.
Срок достижения считается по среднему темпу последних 3 полных месяцев.</p>"""
    return "Финансовые цели", cards + form


def p_md(fn, title):
    def handler(conn, q):
        return title, md(fn(conn).split("\n", 1)[1])
    return handler


GET_ROUTES = {
    "/": p_dashboard, "/add": p_add, "/tx": p_tx, "/accounts": p_accounts, "/debts": p_debts,
    "/receivables": p_receivables, "/recurring": p_recurring, "/budget": p_budget, "/report": p_report,
    "/data": p_data, "/goals": p_goals,
    "/salary": p_md(reports.salary, "Распределение зарплаты"),
    "/forecast": p_md(reports.forecast, "Прогноз денежного потока"),
    "/audit": p_md(reports.audit, "Аудит финансов"),
    "/income": p_md(reports.income, "Рост дохода"),
    "/balance": p_md(reports.balance, "Баланс"),
}


# ------------------------------------------------------------------- POST

def post_action(conn, path, f):
    """Возвращает (url для редиректа, сообщение)."""
    id_ = f.get("id") or None
    if path == "/tx/save":
        if id_:
            ops.update_transaction(conn, int(id_), f)
            return "/tx", "Операция обновлена"
        ops.add_transaction(conn, f)
        return f"/tx?month={f['date'][:7]}", "Операция добавлена"
    if path == "/tx/delete":
        ops.delete_transaction(conn, int(id_))
        return "/tx", "Операция удалена"
    if path == "/tx/complete":
        ops.complete_transaction(conn, int(id_), f.get("date"), f.get("amount"))
        return "/tx", "Отмечено как проведённое — баланс обновлён. Распределение: раздел «Зарплата»"
    savers = {"accounts": ops.save_account, "debts": ops.save_debt, "receivables": ops.save_receivable,
              "recurring": ops.save_recurring, "goals": ops.save_goal}
    parts = path.strip("/").split("/")
    if len(parts) == 2 and parts[0] in savers:
        if parts[1] == "save":
            savers[parts[0]](conn, f, id_)
            return f"/{parts[0]}", "Сохранено"
        if parts[1] == "delete":
            ops.delete_entity(conn, parts[0], id_)
            return f"/{parts[0]}", "Удалено"
    if path == "/budget/save":
        for k, v in f.items():
            if k.startswith("cat_"):
                ops.set_budget(conn, f["month"], int(k[4:]), v)
        return f"/budget?month={f['month']}", "Бюджет сохранён"
    if path == "/data/backup":
        p = backup.create(conn, "manual")
        return "/data", f"Резервная копия создана: {p.name}"
    if path == "/data/restore":
        names = {p.name: p for p in backup.list_backups()}
        if f.get("name") not in names:
            raise ops.ValidationError("Копия не найдена")
        safety = backup.restore(conn, names[f["name"]])
        return "/data", f"База восстановлена из {f['name']}. Предыдущее состояние: {safety.name}"
    if path == "/data/import":
        dry = f.get("dry_run") == "1"
        if f.get("table") == "transactions":
            r = csvio.import_transactions(conn, f.get("text", ""), dry_run=dry)
        else:
            r = csvio.import_table(conn, f.get("table", ""), f.get("text", ""), dry_run=dry)
        if r["errors"]:
            raise ops.ValidationError("Импорт не выполнен. " + " | ".join(r["errors"][:20]))
        if dry:
            return "/data", f"Проверка пройдена: {r.get('valid', 0)} строк корректны" + \
                (f", дубликатов {r['skipped']}" if r.get("skipped") else "") + ". Ничего не записано."
        return "/data", f"Импортировано: {r['added']}" + (f", пропущено дубликатов: {r['skipped']}" if r.get("skipped") else "")
    raise ops.ValidationError("Неизвестное действие")


# ---------------------------------------------------------------- server

class Handler(BaseHTTPRequestHandler):
    server_version = "fin/1.0"
    db_file = None

    def log_message(self, fmt_, *args):  # без логирования сумм и параметров в консоль
        pass

    def _host_ok(self):
        host = (self.headers.get("Host") or "").split(":")[0]
        return host in ("127.0.0.1", "localhost")

    def _send(self, code, body, ctype="text/html; charset=utf-8", headers=None):
        data = body.encode("utf-8") if isinstance(body, str) else body
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Cache-Control", "no-store")
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(data)

    def _redirect(self, url):
        self.send_response(303)
        self.send_header("Location", url)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def _conn(self):
        return db.connect(self.db_file)

    def do_GET(self):
        if not self._host_ok():
            return self._send(403, "Forbidden host", "text/plain; charset=utf-8")
        u = urlparse(self.path)
        q = {k: v[0] for k, v in parse_qs(u.query).items()}
        with _lock:
            conn = self._conn()
            try:
                if u.path.startswith("/export/"):
                    return self._export(conn, u.path[8:], q)
                if u.path == "/report.md":
                    return self._file(reports.full_report(conn), f"finance-report-{csvio.timestamp()}.md",
                                      "text/markdown; charset=utf-8")
                handler = GET_ROUTES.get(u.path)
                if handler is None:
                    return self._send(404, page(u.path, "Не найдено", '<p><a href="/">На главную</a></p>'))
                try:
                    title, body = handler(conn, q)
                except (ValueError, ops.ValidationError) as e:
                    title, body = "Ошибка", f'<div class="msg err">{h(e)}</div>'
                self._send(200, page(u.path, title, body, q.get("msg"), q.get("err")))
            finally:
                conn.close()

    def _file(self, content, name, ctype):
        self._send(200, content, ctype, {"Content-Disposition": f"attachment; filename=\"{name}\""})

    def _export(self, conn, name, q):
        if name == "all.zip":
            return self._file(csvio.export_all_zip(conn), f"finance-{csvio.timestamp()}.zip", "application/zip")
        table = name.removesuffix(".csv")
        if table == "transactions":
            text = csvio.export_transactions(conn, q.get("start"), q.get("end"))
        elif table in csvio.TABLE_EXPORTS:
            text = csvio.export_table(conn, table)
        else:
            return self._send(404, "not found", "text/plain")
        self._file(text, f"{table}-{csvio.timestamp()}.csv", "text/csv; charset=utf-8")

    def do_POST(self):
        if not self._host_ok():
            return self._send(403, "Forbidden host", "text/plain; charset=utf-8")
        length = int(self.headers.get("Content-Length") or 0)
        if length > 20 * 1024 * 1024:
            return self._send(413, "Слишком большой запрос", "text/plain; charset=utf-8")
        raw = self.rfile.read(length).decode("utf-8", errors="replace")
        f = {k: v[0] for k, v in parse_qs(raw, keep_blank_values=True).items()}
        if not secrets.compare_digest(f.pop("csrf", ""), CSRF):
            return self._send(403, page("", "Форма устарела", '<p>Обновите страницу и повторите действие.</p>'))
        path = urlparse(self.path).path
        back = self.headers.get("Referer") or "/"
        back = urlparse(back).path + ("?" + urlparse(back).query if urlparse(back).query else "")
        back = re.sub(r"[?&](msg|err)=[^&]*", "", back) or "/"
        with _lock:
            conn = self._conn()
            try:
                url, msg = post_action(conn, path, f)
                sep = "&" if "?" in url else "?"
                self._redirect(f"{url}{sep}msg={quote(msg)}")
            except (ops.ValidationError, RuntimeError, sqlite3.Error) as e:
                conn.rollback()
                if path == "/tx/save" and not f.get("id"):
                    # вернуть форму с введёнными данными
                    body = _refill(tx_form(conn, f, None), f)
                    return self._send(400, page("/add", "Новая операция", body, err=str(e)))
                sep = "&" if "?" in back else "?"
                self._redirect(f"{back}{sep}err={quote(str(e))}")
            finally:
                conn.close()


def _refill(body, f):
    """Подставляет введённые значения обратно в форму операции после ошибки."""
    for k in ("date", "amount", "principal", "subcategory", "description"):
        if f.get(k):
            body = re.sub(rf'(name="{k}" value=")[^"]*(")', lambda mm: mm.group(1) + h(f[k]) + mm.group(2), body, 1)
    for k in ("kind", "status", "account_id", "to_account_id", "category_id", "debt_id", "receivable_id",
              "recurring_id", "goal_id"):
        if f.get(k):
            sel = re.search(rf'<select name="{k}"[^>]*>.*?</select>', body, re.S)
            if sel:
                s = sel.group(0).replace(" selected", "")
                s = s.replace(f'<option value="{h(f[k])}">', f'<option value="{h(f[k])}" selected>', 1)
                body = body.replace(sel.group(0), s)
    return body


def serve(port=8765, db_file=None, open_browser=False):
    Handler.db_file = db_file
    db.connect(db_file).close()
    httpd = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    url = f"http://127.0.0.1:{port}/"
    print(f"Финансы: {url}  (база: {db_file or db.db_path()})  Ctrl+C — остановить")
    if open_browser:
        import webbrowser
        webbrowser.open(url)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()
