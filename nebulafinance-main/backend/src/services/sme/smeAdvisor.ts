/**
 * SME Growth & Advisory Agent — orchestrator.
 *
 * Reuses the AI-Council pattern (multi-agent -> Chairman consensus -> explainable
 * output), retargeted from stocks to SME business analysis, powered by Gemma.
 *
 * Flow:
 *   1. ROUTER (Gemma small / gemma-3-4b-it): reads the business question and the
 *      tool catalogue, and CALLS the relevant structured tools. This is the
 *      tool-use step — the model chooses tools, it does not invent numbers.
 *   2. TOOLS (deterministic): pricing / forecast / collections compute the actual
 *      figures from the seed ledger.
 *   3. CHAIRMAN (Gemma large / gemma-3-27b-it): synthesises the tool outputs into
 *      one plain-language recommendation with a visible reasoning trace.
 *
 * Every step degrades gracefully if GEMMA_API_KEY is absent, so the demo runs
 * end-to-end before the key is added; once the key is set, Gemma drives it.
 */

import { SME_SEED_DATA } from './seedSmeData';
import { SME_TOOLS, ToolName, AgentResult } from './agentTools';
import { callGemmaJson, gemmaStatus, GEMMA_MODELS } from '../gemma/gemmaClient';

export interface ChairmanReport {
    summary: string;
    consensus: string;
    riskFactors: string[];
    opportunities: string[];
    error?: boolean;
}

export interface SmeAdvisorResponse {
    question: string;
    business: typeof SME_SEED_DATA.business;
    agents: AgentResult[];
    chairman: ChairmanReport;
    toolTrace: Array<{ tool: string; calledBy: string; reason: string }>;
    gemma: ReturnType<typeof gemmaStatus>;
    dataSource: 'seed-demo';
}

// Infer which product a question refers to (by name/category words) so pricing
// answers the product the owner actually named, even without the Gemma router.
function inferProductId(question: string): string | undefined {
    const q = question.toLowerCase();
    let bestId: string | undefined;
    let bestScore = 0;
    for (const p of SME_SEED_DATA.products) {
        const words = new Set(
            `${p.name} ${p.category}`
                .toLowerCase()
                .split(/[^a-z]+/)
                .filter((w) => w.length > 3) // skip "per", "the", etc.
        );
        // Score by how many distinctive product words appear in the question,
        // so "cotton sarees" beats a silk product that only shares "sarees".
        let score = 0;
        for (const w of words) if (q.includes(w)) score++;
        if (score > bestScore) {
            bestScore = score;
            bestId = p.id;
        }
    }
    return bestScore > 0 ? bestId : undefined;
}

// ---------------------------------------------------------------------------
// Step 1 — ROUTER (small Gemma, with keyword fallback)
// ---------------------------------------------------------------------------
async function routeTools(
    question: string
): Promise<{ tools: ToolName[]; reason: string; source: string }> {
    const catalogue = Object.values(SME_TOOLS)
        .map((t) => `- ${t.name}: ${t.description}`)
        .join('\n');

    const routed = await callGemmaJson<{ tools: string[]; reason: string }>({
        size: 'small',
        system:
            'You are a routing classifier for an SME business advisor. Given a business owner\'s question, decide which analysis tools to call. Respond with ONLY JSON: {"tools": ["<names>"], "reason": "<one line>"}.',
        prompt: `Available tools:\n${catalogue}\n\nQuestion: "${question}"\n\nReturn the subset of tool names relevant to the question (one or more).`,
        temperature: 0,
        maxTokens: 256,
    });

    if (routed?.tools?.length) {
        const valid = routed.tools.filter((t): t is ToolName => t in SME_TOOLS);
        if (valid.length) {
            return {
                tools: valid,
                reason: routed.reason || 'Selected by Gemma router.',
                source: `Gemma (${GEMMA_MODELS.small})`,
            };
        }
    }

    // Fallback: keyword heuristic; default to all three if nothing matches.
    const q = question.toLowerCase();
    const picked = new Set<ToolName>();
    if (/(price|pricing|margin|discount|raise|lower|cost)/.test(q)) picked.add('pricing');
    if (/(revenue|sales|forecast|project|growth|next month|plan)/.test(q)) picked.add('forecast');
    if (/(collect|receivable|overdue|late|payment|cash|supplier|vendor)/.test(q))
        picked.add('collections');
    const tools = picked.size ? Array.from(picked) : (['pricing', 'forecast', 'collections'] as ToolName[]);
    return {
        tools,
        reason: 'Selected by keyword fallback (Gemma router unavailable).',
        source: 'keyword-fallback',
    };
}

