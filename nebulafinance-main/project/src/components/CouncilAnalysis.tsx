import { useState } from 'react';
import { Shield, Brain, TrendingUp, MessageCircle, Loader2, AlertTriangle } from 'lucide-react';
import '../styles/council.css';

interface CouncilAnalysisProps {
    symbol: string;
    companyName: string;
}

interface LLMResponse {
    text: string;
    confidence: 'Low' | 'Medium' | 'High';
    tokens: number;
    latency: number;
}

interface CouncilData {
    stage1: {
        agent1: LLMResponse;
        agent2: LLMResponse;
        agent3: LLMResponse;
    };
    stage2: {
        agent1Critique: string;
        agent2Critique: string;
        agent3Critique: string;
    };
    stage3: {
        chairmanVerdict: string;
        stance: 'Bullish' | 'Bearish' | 'Neutral';
        confidence: string;
        disclaimer: string;
    };
    metadata: {
        totalLatency: number;
        timestamp: string;
        query: string;
    };
}

export function CouncilAnalysis({ symbol, companyName }: CouncilAnalysisProps) {
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<CouncilData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('agent1');

    async function runCouncilAnalysis() {
        setLoading(true);
        setError(null);

        console.log('[Frontend] Starting council analysis...');
        console.log('[Frontend] Symbol:', symbol);
        console.log('[Frontend] Company:', companyName);

        try {
            const query = `Analyze ${companyName} (${symbol}) from your specialized perspective. Consider recent trends, fundamentals, technicals, and market sentiment.`;

            // Use environment variable for API URL with fallback
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005';
            const url = `${API_BASE_URL}/api/council/analyze`;

            console.log('[Frontend] API URL:', url);
            console.log('[Frontend] Request body:', { symbol, query: query.substring(0, 50) + '...' });

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ symbol, query })
            });

            console.log('[Frontend] Response status:', response.status);
            console.log('[Frontend] Response ok:', response.ok);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.error('[Frontend] Error data:', errorData);
                throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log('[Frontend] ✅ Success, data received');
            console.log('[Frontend] Data structure:', {
                success: data.success,
                hasData: !!data.data,
                hasStage1: !!data.data?.stage1,
                hasStage2: !!data.data?.stage2,
                hasStage3: !!data.data?.stage3
            });

            setAnalysis(data.data);

        } catch (err) {
            console.error('[Frontend] ❌ Error:', err);
            let errorMessage = err instanceof Error ? err.message : 'Failed to run council analysis';

            // Show more helpful error messages
            if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
                errorMessage = 'Cannot connect to backend. Make sure server is running on port 5005.';
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="council-analysis">
            <div className="council-header">
                <div className="header-content">
                    <Shield className="council-icon" size={32} />
                    <div>
                        <h2>LLM Council Analysis</h2>
                        <p>Multi-agent AI research powered by 3 independent models</p>
                    </div>
                </div>
                <button
                    className="btn-primary"
                    onClick={runCouncilAnalysis}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <Brain size={20} />
                            Run Council Analysis
                        </>
                    )}
                </button>
            </div>

            {error && (
                <div className="error-banner flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" /> {error}
                </div>
            )}

            {analysis && (
                <>
                    {/* Stage 1: Individual Agents */}
                    <div className="council-tabs">
                        <button
                            className={activeTab === 'agent1' ? 'active' : ''}
                            onClick={() => setActiveTab('agent1')}
                        >
                            <Brain size={18} />
                            Agent-1
                            <span className="confidence-badge">{analysis.stage1.agent1.confidence}</span>
                        </button>

                        <button
                            className={activeTab === 'agent2' ? 'active' : ''}
                            onClick={() => setActiveTab('agent2')}
                        >
                            <TrendingUp size={18} />
                            Agent-2
                            <span className="confidence-badge">{analysis.stage1.agent2.confidence}</span>
                        </button>

                        <button
                            className={activeTab === 'agent3' ? 'active' : ''}
                            onClick={() => setActiveTab('agent3')}
                        >
                            <MessageCircle size={18} />
                            Agent-3
                            <span className="confidence-badge">{analysis.stage1.agent3.confidence}</span>
                        </button>

                        <button
                            className={activeTab === 'chairman' ? 'active' : ''}
                            onClick={() => setActiveTab('chairman')}
                        >
                            <Shield size={18} />
                            Chairman
                            <span className="verdict-badge">{analysis.stage3.stance}</span>
                        </button>
                    </div>

                    <div className="tab-content">
                        {activeTab === 'agent1' && (
                            <AgentCard
                                name="Agent-1"
                                analysis={analysis.stage1.agent1}
                                critique={analysis.stage2.agent1Critique}
                            />
                        )}

                        {activeTab === 'agent2' && (
                            <AgentCard
                                name="Agent-2"
                                analysis={analysis.stage1.agent2}
                                critique={analysis.stage2.agent2Critique}
                            />
                        )}

                        {activeTab === 'agent3' && (
                            <AgentCard
                                name="Agent-3"
                                analysis={analysis.stage1.agent3}
                                critique={analysis.stage2.agent3Critique}
                            />
                        )}

                        {activeTab === 'chairman' && (
                            <ChairmanCard verdict={analysis.stage3} />
                        )}
                    </div>

                    <div className="council-disclaimer">
                        <div className="disclaimer-icon"><AlertTriangle className="w-6 h-6 text-amber-500" /></div>
                        <div>
                            <strong>Important Disclaimer:</strong>
                            <p>{analysis.stage3.disclaimer}</p>
                            <p>This council analysis is generated by AI models for research and educational purposes only. It represents computational analysis, not human financial advice. Always consult licensed financial advisors before making investment decisions.</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

interface AgentCardProps {
    name: string;
    analysis: LLMResponse;
    critique: string;
}

function AgentCard({ name, analysis, critique }: AgentCardProps) {
    return (
        <div className="agent-card">
            <h3>{name}</h3>

            <div className="analysis-section">
                <h4>Analysis</h4>
                <div className="analysis-text">
                    {analysis.text}
                </div>
            </div>

            <div className="stats">
                <div className="stat">
                    <span className="label">Confidence:</span>
                    <span className={`value confidence-${analysis.confidence.toLowerCase()}`}>
                        {analysis.confidence}
                    </span>
                </div>
                <div className="stat">
                    <span className="label">Response Time:</span>
                    <span className="value">{analysis.latency}ms</span>
                </div>
            </div>

            {critique && (
                <div className="critique-section">
                    <h4>Peer Evaluation</h4>
                    <div className="critique-text">
                        {critique}
                    </div>
                </div>
            )}
        </div>
    );
}

interface ChairmanCardProps {
    verdict: CouncilData['stage3'];
}

function ChairmanCard({ verdict }: ChairmanCardProps) {
    return (
        <div className="chairman-card">
            <div className="chairman-header">
                <Shield size={28} />
                <h3>Council Chairman's Final Verdict</h3>
            </div>

            <div className="verdict-badges">
                <div className={`stance-badge stance-${verdict.stance.toLowerCase()}`}>
                    {verdict.stance}
                </div>
                <div className="stance-badge">
                    Confidence: {verdict.confidence}
                </div>
            </div>

            <div className="verdict-content">
                {verdict.chairmanVerdict.split('\n\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                ))}
            </div>
        </div>
    );
}
