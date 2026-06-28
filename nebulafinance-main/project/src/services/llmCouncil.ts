import { API_CONFIG } from '../config/apiConfig';

export interface StockQuery {
    symbol: string;
    companyName: string;
    currentPrice: number;
    marketCap: string;
}

export interface AnalystResponse {
    analyst: string;
    analysis: string;
    keyPoints: string[];
    confidence: string;
    error?: boolean;
}

export interface CouncilAnalysis {
    fundamental: AnalystResponse;
    technical: AnalystResponse;
    sentiment: AnalystResponse;
    chairman: {
        summary: string;
        consensus: string;
        riskFactors: string[];
        opportunities: string[];
        error?: boolean;
    };
}

class LLMCouncilService {

    private async callClaude(prompt: string, role: string): Promise<string> {
        try {
            if (!API_CONFIG.ANTHROPIC.API_KEY) {
                throw new Error('Missing Anthropic API Key');
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUTS.ANALYST);

            const response = await fetch(API_CONFIG.ANTHROPIC.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': API_CONFIG.ANTHROPIC.API_KEY,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: API_CONFIG.ANTHROPIC.MODEL,
                    max_tokens: 1000,
                    messages: [{ role: 'user', content: prompt }]
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`API returned ${response.status}`);
            }

            const data = await response.json();
            return data.content[0].text;
        } catch (error: any) {
            console.error(`[LLM Council] ${role} call failed:`, error);
            throw error;
        }
    }

    // ---------- ANALYSTS ----------

    async getFundamentalAnalysis(query: StockQuery): Promise<AnalystResponse> {
        const prompt = `You are a Fundamental Analyst. Analyze ${query.companyName} (${query.symbol}).
    Price: ${query.currentPrice}, Market Cap: ${query.marketCap}.
    Focus: Valuation, business model, financial health.
    Output format:
    **Analysis:** [Text]
    **Key Points:** [Bullets]
    **Confidence:** [High/Med/Low]`;

        try {
            const text = await this.callClaude(prompt, 'Fundamental Analyst');
            return this.parseAnalystResponse('Fundamental Analyst', text);
        } catch (e) {
            return this.getErrorResponse('Fundamental Analyst');
        }
    }

    async getTechnicalAnalysis(query: StockQuery): Promise<AnalystResponse> {
        const prompt = `You are a Technical Analyst. Analyze ${query.companyName} (${query.symbol}).
    Price: ${query.currentPrice}.
    Focus: Trends, support/resistance, volume.
    Output format:
    **Analysis:** [Text]
    **Key Points:** [Bullets]
    **Confidence:** [High/Med/Low]`;

        try {
            const text = await this.callClaude(prompt, 'Technical Analyst');
            return this.parseAnalystResponse('Technical Analyst', text);
        } catch (e) {
            return this.getErrorResponse('Technical Analyst');
        }
    }

    async getSentimentAnalysis(query: StockQuery): Promise<AnalystResponse> {
        const prompt = `You are a Sentiment Analyst. Analyze ${query.companyName} (${query.symbol}).
    Price: ${query.currentPrice}.
    Focus: Market mood, news, social trends.
    Output format:
    **Analysis:** [Text]
    **Key Points:** [Bullets]
    **Confidence:** [High/Med/Low]`;

        try {
            const text = await this.callClaude(prompt, 'Sentiment Analyst');
            return this.parseAnalystResponse('Sentiment Analyst', text);
        } catch (e) {
            return this.getErrorResponse('Sentiment Analyst');
        }
    }

    // ---------- CHAIRMAN ----------

    async getChairmanSynthesis(query: StockQuery, analysts: any) {
        const prompt = `You are the Chairman. Synthesize these reports for ${query.companyName}:
    
    Fundamental: ${analysts.fundamental.analysis}
    Technical: ${analysts.technical.analysis}
    Sentiment: ${analysts.sentiment.analysis}
    
    Output format:
    **Executive Summary** [Text]
    **Areas of Agreement** [Text]
    **Key Risk Factors** [Bullets]
    **Potential Opportunities** [Bullets]`;

        try {
            const text = await this.callClaude(prompt, 'Chairman');
            return this.parseChairmanReport(text);
        } catch (e) {
            return {
                summary: 'Synthesis unavailable due to API error.',
                consensus: 'N/A',
                riskFactors: [],
                opportunities: [],
                error: true
            };
        }
    }

    // ---------- MAIN ----------

    async analyzeStock(query: StockQuery): Promise<CouncilAnalysis> {
        console.log('[LLM Council] Starting analysis for', query.symbol);

        // Run all analysts sequentially or in parallel? Parallel is faster.
        const [fundamental, technical, sentiment] = await Promise.all([
            this.getFundamentalAnalysis(query),
            this.getTechnicalAnalysis(query),
            this.getSentimentAnalysis(query)
        ]);

        // Chairman synthesizes results
        const chairman = await this.getChairmanSynthesis(query, {
            fundamental,
            technical,
            sentiment
        });

        return {
            fundamental,
            technical,
            sentiment,
            chairman
        };
    }

    // ---------- HELPERS ----------

    private parseAnalystResponse(analyst: string, text: string): AnalystResponse {
        const analysisMatch = text.match(/\*\*Analysis:\*\*(.+?)(?=\*\*Key Points|\*\*Confidence|$)/s);
        const keyPointsMatch = text.match(/\*\*Key Points:\*\*(.+?)(?=\*\*Confidence|$)/s);
        const confidenceMatch = text.match(/\*\*Confidence:\*\*(.+?)$/s);

        return {
            analyst,
            analysis: analysisMatch?.[1]?.trim() || text.substring(0, 200) + '...',
            keyPoints: keyPointsMatch?.[1]?.trim().split('\n').map(p => p.replace(/^[-*•]\s*/, '')).filter(Boolean) || [],
            confidence: confidenceMatch?.[1]?.trim() || 'Medium'
        };
    }

    private parseChairmanReport(text: string) {
        return {
            summary: text.match(/\*\*Executive Summary\*\*(.+?)(?=\*\*|$)/s)?.[1]?.trim() || '',
            consensus: text.match(/\*\*Areas of Agreement\*\*(.+?)(?=\*\*|$)/s)?.[1]?.trim() || '',
            riskFactors: this.extractBulletPoints(text, 'Key Risk Factors'),
            opportunities: this.extractBulletPoints(text, 'Potential Opportunities')
        };
    }

    private extractBulletPoints(text: string, section: string): string[] {
        const match = text.match(new RegExp(`\\*\\*${section}\\*\\*(.+?)(?=\\*\\*|$)`, 's'));
        if (!match) return [];
        return match[1].split('\n').filter(line => line.trim().length > 0).map(l => l.replace(/^[-*•]\s*/, '').trim());
    }

    private getErrorResponse(analyst: string): AnalystResponse {
        return {
            analyst,
            analysis: 'Analysis unavailable via AI service at this time.',
            keyPoints: ['Connection failed or timeout'],
            confidence: 'N/A',
            error: true
        };
    }
}

export const llmCouncil = new LLMCouncilService();
