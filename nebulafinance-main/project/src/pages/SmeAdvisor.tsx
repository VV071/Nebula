import { useEffect, useState } from 'react';
import { Sparkles, Send, Info, Building2, Cpu, Route } from 'lucide-react';
import { AnalystCard } from '../components/market/AnalystCard';
import { ChairmanReport } from '../components/market/ChairmanReport';
import { smeService, SmeAdvisorResponse, SmeAgentResult } from '../services/smeService';
import type { AnalystResponse } from '../services/llmCouncil';

const SAMPLE_QUESTIONS = [
    'Should I raise prices on my cotton sarees?',
    'What revenue should I plan for next month?',
    'Which customers are late paying and how is my cash flow?',
    'Which supplier should I renegotiate with?',
];

// Icon + one-line role per agent, matched to the AI-Council card pattern.
function agentMeta(analyst: string): { icon: string; description: string } {
    if (analyst.startsWith('Pricing'))
        return { icon: '🏷️', description: 'Price & margin optimisation' };
    if (analyst.startsWith('Revenue'))
        return { icon: '📈', description: 'Revenue forecasting' };
    if (analyst.startsWith('Collections'))
        return { icon: '🧾', description: 'Collections & supplier risk' };
    return { icon: '🤖', description: 'SME analysis' };
}

export default function SmeAdvisor() {
    const [question, setQuestion] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<SmeAdvisorResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [gemmaConfigured, setGemmaConfigured] = useState<boolean | null>(null);

    useEffect(() => {
        smeService
            .getStatus()
            .then((s) => setGemmaConfigured(s.gemma.configured))
            .catch(() => setGemmaConfigured(null));
    }, []);

    const ask = async (q: string) => {
        if (!q.trim() || loading) return;
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const res = await smeService.advise(q.trim());
            setResult(res);
            setGemmaConfigured(res.gemma.configured);
        } catch (err: any) {
            setError(
                err?.message?.includes('Failed to fetch')
                    ? 'Cannot reach the backend. Make sure the API is running on port 5005.'
                    : err?.message || 'Advisory request failed.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        ask(question);
    };

    const agents: SmeAgentResult[] = result?.agents ?? [];

    return (
        <div className="page-wrapper">
            {/* Header */}
            <div className="max-w-[1400px] mx-auto mb-8">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                        <h1 className="text-display font-extrabold text-textPrimary-light dark:text-textPrimary-dark mb-2 flex items-center gap-3">
                            <Building2 className="w-8 h-8 text-primary-500" />
                            SME Advisor
                            <span className="text-primary-500 text-lg align-top bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-md">
                                Beta
                            </span>
                        </h1>
                        <p className="text-textSecondary-light dark:text-textSecondary-dark flex items-center gap-2">
                            <Info className="w-4 h-4" />
                            Ask a business question. A council of AI agents analyses your data and the Chairman gives one clear recommendation.
                        </p>
                    </div>

                    {/* Gemma + data-source status */}
                    <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
                        <div
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${
                                gemmaConfigured
                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                    : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                            }`}
                        >
                            <Cpu className="w-3.5 h-3.5" />
                            {gemmaConfigured
                                ? 'Gemma connected'
                                : 'Gemma key not set — deterministic engine'}
                        </div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-textSecondary-light dark:text-textSecondary-dark bg-surfaceHover-light dark:bg-surfaceHover-dark px-2 py-1 rounded">
                            Seed / demo data
                        </span>
                    </div>
                </div>
            </div>

            {/* Ask box */}
            <div className="max-w-[1400px] mx-auto space-y-8">
                <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-light dark:border-dark">
                    {result?.business && (
                        <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark mb-4">
                            Advising <span className="font-bold text-textPrimary-light dark:text-textPrimary-dark">{result.business.name}</span> — {result.business.type}, {result.business.city}
                        </p>
                    )}
                    <form onSubmit={handleSubmit} className="flex gap-4">
                        <div className="relative flex-1">
                            <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-textSecondary-light dark:text-textSecondary-dark" />
                            <input
                                type="text"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="e.g. Should I raise prices on my cotton sarees?"
                                className="w-full pl-12 pr-4 py-4 rounded-xl bg-surfaceHover-light dark:bg-surfaceHover-dark border-none focus:ring-2 focus:ring-primary-500 text-lg"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !question.trim()}
                            className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            <Send className="w-4 h-4" />
                            {loading ? 'Advising…' : 'Ask'}
                        </button>
                    </form>

                    {/* Sample questions */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        {SAMPLE_QUESTIONS.map((q) => (
                            <button
                                key={q}
                                onClick={() => {
                                    setQuestion(q);
                                    ask(q);
                                }}
                                disabled={loading}
                                className="text-xs px-3 py-1.5 rounded-full bg-surfaceHover-light dark:bg-surfaceHover-dark text-textSecondary-light dark:text-textSecondary-dark hover:text-primary-600 dark:hover:text-primary-400 border border-light dark:border-dark transition-colors disabled:opacity-50"
                            >
                                {q}
                            </button>
                        ))}
                    </div>

                    {error && (
                        <div className="mt-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-xl p-4">
                            {error}
                        </div>
                    )}
                </div>

                {/* Reasoning trace — which tools the router called */}
                {result && result.toolTrace.length > 0 && (
                    <div className="bg-surfaceHover-light dark:bg-surfaceHover-dark rounded-xl p-4 border border-light dark:border-dark">
                        <div className="flex items-center gap-2 mb-2">
                            <Route className="w-4 h-4 text-primary-500" />
                            <h3 className="text-xs font-bold uppercase tracking-wider text-textSecondary-light dark:text-textSecondary-dark">
                                Agents engaged
                            </h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {result.toolTrace.map((t) => (
                                <span
                                    key={t.tool}
                                    className="text-xs px-2.5 py-1 rounded-lg bg-surface-light dark:bg-surface-dark border border-light dark:border-dark text-textPrimary-light dark:text-textPrimary-dark"
                                    title={t.reason}
                                >
                                    {t.tool} · <span className="text-textSecondary-light dark:text-textSecondary-dark">{t.calledBy}</span>
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Agent cards (reused AI-Council component) */}
                {(loading || agents.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {loading && agents.length === 0
                            ? [0, 1, 2].map((i) => (
                                  <AnalystCard
                                      key={i}
                                      name="Analysing…"
                                      icon="⏳"
                                      description="SME agent"
                                      analysis={null}
                                      loading={true}
                                  />
                              ))
                            : agents.map((a) => {
                                  const meta = agentMeta(a.analyst);
                                  return (
                                      <AnalystCard
                                          key={a.analyst}
                                          name={a.analyst}
                                          icon={meta.icon}
                                          description={meta.description}
                                          analysis={a as AnalystResponse}
                                          loading={false}
                                      />
                                  );
                              })}
                    </div>
                )}

                {/* Chairman synthesis (reused AI-Council component) */}
                {(loading || result) && (
                    <ChairmanReport report={result?.chairman ?? null} loading={loading && !result} />
                )}

                {/* Footer note: real logic vs seed data */}
                {result && (
                    <p className="text-center text-xs text-textSecondary-light dark:text-textSecondary-dark italic pb-4">
                        Figures are computed by deterministic agent tools over labelled seed data for a fictional business.
                        {gemmaConfigured
                            ? ' Routing & synthesis are powered by Gemma.'
                            : ' Add a Gemma API key to enable live Gemma routing & synthesis.'}
                    </p>
                )}
            </div>
        </div>
    );
}
