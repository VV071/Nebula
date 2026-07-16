"""
cashflow_forecaster.py

Cash-flow distribution forecaster — the philosophical port of Nebula's
volatility model: forecast a RANGE, never a false-precision point number.

Monte Carlo simulation over the open invoice book:

  for each of N trials:
      for each open invoice:
          - with probability p_default (derived from its risk_score) the
            invoice is NOT collected within the horizon
          - otherwise its payment delay is sampled from the client's own
            historical days-late distribution, truncated so a payment can
            never land in the past (an invoice already 20 days late can't
            be paid 5 days after its due date)
      sum whatever lands inside the horizon
  report percentiles of the N totals

No ML training involved — the simulation is driven entirely by the
transparent risk scores and each client's own payment history.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta

import numpy as np

# A risk_score of 100 is treated as at most this probability of NOT being
# collected within the horizon. Visible, tunable, and stated in `method`.
MAX_DEFAULT_PROB = 0.55

# Fallback delay distribution for clients with no payment history yet.
FALLBACK_DELAY_MEAN = 7.0
FALLBACK_DELAY_STD = 12.0
MIN_DELAY_STD = 3.0


def _parse_date(d) -> date:
    if isinstance(d, date):
        return d
    return datetime.strptime(str(d)[:10], "%Y-%m-%d").date()


def _delay_stats(history_by_client: dict, client_id) -> tuple:
    days = [h["days_late"] for h in history_by_client.get(client_id, []) if h.get("days_late") is not None]
    if len(days) >= 2:
        return float(np.mean(days)), max(float(np.std(days)), MIN_DELAY_STD)
    if len(days) == 1:
        return float(days[0]), FALLBACK_DELAY_STD
    return FALLBACK_DELAY_MEAN, FALLBACK_DELAY_STD


def _sample_delays(rng, mean, std, min_delay, size):
    """Sample payment delays > min_delay (days past due_date).

    Rejection-sample from N(mean, std); after a few rounds fall back to
    min_delay + |N(10, 7)| so the loop always terminates.
    """
    out = np.full(size, np.nan)
    remaining = np.arange(size)
    for _ in range(6):
        draw = rng.normal(mean, std, remaining.size)
        ok = draw > min_delay
        out[remaining[ok]] = draw[ok]
        remaining = remaining[~ok]
        if remaining.size == 0:
            return out
    out[remaining] = min_delay + np.abs(rng.normal(10, 7, remaining.size))
    return out


def forecast(invoices: list, history: list, horizon_days: int = 30,
             n_sims: int = 2000, as_of=None, seed: int = None) -> dict:
    """Probability distribution over total cash received by as_of + horizon.

    invoices: open invoices [{invoice_id, client_id, client_name, amount,
              due_date, risk_score}]
    history:  [{client_id, days_late}]
    """
    as_of = _parse_date(as_of) if as_of else date.today()
    horizon_end = as_of + timedelta(days=horizon_days)
    rng = np.random.default_rng(seed)

    total_open = sum(float(inv["amount"]) for inv in invoices)
    if not invoices:
        return {
            "as_of": str(as_of), "horizon_days": horizon_days, "horizon_end": str(horizon_end),
            "total_open_amount": 0.0, "n_sims": n_sims, "expected": 0.0,
            "percentiles": {}, "histogram": [], "per_invoice": [],
            "method": _method_notes(horizon_days, n_sims),
        }

    history_by_client: dict = {}
    for h in history:
        history_by_client.setdefault(h["client_id"], []).append(h)

    totals = np.zeros(n_sims)
    collected_counts = {}

    for inv in invoices:
        amount = float(inv["amount"])
        due = _parse_date(inv["due_date"])
        risk = float(inv.get("risk_score") or 50.0)
        p_default = (risk / 100.0) * MAX_DEFAULT_PROB

        # A payment can only arrive from today onwards: the sampled delay
        # must exceed how late the invoice already is. For invoices not yet
        # due this bound is negative, which still allows early payment.
        min_delay = (as_of - due).days
        mean, std = _delay_stats(history_by_client, inv["client_id"])

        defaulted = rng.random(n_sims) < p_default
        delays = _sample_delays(rng, mean, std, min_delay, n_sims)
        pay_dates_ok = delays <= (horizon_end - due).days
        collected = (~defaulted) & pay_dates_ok

        totals += np.where(collected, amount, 0.0)
        collected_counts[inv["invoice_id"]] = {
            "invoice_id": inv["invoice_id"],
            "client_name": inv.get("client_name"),
            "amount": amount,
            "due_date": str(due),
            "risk_score": risk,
            "p_collected_in_horizon": round(float(collected.mean()), 3),
        }

    pcts = {f"p{p}": round(float(np.percentile(totals, p)), 2) for p in (5, 10, 25, 50, 75, 90, 95)}

    # Histogram for the range chart — 12 bins across observed outcomes.
    hist_counts, bin_edges = np.histogram(totals, bins=12)
    histogram = [
        {
            "from": round(float(bin_edges[i]), 2),
            "to": round(float(bin_edges[i + 1]), 2),
            "probability": round(float(hist_counts[i] / n_sims), 4),
        }
        for i in range(len(hist_counts))
    ]

    return {
        "as_of": str(as_of),
        "horizon_days": horizon_days,
        "horizon_end": str(horizon_end),
        "total_open_amount": round(total_open, 2),
        "n_sims": n_sims,
        "expected": round(float(totals.mean()), 2),
        "percentiles": pcts,
        # e.g. "90% chance of ₹X or more" -> p10; "10% chance of shortfall below p10"
        "chance_of_at_least": {
            "90pct": pcts["p10"],
            "75pct": pcts["p25"],
            "50pct": pcts["p50"],
        },
        "histogram": histogram,
        "per_invoice": sorted(collected_counts.values(), key=lambda x: x["p_collected_in_horizon"]),
        "method": _method_notes(horizon_days, n_sims),
    }


def _method_notes(horizon_days: int, n_sims: int) -> dict:
    return {
        "summary": (
            f"Monte Carlo simulation ({n_sims} trials) over the open invoice book "
            f"for a {horizon_days}-day horizon. This is a probability RANGE for "
            "total cash received — not a prediction of exact payment dates."
        ),
        "assumptions": [
            f"An invoice with risk score R has probability (R/100) x {MAX_DEFAULT_PROB} "
            "of not being collected within the horizon.",
            "If collected, the payment delay is sampled from the client's own "
            "historical days-late distribution (normal fit), truncated so payments "
            "never land before today.",
            f"Clients with no history use a fallback delay of "
            f"{FALLBACK_DELAY_MEAN:.0f} +/- {FALLBACK_DELAY_STD:.0f} days.",
        ],
    }
