"""
news_sentiment.py

Live news sentiment for a ticker, via Yahoo Finance + VADER.
No model training involved -- this fetches fresh headlines at request time.
"""

import numpy as np
import yfinance as yf
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

_analyzer = SentimentIntensityAnalyzer()


def get_news_sentiment(ticker: str, max_articles: int = 15) -> dict:
    try:
        news = yf.Ticker(ticker).news or []
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

    return {
        "avg_sentiment": round(float(np.mean(scores)), 3) if scores else 0.0,
        "article_count": len(scores),
        "headlines": headlines,
    }
