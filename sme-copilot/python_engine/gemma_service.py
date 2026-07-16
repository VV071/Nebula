"""
gemma_service.py

ALL Gemma calls live in this module — nowhere else. Gemma (served locally
via Ollama) is used for exactly four language-shaped jobs:

  1. parse_invoice     — messy invoice text  -> structured fields
  2. explain_risk      — risk/forecast state -> plain-language briefing
  3. draft_followup    — invoice + tone      -> payment reminder draft
  4. answer_question   — free-text Q&A grounded on the current risk state

Deterministic code (risk_engine, cashflow_forecaster) does all the math;
Gemma only reads and writes language. No other LLM is used anywhere.

Config:
  OLLAMA_URL   (default http://localhost:11434)
  GEMMA_MODEL  (default gemma3:4b — any local Gemma tag works)
"""

from __future__ import annotations

import json
import os
import re

import requests

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
GEMMA_MODEL = os.environ.get("GEMMA_MODEL", "gemma3:4b")

REQUEST_TIMEOUT = 120


class GemmaUnavailable(Exception):
    """Raised when Ollama is unreachable or the Gemma model is not pulled."""


def is_available() -> dict:
    """Report whether Ollama is up and the configured Gemma model is pulled."""
    try:
        r = requests.get(f"{OLLAMA_URL}/api/tags", timeout=3)
        r.raise_for_status()
        models = [m.get("name", "") for m in r.json().get("models", [])]
        model_present = any(m == GEMMA_MODEL or m.startswith(GEMMA_MODEL.split(":")[0]) for m in models)
        return {"available": model_present, "ollama_up": True, "model": GEMMA_MODEL, "installed_models": models}
    except Exception:
        return {"available": False, "ollama_up": False, "model": GEMMA_MODEL, "installed_models": []}


def _chat(system: str, user: str, json_mode: bool = False, temperature: float = 0.3) -> str:
    payload = {
        "model": GEMMA_MODEL,
        "stream": False,
        "options": {"temperature": temperature},
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    }
    if json_mode:
        payload["format"] = "json"
    try:
        r = requests.post(f"{OLLAMA_URL}/api/chat", json=payload, timeout=REQUEST_TIMEOUT)
        r.raise_for_status()
    except requests.RequestException as e:
        raise GemmaUnavailable(
            f"Gemma is not reachable at {OLLAMA_URL} (model {GEMMA_MODEL}). "
            f"Install Ollama and run: ollama pull {GEMMA_MODEL}. ({e})"
        )
    return r.json().get("message", {}).get("content", "")


def _extract_json(text: str) -> dict:
    """Parse the first JSON object out of a model reply."""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise ValueError(f"Gemma did not return valid JSON: {text[:300]}")


# ── Shared guardrail ──────────────────────────────────────────────────────────
# The product's core defensibility: risk scoring and RANGE forecasting,
# never exact payment-date prediction. Every language job carries this.

GUARDRAIL = (
    "Hard rules: NEVER claim to predict when a client will pay or whether a "
    "specific invoice will definitely be paid. Speak in terms of risk levels "
    "and probability ranges. Amounts are INR unless stated otherwise. Be "
    "plain-spoken and concrete; no financial jargon, no financial advice."
)


# ── Job 1: invoice parsing ────────────────────────────────────────────────────

PARSE_SYSTEM = (
    "You extract structured data from messy SME invoice text (emails, OCR "
    "dumps, WhatsApp messages, plain notes). Respond with ONLY a JSON object "
    "with exactly these keys:\n"
    '  client_name (string|null), amount (number|null), currency (string, default "INR"),\n'
    "  issue_date (YYYY-MM-DD|null), due_date (YYYY-MM-DD|null),\n"
    "  payment_terms (string|null, e.g. \"Net 30\"), description (string|null),\n"
    "  confidence (\"high\"|\"medium\"|\"low\")\n"
    "Use null for anything not present — do not invent values. If only "
    "payment terms are given (e.g. Net 30), leave due_date null rather than "
    "guessing a date. amount must be a plain number without separators."
)


