/**
 * SME Advisory — deterministic agent tools.
 *
 * These are the "tools" the Gemma orchestrator calls. All numbers in the SME
 * Advisor come from THIS file (real arithmetic over the seed data) — the LLM
 * never invents figures, it only routes to these tools and narrates their
 * output. This keeps every recommendation grounded in a concrete number.
 *
 * Tools:
 *   1. pricingTool              — elasticity-based price recommendation
 *   2. revenueForecastTool      — least-squares trend forecast + confidence band
 *   3. collectionsRiskTool      — receivables ageing + supplier concentration risk
 */

import {
    SME_SEED_DATA,
    SmeDataset,
    getSeedProductById,
} from './seedSmeData';

const round = (n: number, dp = 0) => {
    const f = Math.pow(10, dp);
    return Math.round(n * f) / f;
};
const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

/** Standard AI-Council-compatible shape so the frontend can reuse AnalystCard. */
export interface AgentResult {
    analyst: string;
    analysis: string;
    keyPoints: string[];
    confidence: 'High' | 'Medium' | 'Low';
    /** Structured numbers behind the narrative (used for the Chairman + charts). */
    metrics: Record<string, number | string>;
    error?: boolean;
}

// ---------------------------------------------------------------------------
// TOOL 1 — Pricing Agent
// ---------------------------------------------------------------------------
export function pricingTool(
    args: { productId?: string },
    data: SmeDataset = SME_SEED_DATA
): AgentResult {
    // Default to the most price-sensitive product if none specified.
    const product =
        (args.productId && getSeedProductById(args.productId)) ||
        data.products.reduce((a, b) => (b.priceElasticity < a.priceElasticity ? b : a));

    const avgUnits =
        product.monthlyUnitsSold.reduce((s, u) => s + u, 0) /
        product.monthlyUnitsSold.length;

    const currentMargin = product.currentPrice - product.unitCost;
    const currentMarginPct = (currentMargin / product.currentPrice) * 100;
    const currentRevenue = product.currentPrice * avgUnits;
    const currentProfit = currentMargin * avgUnits;

    // Search a small grid of price changes and pick the one that maximises
    // projected monthly gross profit using the product's own-price elasticity:
    //   %ΔQ = elasticity * %ΔP
    const candidates: Array<{ deltaPct: number; profit: number; units: number; price: number }> = [];
    for (let deltaPct = -10; deltaPct <= 15; deltaPct += 1) {
        const newPrice = product.currentPrice * (1 + deltaPct / 100);
        const qChangePct = product.priceElasticity * deltaPct;
        const newUnits = avgUnits * (1 + qChangePct / 100);
        if (newUnits <= 0 || newPrice <= product.unitCost) continue;
        const profit = (newPrice - product.unitCost) * newUnits;
        candidates.push({ deltaPct, profit, units: newUnits, price: newPrice });
    }
    const best = candidates.reduce((a, b) => (b.profit > a.profit ? b : a));

    const newProfit = best.profit;
    const newRevenue = best.price * best.units;
    const profitDelta = newProfit - currentProfit;
    const profitDeltaPct = (profitDelta / currentProfit) * 100;
    const newMarginPct = ((best.price - product.unitCost) / best.price) * 100;

    const direction = best.deltaPct > 0 ? 'increase' : best.deltaPct < 0 ? 'decrease' : 'hold';
    const confidence: AgentResult['confidence'] =
        Math.abs(product.priceElasticity) < 1 ? 'High' : Math.abs(best.deltaPct) <= 5 ? 'Medium' : 'Low';

    const analysis =
        direction === 'hold'
            ? `${product.name} is already near its profit-optimal price of ${inr(product.currentPrice)}. Holding is recommended; current gross margin is ${round(currentMarginPct, 1)}%.`
            : `Recommend a ${Math.abs(best.deltaPct)}% price ${direction} on ${product.name}, from ${inr(product.currentPrice)} to ${inr(best.price)}. With an estimated own-price elasticity of ${product.priceElasticity}, monthly volume moves to ~${round(best.units)} units and monthly gross profit changes by ${inr(profitDelta)} (${profitDelta >= 0 ? '+' : ''}${round(profitDeltaPct, 1)}%).`;

    return {
        analyst: 'Pricing Agent',
        analysis,
        keyPoints: [
            `Current: ${inr(product.currentPrice)} price, ${round(currentMarginPct, 1)}% margin, ~${round(avgUnits)} units/mo`,
            `Recommended: ${inr(best.price)} (${best.deltaPct >= 0 ? '+' : ''}${best.deltaPct}%), new margin ${round(newMarginPct, 1)}%`,
            `Projected monthly gross-profit impact: ${inr(profitDelta)} (${profitDelta >= 0 ? '+' : ''}${round(profitDeltaPct, 1)}%)`,
            `Projected monthly revenue: ${inr(currentRevenue)} → ${inr(newRevenue)}`,
        ],
        confidence,
        metrics: {
            productId: product.id,
            productName: product.name,
            currentPrice: round(product.currentPrice),
            recommendedPrice: round(best.price),
            priceChangePct: best.deltaPct,
            currentMarginPct: round(currentMarginPct, 1),
            newMarginPct: round(newMarginPct, 1),
            monthlyProfitDelta: round(profitDelta),
            monthlyProfitDeltaPct: round(profitDeltaPct, 1),
            elasticity: product.priceElasticity,
        },
    };
}