// ---------------------------------------------------------------------------
// Step 3 — CHAIRMAN (large Gemma, with deterministic template fallback)
// ---------------------------------------------------------------------------
async function synthesizeChairman(
    question: string,
    agents: AgentResult[]
): Promise<ChairmanReport> {
    const evidence = agents
        .map(
            (a) =>
                `### ${a.analyst} (confidence: ${a.confidence})\n${a.analysis}\nKey figures: ${JSON.stringify(a.metrics)}`
        )
        .join('\n\n');

    const chair = await callGemmaJson<ChairmanReport>({
        size: 'large',
        system:
            'You are the Chairman AI of an SME advisory council. Synthesise the specialist agents into ONE plain-language recommendation for a small business owner. Be concrete and ALWAYS cite the specific numbers (₹, %, days) from the agents. Respond with ONLY JSON: {"summary": "...", "consensus": "...", "riskFactors": ["..."], "opportunities": ["..."]}.',
        prompt: `Business question: "${question}"\n\nSpecialist agent findings:\n${evidence}\n\nProduce the synthesis JSON now.`,
        temperature: 0.35,
        maxTokens: 900,
    });

    if (chair?.summary) return chair;

    // --- Deterministic fallback synthesis (guarantees concrete numbers) ---
    return templateChairman(agents);
}

function templateChairman(agents: AgentResult[]): ChairmanReport {
    const pricing = agents.find((a) => a.analyst.startsWith('Pricing'));
    const forecast = agents.find((a) => a.analyst.startsWith('Revenue'));
    const risk = agents.find((a) => a.analyst.startsWith('Collections'));

    const summaryParts: string[] = [];
    if (pricing)
        summaryParts.push(
            `adjust ${pricing.metrics.productName} to ₹${Number(pricing.metrics.recommendedPrice).toLocaleString('en-IN')} (${pricing.metrics.priceChangePct}%) for a ${Number(pricing.metrics.monthlyProfitDelta) >= 0 ? '+' : ''}₹${Number(pricing.metrics.monthlyProfitDelta).toLocaleString('en-IN')}/mo profit swing`
        );
    if (forecast)
        summaryParts.push(
            `plan for next-month revenue near ₹${Number(forecast.metrics.forecast).toLocaleString('en-IN')} (${forecast.metrics.growthPct}% vs last month)`
        );
    if (risk)
        summaryParts.push(
            `chase ₹${Number(risk.metrics.totalOverdue).toLocaleString('en-IN')} of overdue receivables, starting with ${risk.metrics.worstPayer}`
        );

    return {
        summary:
            summaryParts.length > 0
                ? `Recommended actions: ${summaryParts.join('; ')}.`
                : 'No actionable findings from the selected agents.',
        consensus:
            'The agents agree on protecting margin while improving cash flow: optimise price where elasticity allows, forecast conservatively within the confidence band, and tighten collections on the largest overdue accounts.',
        riskFactors: [
            risk && risk.metrics.concentrationRisk === 'yes'
                ? `Supplier concentration: ${risk.metrics.topSupplier} is ${risk.metrics.topSupplierSharePct}% of purchases.`
                : 'Supplier mix is within a healthy range.',
            risk
                ? `${risk.metrics.worstPayer} carries ₹${Number(risk.metrics.worstPayerOverdue).toLocaleString('en-IN')} overdue.`
                : 'Receivables not analysed in this query.',
            pricing && Math.abs(Number(pricing.metrics.priceChangePct)) > 5
                ? 'Larger price moves may soften volume more than modelled — test on a small batch first.'
                : 'Pricing move is modest and low-risk.',
        ],
        opportunities: [
            pricing
                ? `Margin uplift on ${pricing.metrics.productName}: ${pricing.metrics.currentMarginPct}% → ${pricing.metrics.newMarginPct}%.`
                : 'Review pricing on price-sensitive lines.',
            forecast
                ? `Revenue trending up ~₹${Number(forecast.metrics.trendPerMonth).toLocaleString('en-IN')}/month — capacity to reinvest.`
                : 'Build a rolling revenue forecast.',
            'Diversify top-supplier dependence to unlock better terms and reduce delivery risk.',
        ],
    };
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------
export async function runSmeAdvisor(
    question: string,
    productId?: string
): Promise<SmeAdvisorResponse> {
    const { tools, reason, source } = await routeTools(question);
    const resolvedProductId = productId || inferProductId(question);

    const toolTrace = tools.map((t) => ({
        tool: SME_TOOLS[t].name,
        calledBy: source,
        reason,
    }));

    // Step 2 — run the selected deterministic tools.
    const agents: AgentResult[] = tools.map((t) =>
        SME_TOOLS[t].run(t === 'pricing' ? { productId: resolvedProductId } : {})
    );

    // Step 3 — Chairman synthesis.
    const chairman = await synthesizeChairman(question, agents);

    return {
        question,
        business: SME_SEED_DATA.business,
        agents,
        chairman,
        toolTrace,
        gemma: gemmaStatus(),
        dataSource: 'seed-demo',
    };
}
