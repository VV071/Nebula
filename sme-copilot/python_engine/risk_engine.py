"""
risk_engine.py

Invoice risk scoring — the SME port of Nebula's transparent-scorecard
pattern: explicit weighted components, visible weights, nothing hidden.

Every unpaid invoice is scored like a small credit instrument. Four
components, each normalized to 0–100 where HIGHER = RISKIER:

  payment_history  — the client's track record (avg days late, % gone bad)
  invoice_age      — how overdue this specific invoice is vs. its terms
  concentration    — what fraction of total open receivables this client is
  sector_news      — live news sentiment for the client's sector (VADER)

The composite risk_score is a plain weighted sum. This is a risk SCORE,
not a prediction of if/when an invoice will be paid.
"""

from __future__ import annotations

from datetime import date, datetime

import numpy as np

from news_sentiment import get_news_sentiment

DEFAULT_WEIGHTS = {
    "payment_history": 0.35,
    "invoice_age": 0.25,
    "concentration": 0.20,
    "sector_news": 0.20,
}

DISCLAIMER = (
    "Risk scores are transparent weighted indicators built from the client's "
    "own payment history, invoice age, receivables concentration and sector "
    "news. They are NOT predictions of if or when an invoice will be paid."
)

# A client whose past invoices ran 60+ days late is treated as having
# "gone bad" for the bad-rate component.
BAD_INVOICE_DAYS_LATE = 60


def _normalize(value, low, high):
    """Map value from [low, high] onto [0, 100], clipped."""
    if value is None or high == low:
        return 50.0
    return float(np.clip((value - low) / (high - low) * 100, 0, 100))


def _parse_date(d) -> date:
    if isinstance(d, date):
        return d
    return datetime.strptime(str(d)[:10], "%Y-%m-%d").date()


def _risk_band(score: float) -> str:
    if score < 35:
        return "low"
    if score < 60:
        return "medium"
    return "high"


def payment_history_score(client_history: list) -> dict:
    """Client track record. No history -> 50 (unknown = medium risk).

    60% weight on average lateness (normalized over -5..45 days),
    40% on the share of past invoices that went 60+ days late.
    """
    if not client_history:
        return {"score": 50.0, "avg_days_late": None, "bad_rate": None, "sample_size": 0}

    days = [h["days_late"] for h in client_history if h.get("days_late") is not None]
    if not days:
        return {"score": 50.0, "avg_days_late": None, "bad_rate": None, "sample_size": 0}

    avg_late = float(np.mean(days))
    bad_rate = sum(1 for d in days if d >= BAD_INVOICE_DAYS_LATE) / len(days)
    score = 0.6 * _normalize(avg_late, -5, 45) + 0.4 * _normalize(bad_rate, 0.0, 0.5)
    return {
        "score": round(score, 1),
        "avg_days_late": round(avg_late, 1),
        "bad_rate": round(bad_rate, 3),
        "sample_size": len(days),
    }


def invoice_age_score(due_date, as_of: date) -> dict:
    """How overdue this specific invoice is. -15 days (not yet due) maps to
    0 risk, 60+ days past due maps to 100."""
    days_past_due = (as_of - _parse_date(due_date)).days
    return {
        "score": round(_normalize(days_past_due, -15, 60), 1),
        "days_past_due": days_past_due,
    }


def concentration_score(client_open_amount: float, total_open_amount: float) -> dict:
    """Share of all open receivables sitting on this one client.
    0% -> 0 risk, 50%+ -> 100 (the "41% of your cash depends on one
    client" signal)."""
    share = (client_open_amount / total_open_amount) if total_open_amount > 0 else 0.0
    return {
        "score": round(_normalize(share, 0.0, 0.5), 1),
        "client_share": round(share, 3),
    }


def sector_news_score(sector: str, client_name: str) -> dict:
    """Live sector-news sentiment, inverted: negative headlines -> higher
    risk. No headlines -> neutral 50. Same VADER approach as the original
    Nebula news signal."""
    query = sector or client_name
    if not query:
        return {"score": 50.0, "avg_sentiment": 0.0, "article_count": 0, "query": None}
    news = get_news_sentiment(query)
    # sentiment +0.4 (very positive) -> 0 risk; -0.4 (very negative) -> 100
    score = _normalize(-news["avg_sentiment"], -0.4, 0.4) if news["article_count"] else 50.0
    return {
        "score": round(score, 1),
        "avg_sentiment": news["avg_sentiment"],
        "article_count": news["article_count"],
        "headlines": news.get("headlines", [])[:5],
        "query": query,
    }


def score_invoices(invoices: list, history: list, as_of=None, weights: dict = None) -> dict:
    """Score every open invoice and summarize portfolio-level risk.

    invoices: [{invoice_id, client_id, client_name, sector, amount,
                issue_date, due_date}]
    history:  [{client_id, days_late}] — the client's settled invoices
    """
    weights = weights or DEFAULT_WEIGHTS
    as_of = _parse_date(as_of) if as_of else date.today()

    total_open = sum(float(inv["amount"]) for inv in invoices)
    open_by_client: dict = {}
    for inv in invoices:
        open_by_client[inv["client_id"]] = open_by_client.get(inv["client_id"], 0.0) + float(inv["amount"])

    history_by_client: dict = {}
    for h in history:
        history_by_client.setdefault(h["client_id"], []).append(h)

    scored = []
    for inv in invoices:
        ph = payment_history_score(history_by_client.get(inv["client_id"], []))
        age = invoice_age_score(inv["due_date"], as_of)
        conc = concentration_score(open_by_client[inv["client_id"]], total_open)
        news = sector_news_score(inv.get("sector"), inv.get("client_name"))

        components = {
            "payment_history": ph["score"],
            "invoice_age": age["score"],
            "concentration": conc["score"],
            "sector_news": news["score"],
        }
        composite = round(sum(components[k] * weights[k] for k in components), 1)

        scored.append({
            "invoice_id": inv["invoice_id"],
            "client_id": inv["client_id"],
            "client_name": inv.get("client_name"),
            "amount": float(inv["amount"]),
            "due_date": str(inv["due_date"])[:10],
            "risk_score": composite,
            "risk_band": _risk_band(composite),
            "component_scores": components,
            "weights": weights,
            "detail": {
                "payment_history": ph,
                "invoice_age": age,
                "concentration": conc,
                "sector_news": news,
            },
        })

    # Portfolio-level concentration: who dominates open receivables?
    client_names = {inv["client_id"]: inv.get("client_name") for inv in invoices}
    shares = sorted(
        (
            {
                "client_id": cid,
                "client_name": client_names.get(cid),
                "open_amount": round(amt, 2),
                "share": round(amt / total_open, 3) if total_open > 0 else 0.0,
            }
            for cid, amt in open_by_client.items()
        ),
        key=lambda c: -c["open_amount"],
    )

    return {
        "as_of": str(as_of),
        "invoices": scored,
        "portfolio": {
            "total_open_amount": round(total_open, 2),
            "invoice_count": len(invoices),
            "overdue_count": sum(1 for s in scored if s["detail"]["invoice_age"]["days_past_due"] > 0),
            "high_risk_count": sum(1 for s in scored if s["risk_band"] == "high"),
            "client_shares": shares,
            "top_client": shares[0] if shares else None,
        },
        "weights": weights,
        "disclaimer": DISCLAIMER,
    }