// ---------------------------------------------------------------------------
// TOOL 2 — Revenue Forecasting Agent
// ---------------------------------------------------------------------------
export function revenueForecastTool(
    _args: Record<string, unknown>,
    data: SmeDataset = SME_SEED_DATA
): AgentResult {
    const y = data.monthlyRevenue;
    const n = y.length;
    const x = Array.from({ length: n }, (_, i) => i);

    // Ordinary least-squares linear trend: y = a + b*x
    const meanX = x.reduce((s, v) => s + v, 0) / n;
    const meanY = y.reduce((s, v) => s + v, 0) / n;
    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
        num += (x[i] - meanX) * (y[i] - meanY);
        den += (x[i] - meanX) ** 2;
    }
    const b = num / den;
    const a = meanY - b * meanX;

    // Residual standard deviation -> confidence band for the next point.
    let sse = 0;
    for (let i = 0; i < n; i++) {
        const fit = a + b * x[i];
        sse += (y[i] - fit) ** 2;
    }
    const residualStd = Math.sqrt(sse / (n - 2));

    const nextX = n;
    const forecast = a + b * nextX;
    // ~80% band (±1.28σ) widened slightly for out-of-sample uncertainty.
    const band = 1.28 * residualStd * 1.1;
    const low = forecast - band;
    const high = forecast + band;

    const lastActual = y[n - 1];
    const growthPct = ((forecast - lastActual) / lastActual) * 100;
    const momTrendPct = (b / meanY) * 100;

    const confidence: AgentResult['confidence'] =
        band / forecast < 0.05 ? 'High' : band / forecast < 0.1 ? 'Medium' : 'Low';

    const analysis = `Next-month revenue is projected at ${inr(forecast)} (80% range ${inr(low)}–${inr(high)}), versus ${inr(lastActual)} last month — about ${growthPct >= 0 ? '+' : ''}${round(growthPct, 1)}%. The 12-month trend is rising ~${inr(b)}/month (${round(momTrendPct, 1)}% of average monthly revenue).`;

    return {
        analyst: 'Revenue Forecasting Agent',
        analysis,
        keyPoints: [
            `Point forecast (next month): ${inr(forecast)}`,
            `80% confidence range: ${inr(low)} – ${inr(high)}`,
            `Vs last month (${inr(lastActual)}): ${growthPct >= 0 ? '+' : ''}${round(growthPct, 1)}%`,
            `Underlying trend: ${inr(b)}/month (${round(momTrendPct, 1)}%/mo)`,
        ],
        confidence,
        metrics: {
            forecast: round(forecast),
            low: round(low),
            high: round(high),
            lastActual: round(lastActual),
            growthPct: round(growthPct, 1),
            trendPerMonth: round(b),
        },
    };
}

