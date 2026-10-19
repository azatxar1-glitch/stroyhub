"""Резервные копии SQLite через штатный backup API (безопасно при открытой БД)."""

import sqlite3
from datetime import datetime
from pathlib import Path

from . import db

KEEP_AUTO = 30


def backup_dir() -> Path:
    return db.db_path().parent / "backups"


def create(conn, label="manual", dest_dir=None) -> Path:
    d = Path(dest_dir or backup_dir())
    d.mkdir(parents=True, exist_ok=True)
    safe = "".join(ch for ch in label if ch.isalnum() or ch in "-_")[:30] or "manual"
    path = d / f"finance-{datetime.now():%Y%m%d-%H%M%S-%f}-{safe}.db"
    target = sqlite3.connect(path)
    try:
        conn.backup(target)
    finally:
        target.close()
    if not verify(path):
        path.unlink(missing_ok=True)
        raise RuntimeError("Резервная копия не прошла проверку целостности")
    if label != "manual":
        _prune(d)
    return path


def verify(path) -> bool:
    try:
        c = sqlite3.connect(f"file:{Path(path).as_posix()}?mode=ro", uri=True)
        try:
            ok = c.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
            c.execute("SELECT COUNT(*) FROM transactions").fetchone()
            return ok
        finally:
            c.close()
    except sqlite3.Error:
        return False


def list_backups(dest_dir=None):
    d = Path(dest_dir or backup_dir())
    if not d.exists():
        return []
    return sorted(d.glob("finance-*.db"), reverse=True)


def restore(conn, path) -> Path:
    """Восстанавливает БД из копии. Перед этим сохраняет текущее состояние."""
    path = Path(path)
    if not path.exists() or not verify(path):
        raise RuntimeError(f"Файл {path.name} не найден или повреждён — восстановление отменено")
    safety = create(conn, "before-restore")
    src = sqlite3.connect(path)
    try:
        src.backup(conn)
    finally:
        src.close()
    db.init(conn)
    return safety


def _prune(d: Path):
    autos = [p for p in sorted(d.glob("finance-*.db"), reverse=True) if not p.stem.endswith("-manual")]
    for p in autos[KEEP_AUTO:]:
        p.unlink(missing_ok=True)
