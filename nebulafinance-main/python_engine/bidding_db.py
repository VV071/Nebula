"""
bidding_db.py

Persistence layer for the fake-currency bidding system.
Uses SQLite for portability; to switch to your PostgreSQL backend, replace
the connection logic and adjust the few SQLite-specific bits noted inline.

Tables:
  users  — one row per player, holds their virtual balance
  bids   — one row per placed bid, settled or pending
"""

from __future__ import annotations
import sqlite3
from datetime import datetime, timezone

DB_PATH = "nebula_bidding.db"
STARTING_BALANCE = 100000.0  # fake currency each new user starts with


def _conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with _conn() as c:
        c.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id      TEXT PRIMARY KEY,
                balance      REAL NOT NULL,
                created_at   TEXT NOT NULL
            )
        """)
        c.execute("""
            CREATE TABLE IF NOT EXISTS bids (
                bid_id        INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id       TEXT NOT NULL,
                ticker_a      TEXT NOT NULL,
                ticker_b      TEXT NOT NULL,
                chosen        TEXT NOT NULL,        -- which ticker the user backed
                stake         REAL NOT NULL,
                entry_time    TEXT NOT NULL,        -- ISO timestamp the bid was placed
                entry_price_a REAL NOT NULL,
                entry_price_b REAL NOT NULL,
                status        TEXT NOT NULL,        -- 'pending' | 'won' | 'lost' | 'void'
                settle_time   TEXT,
                exit_price_a  REAL,
                exit_price_b  REAL,
                payout        REAL,                 -- amount returned to balance (0 if lost)
                ret_a         REAL,                 -- realized return of A over the window
                ret_b         REAL
            )
        """)


def get_or_create_user(user_id: str) -> dict:
    with _conn() as c:
        row = c.execute("SELECT * FROM users WHERE user_id = ?", (user_id,)).fetchone()
        if row is None:
            now = datetime.now(timezone.utc).isoformat()
            c.execute("INSERT INTO users (user_id, balance, created_at) VALUES (?, ?, ?)",
                      (user_id, STARTING_BALANCE, now))
            return {"user_id": user_id, "balance": STARTING_BALANCE, "created_at": now}
        return dict(row)


def get_balance(user_id: str) -> float:
    with _conn() as c:
        row = c.execute("SELECT balance FROM users WHERE user_id = ?", (user_id,)).fetchone()
        return float(row["balance"]) if row else 0.0


def _adjust_balance(c, user_id: str, delta: float):
    c.execute("UPDATE users SET balance = balance + ? WHERE user_id = ?", (delta, user_id))


def record_bid(user_id, ticker_a, ticker_b, chosen, stake,
               entry_price_a, entry_price_b) -> int:
    """Deduct the stake immediately and store a pending bid. Returns bid_id."""
    now = datetime.now(timezone.utc).isoformat()
    with _conn() as c:
        _adjust_balance(c, user_id, -stake)  # stake is held out of balance until settle
        cur = c.execute("""
            INSERT INTO bids (user_id, ticker_a, ticker_b, chosen, stake,
                              entry_time, entry_price_a, entry_price_b, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        """, (user_id, ticker_a, ticker_b, chosen, stake, now,
              entry_price_a, entry_price_b))
        return cur.lastrowid


def settle_bid(bid_id, status, payout, settle_time,
               exit_price_a, exit_price_b, ret_a, ret_b):
    """Mark a bid settled and credit any payout back to the user's balance."""
    with _conn() as c:
        bid = c.execute("SELECT * FROM bids WHERE bid_id = ?", (bid_id,)).fetchone()
        if bid is None or bid["status"] != "pending":
            return  # already settled or missing — no double-credit
        c.execute("""
            UPDATE bids SET status=?, payout=?, settle_time=?,
                            exit_price_a=?, exit_price_b=?, ret_a=?, ret_b=?
            WHERE bid_id=?
        """, (status, payout, settle_time, exit_price_a, exit_price_b,
              ret_a, ret_b, bid_id))
        if payout > 0:
            _adjust_balance(c, bid["user_id"], payout)


def get_pending_bids() -> list[dict]:
    with _conn() as c:
        rows = c.execute("SELECT * FROM bids WHERE status = 'pending'").fetchall()
        return [dict(r) for r in rows]


def get_user_bids(user_id: str, limit: int = 50) -> list[dict]:
    with _conn() as c:
        rows = c.execute(
            "SELECT * FROM bids WHERE user_id = ? ORDER BY bid_id DESC LIMIT ?",
            (user_id, limit)).fetchall()
        return [dict(r) for r in rows]
