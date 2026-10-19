"""Деньги хранятся в копейках (int), чтобы не было ошибок округления float."""

import re
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

_SPACES = re.compile(r"[\s  ']")


class MoneyError(ValueError):
    pass


def parse_money(text) -> int:
    """'12 345,67' / '12345.67' / '-500' / '1 000 ₽' -> копейки."""
    if isinstance(text, int):
        return text * 100
    s = _SPACES.sub("", str(text or "")).replace("₽", "").replace("руб.", "").replace("руб", "")
    if not s:
        raise MoneyError("Пустая сумма")
    if "," in s and "." in s:
        # '1.234,56' или '1,234.56' — последний разделитель считаем дробным
        if s.rfind(",") > s.rfind("."):
            s = s.replace(".", "").replace(",", ".")
        else:
            s = s.replace(",", "")
    else:
        s = s.replace(",", ".")
    try:
        value = Decimal(s)
    except InvalidOperation:
        raise MoneyError(f"Не удалось разобрать сумму: {text!r}") from None
    if not value.is_finite():
        raise MoneyError(f"Некорректная сумма: {text!r}")
    if value != value.quantize(Decimal("0.01")):
        raise MoneyError(f"Больше двух знаков после запятой: {text!r}")
    return int((value * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def fmt(kop, sign=False, currency=True) -> str:
    """Копейки -> '12 345,67 ₽' (неразрывные пробелы)."""
    if kop is None:
        return "—"
    neg = kop < 0
    rub, k = divmod(abs(int(kop)), 100)
    whole = f"{rub:,}".replace(",", " ")
    out = f"{whole},{k:02d}" if k else whole
    prefix = "−" if neg else ("+" if sign and kop > 0 else "")
    return prefix + out + (" ₽" if currency else "")


def to_plain(kop: int) -> str:
    """Копейки -> '12345.67' для CSV (машиночитаемо)."""
    neg = kop < 0
    rub, k = divmod(abs(int(kop)), 100)
    return f"{'-' if neg else ''}{rub}.{k:02d}"
