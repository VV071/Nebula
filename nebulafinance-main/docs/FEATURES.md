# 🧩 Feature Documentation — NebulaFinance

This document describes all major features implemented in NebulaFinance, their logic, and user impact.

---

## 1️⃣ Smart Transaction Management

### 📌 Description
Allows users to add income and expense transactions across multiple accounts.

### ⚙️ How It Works
- User selects account, category, amount, date
- Backend validates balance (no negative allowed)
- Transaction stored in SQLite DB
- Account balance updated atomically

### 🧠 Smart Logic
- Prevents expenses exceeding available balance
- Auto-tags categories
- Calculates before/after balance impact

### 🎯 Impact
- Prevents overspending
- Encourages responsible money usage

---

## 2️⃣ Account Management System

### 📌 Description
Users can create and manage multiple financial accounts.

### ⚙️ How It Works
- Account name, type, initial balance stored
- Color-coded UI for clarity
- Linked to all transactions

### 🎯 Impact
- Multi-account clarity
- Clean financial separation

---

## 3️⃣ AI-Powered Smart Insights (RAG-based)

### 📌 Description
A background AI engine analyzes spending behavior and provides suggestions.

### ⚙️ How It Works
- Transaction data stored as context
- RAG engine retrieves relevant spending history
- AI generates insights (saving trends, alerts)

### 🧠 AI Capabilities
- Daily spending average
- Savings projection
- Category overspend detection

### 🎯 Impact
- Passive financial guidance
- No user effort required

---

## 4️⃣ Market Insights (Read-Only)

### 📌 Description
Stock market research panel inspired by Zerodha Kite.

### ⚙️ Features
- NIFTY 50 & NIFTY BANK overview
- Candlestick charts
- Indian market news feed
- LLM Council-based research

### 🎯 Impact
- Ethical investment research
- No trading → advisory-only