def parse_invoice(text: str) -> dict:
    raw = _chat(PARSE_SYSTEM, f"Invoice text:\n---\n{text}\n---", json_mode=True, temperature=0.1)
    parsed = _extract_json(raw)
    # Coerce the fields deterministic code depends on.
    out = {
        "client_name": parsed.get("client_name"),
        "amount": None,
        "currency": parsed.get("currency") or "INR",
        "issue_date": _clean_date(parsed.get("issue_date")),
        "due_date": _clean_date(parsed.get("due_date")),
        "payment_terms": parsed.get("payment_terms"),
        "description": parsed.get("description"),
        "confidence": parsed.get("confidence", "low"),
    }
    try:
        if parsed.get("amount") is not None:
            out["amount"] = float(re.sub(r"[^\d.]", "", str(parsed["amount"])))
    except ValueError:
        pass
    return out


def _clean_date(value):
    if not value:
        return None
    m = re.search(r"\d{4}-\d{2}-\d{2}", str(value))
    return m.group(0) if m else None


# ── Job 2: risk explanation ───────────────────────────────────────────────────

EXPLAIN_SYSTEM = (
    "You are the plain-language voice of an SME cash-flow risk copilot. "
    "You are given the deterministic engine's output: per-invoice risk "
    "scores with their component breakdowns, portfolio concentration, and a "
    "Monte Carlo cash-flow range forecast. Write a briefing for the business "
    "owner in under 220 words: lead with the single most important fact, "
    "name the clients driving risk and why (their history, invoice age, "
    "concentration, sector news), state the forecast as a range with its "
    "confidence levels, and end with the one action that most reduces risk. "
    + GUARDRAIL
)


def explain_risk(state: dict) -> str:
    return _chat(EXPLAIN_SYSTEM, "Current engine output:\n" + json.dumps(state, default=str), temperature=0.4)


# ── Job 3: follow-up drafting ─────────────────────────────────────────────────

FOLLOWUP_TONES = {
    "gentle": "a warm, relationship-preserving nudge — assume good faith, first reminder",
    "firm": "a firm, professional escalation — reference the overdue amount and days late, request a payment date",
    "payment_plan": "a constructive proposal to split the outstanding amount into a short installment plan",
}

FOLLOWUP_SYSTEM = (
    "You draft payment follow-up messages an SME owner can send to a client. "
    "Respond with ONLY a JSON object: {\"subject\": string, \"body\": string}. "
    "The body is a short email (under 150 words), professional, never "
    "threatening or legalistic, signed off with the business name. Reference "
    "the invoice details you are given. " + GUARDRAIL
)


def draft_followup(invoice: dict, tone: str = "gentle") -> dict:
    tone = tone if tone in FOLLOWUP_TONES else "gentle"
    user = (
        f"Tone: {FOLLOWUP_TONES[tone]}\n"
        f"Invoice context:\n{json.dumps(invoice, default=str)}"
    )
    raw = _chat(FOLLOWUP_SYSTEM, user, json_mode=True, temperature=0.5)
    parsed = _extract_json(raw)
    return {
        "tone": tone,
        "subject": parsed.get("subject", "Regarding your outstanding invoice"),
        "body": parsed.get("body", ""),
    }


# ── Job 4: conversational Q&A ─────────────────────────────────────────────────

ASK_SYSTEM = (
    "You answer an SME owner's questions about their receivables using ONLY "
    "the engine state provided (invoices with risk scores, client histories, "
    "concentration, forecast ranges). If the state doesn't contain the "
    "answer, say so plainly — never invent numbers. Keep answers under 150 "
    "words and cite the concrete figures you used. " + GUARDRAIL
)


def answer_question(question: str, state: dict) -> str:
    user = "Engine state:\n" + json.dumps(state, default=str) + f"\n\nQuestion: {question}"
    return _chat(ASK_SYSTEM, user, temperature=0.4)
