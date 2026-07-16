"""
news_sentiment.py

Live news sentiment via Yahoo Finance search + VADER.

Ported from the Nebula stock engine with one change: instead of a stock
ticker, this is pointed at a free-text query (a client's company name or
sector, e.g. "textile industry India"). The VADER scoring logic is unchanged.

No model training involved -- fresh headlines are fetched at request time.
Fails soft: any network / API problem returns a neutral (0.0) sentiment so
the risk engine never blocks on news availability.
"""

from __future__ import annotations

import time

import numpy as np
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

_analyzer = SentimentIntensityAnalyzer()

# Query -> (timestamp, result). News doesn't change minute-to-minute and the
# risk endpoint may score many invoices for the same sector in one request.
_cache: dict = {}
CACHE_TTL = 15 * 60  # seconds


def _search_news(query: str, max_articles: int):
    """Fetch headlines for a free-text query via yfinance's news search."""
    import yfinance as yf

    search = yf.Search(query, news_count=max_articles)
    return search.news or []


def get_news_sentiment(query: str, max_articles: int = 10) -> dict:
    """Average VADER compound sentiment over fresh headlines for `query`.

    Returns {avg_sentiment, article_count, headlines} — avg_sentiment is 0.0
    (neutral) whenever no headlines could be fetched, so callers can treat
    the result as a soft signal, never a hard dependency.
    """
    key = query.strip().lower()
    now = time.time()
    if key in _cache:
        ts, result = _cache[key]
        if now - ts < CACHE_TTL:
            return result

    try:
        news = _search_news(query, max_articles)
    except Exception as e:
        return {"avg_sentiment": 0.0, "article_count": 0, "headlines": [], "error": str(e)}

    headlines, scores = [], []
    for item in news[:max_articles]:
        title = item.get("title") or item.get("content", {}).get("title", "")
        if not title:
            continue
        s = _analyzer.polarity_scores(title)["compound"]
        headlines.append({"title": title, "sentiment": round(s, 3)})
        scores.append(s)

    result = {
        "avg_sentiment": round(float(np.mean(scores)), 3) if scores else 0.0,
        "article_count": len(scores),
        "headlines": headlines,
    }
    _cache[key] = (now, result)
    return result
