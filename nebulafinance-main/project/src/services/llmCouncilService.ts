export const getCouncilAnalysis = async (symbol: string) => {
    // Simulate network delay
    console.log(`[LLMCouncil] Fetching analysis for ${symbol}`);
    await new Promise(resolve => setTimeout(resolve, 800));

    return {
        agents: [
            {
                id: "agent-1",
                title: "Agent-1",
                role: "Technical Analyst",
                analysis: "RSI indicates neutral momentum. Price consolidating near support. MACD showing early signs of crossover."
            },
            {
                id: "agent-2",
                title: "Agent-2",
                role: "Fundamental Analyst",
                analysis: "Strong balance sheet, moderate valuation, earnings stable. P/E ratio aligns with sector average."
            },
            {
                id: "agent-3",
                title: "Agent-3",
                role: "Market Sentiment",
                analysis: "News sentiment slightly bearish due to macro uncertainty. Social volume picking up with mixed signals."
            }
        ],
        chairman: {
            summary:
                "Consensus suggests cautious optimism. Stock shows long-term strength but short-term volatility. Recommendation: HOLD/ACCUMULATE on dips."
        }
    };
};
