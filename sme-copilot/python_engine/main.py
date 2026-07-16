"""
main.py  --  SME Cash-Flow Risk Copilot: Python compute engine

Run with:
    cd sme-copilot/python_engine
    pip install -r requirements.txt
    uvicorn main:app --port 8002 --reload

The Node.js backend (port 5006) owns the database and proxies here for:
  - invoice risk scoring        (risk_engine.py — transparent scorecard)
  - cash-flow range forecasting (cashflow_forecaster.py — Monte Carlo)
  - the four Gemma language jobs (gemma_service.py, via Ollama)
"""

from __future__ import annotations

from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import cashflow_forecaster
import gemma_service
import risk_engine

app = FastAPI(title="SME Cash-Flow Risk Copilot — Compute Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request models ────────────────────────────────────────────────────────────

class InvoiceIn(BaseModel):
    invoice_id: int
    client_id: int
    client_name: Optional[str] = None
    sector: Optional[str] = None
    amount: float
    issue_date: str
    due_date: str
    risk_score: Optional[float] = None


class HistoryIn(BaseModel):
    client_id: int
    days_late: int


class ScoreRequest(BaseModel):
    invoices: List[InvoiceIn]
    history: List[HistoryIn] = []
    as_of: Optional[str] = None


class ForecastRequest(BaseModel):
    invoices: List[InvoiceIn]
    history: List[HistoryIn] = []
    horizon_days: int = Field(30, ge=1, le=365)
    n_sims: int = Field(2000, ge=100, le=20000)
    as_of: Optional[str] = None
    seed: Optional[int] = None


class ParseRequest(BaseModel):
    text: str


class ExplainRequest(BaseModel):
    state: dict


class FollowupRequest(BaseModel):
    invoice: dict
    tone: str = "gentle"


class AskRequest(BaseModel):
    question: str
    state: dict


# ── Deterministic endpoints ───────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "gemma": gemma_service.is_available()}


@app.post("/score")
def score(req: ScoreRequest):
    """Transparent weighted risk scorecard for every open invoice."""
    return risk_engine.score_invoices(
        [i.model_dump() for i in req.invoices],
        [h.model_dump() for h in req.history],
        as_of=req.as_of,
    )


@app.post("/forecast")
def forecast(req: ForecastRequest):
    """Monte Carlo probability range for cash received within the horizon."""
    return cashflow_forecaster.forecast(
        [i.model_dump() for i in req.invoices],
        [h.model_dump() for h in req.history],
        horizon_days=req.horizon_days,
        n_sims=req.n_sims,
        as_of=req.as_of,
        seed=req.seed,
    )


# ── Gemma endpoints (language jobs only) ──────────────────────────────────────

def _gemma_call(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except gemma_service.GemmaUnavailable as e:
        raise HTTPException(status_code=503, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.post("/gemma/parse-invoice")
def parse_invoice(req: ParseRequest):
    return _gemma_call(gemma_service.parse_invoice, req.text)


@app.post("/gemma/explain")
def explain(req: ExplainRequest):
    return {"explanation": _gemma_call(gemma_service.explain_risk, req.state)}


@app.post("/gemma/followup")
def followup(req: FollowupRequest):
    return _gemma_call(gemma_service.draft_followup, req.invoice, req.tone)


@app.post("/gemma/ask")
def ask(req: AskRequest):
    return {"answer": _gemma_call(gemma_service.answer_question, req.question, req.state)}