// ---------------------------------------------------------------------------
// TOOL 3 — Collections / Supplier Risk Agent
// ---------------------------------------------------------------------------
export function collectionsRiskTool(
    _args: Record<string, unknown>,
    data: SmeDataset = SME_SEED_DATA
): AgentResult {
    // --- Receivables ageing ---
    let totalOverdue = 0;
    const lateCustomers: Array<{ name: string; overdue: number; worstDaysLate: number }> = [];

    for (const c of data.customers) {
        let custOverdue = 0;
        let worstLate = 0;
        for (const inv of c.invoices) {
            if (inv.paidDaysAgo === null) {
                const daysOutstanding = inv.issuedDaysAgo;
                const daysLate = daysOutstanding - c.agreedTermsDays;
                if (daysLate > 0) {
                    custOverdue += inv.amount;
                    worstLate = Math.max(worstLate, daysLate);
                }
            }
        }
        if (custOverdue > 0) {
            totalOverdue += custOverdue;
            lateCustomers.push({ name: c.name, overdue: custOverdue, worstDaysLate: worstLate });
        }
    }
    lateCustomers.sort((a, b) => b.overdue - a.overdue);
    const worstPayer = lateCustomers[0];

    // --- Supplier concentration (Herfindahl-Hirschman Index) ---
    const hhi = data.suppliers.reduce((s, sup) => s + sup.purchaseShare ** 2, 0);
    const topSupplier = data.suppliers.reduce((a, b) => (b.purchaseShare > a.purchaseShare ? b : a));
    const concentrationRisk = topSupplier.purchaseShare >= 0.4 || hhi >= 0.3;

    const confidence: AgentResult['confidence'] = 'High'; // deterministic from ledger

    const analysis = `${inr(totalOverdue)} is overdue across ${lateCustomers.length} customer${lateCustomers.length === 1 ? '' : 's'}. The largest exposure is ${worstPayer ? `${worstPayer.name} (${inr(worstPayer.overdue)}, up to ${worstPayer.worstDaysLate} days late)` : 'none'}. On the supply side, ${topSupplier.name} accounts for ${round(topSupplier.purchaseShare * 100)}% of purchases (HHI ${round(hhi, 2)})${concentrationRisk ? ' — a concentration risk worth diversifying' : ' — within a healthy range'}.`;

    const keyPoints = [
        `Total overdue receivables: ${inr(totalOverdue)}`,
        ...lateCustomers.slice(0, 3).map(
            (c) => `${c.name}: ${inr(c.overdue)} overdue, up to ${c.worstDaysLate} days late`
        ),
        `Supplier concentration: ${topSupplier.name} = ${round(topSupplier.purchaseShare * 100)}% of spend (HHI ${round(hhi, 2)})`,
    ];

    return {
        analyst: 'Collections & Supplier Risk Agent',
        analysis,
        keyPoints,
        confidence,
        metrics: {
            totalOverdue: round(totalOverdue),
            lateCustomerCount: lateCustomers.length,
            worstPayer: worstPayer ? worstPayer.name : 'none',
            worstPayerOverdue: worstPayer ? round(worstPayer.overdue) : 0,
            topSupplier: topSupplier.name,
            topSupplierSharePct: round(topSupplier.purchaseShare * 100),
            hhi: round(hhi, 2),
            concentrationRisk: concentrationRisk ? 'yes' : 'no',
        },
    };
}

// ---------------------------------------------------------------------------
// Tool registry — this is the "function catalogue" exposed to the Gemma
// orchestrator. Each entry has a name + description the model uses to decide
// which tools to call for a given business question.
// ---------------------------------------------------------------------------
export interface ToolSpec {
    name: string;
    description: string;
    run: (args: any) => AgentResult;
}

export const SME_TOOLS: Record<string, ToolSpec> = {
    pricing: {
        name: 'pricing',
        description:
            'Recommend a price adjustment for a product using cost, margin and price-elasticity, with projected revenue/profit impact. Use for pricing, margin, discount or "should I raise/lower price" questions. Optional arg: productId.',
        run: (args) => pricingTool(args || {}),
    },
    forecast: {
        name: 'forecast',
        description:
            'Forecast next period revenue from the historical sales time series, with a confidence range. Use for revenue, sales projection, growth or planning questions.',
        run: (args) => revenueForecastTool(args || {}),
    },
    collections: {
        name: 'collections',
        description:
            'Analyse customer payment history for overdue/late-paying customers and assess supplier concentration risk. Use for collections, receivables, cash-flow, late payment or supplier questions.',
        run: (args) => collectionsRiskTool(args || {}),
    },
};

export type ToolName = keyof typeof SME_TOOLS;
