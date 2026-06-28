import { useState, useEffect } from 'react';
import { Bot, GraduationCap, TrendingUp, Building2, MessageSquare } from 'lucide-react';
import { getCouncilAnalysis } from '../services/llmCouncilService';
import { CouncilTabs } from './CouncilTabs';
import { motion, AnimatePresence } from 'framer-motion';

interface LLMCouncilProps {
    symbol: string;
}

interface Agent {
    id: string;
    title: string;
    role: string;
    analysis: string;
}

interface CouncilData {
    agents: Agent[];
    chairman: {
        summary: string;
    };
}

export function LLMCouncil({ symbol }: LLMCouncilProps) {
    const [data, setData] = useState<CouncilData | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('chairman');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const result = await getCouncilAnalysis(symbol);
                setData(result);
            } catch (error) {
                console.error('Failed to fetch council analysis:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [symbol]);

    const tabs = [
        { id: 'chairman', label: 'Chairman' },
        { id: 'agent-1', label: 'Agent-1' },
        { id: 'agent-2', label: 'Agent-2' },
        { id: 'agent-3', label: 'Agent-3' },
    ];

    if (loading) {
        return (
            <div className="glass-card p-6 min-h-[300px] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500/20 border-t-primary-500 rounded-full" />
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-textPrimary-light dark:text-textPrimary-dark flex items-center gap-2">
                    <Bot className="w-6 h-6 text-primary-500" /> LLM Council
                    <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-primary-100/50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800">
                        AI Consensus
                    </span>
                </h2>
            </div>

            <CouncilTabs
                tabs={tabs}
                activeTab={activeTab}
                onChange={setActiveTab}
            />

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="min-h-[150px]"
                >
                    {activeTab === 'chairman' ? (
                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-surface-dark border border-primary-100 dark:border-primary-800/50">
                            <div className="text-4xl text-primary-500"><GraduationCap className="w-10 h-10" /></div>
                                <div>
                                    <h3 className="text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-1">
                                        Chairman's Synthesis
                                    </h3>
                                    <p className="text-textSecondary-light dark:text-textSecondary-dark leading-relaxed">
                                        {data.chairman.summary}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {data.agents.filter(a => a.id === activeTab).map(agent => (
                                <div key={agent.id}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                            {agent.id === 'agent-1' ? (
                                                <TrendingUp className="w-5 h-5 text-green-500" />
                                            ) : agent.id === 'agent-2' ? (
                                                <Building2 className="w-5 h-5 text-blue-500" />
                                            ) : (
                                                <MessageSquare className="w-5 h-5 text-purple-500" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-textPrimary-light dark:text-textPrimary-dark">
                                                {agent.title}
                                            </h3>
                                            <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark uppercase tracking-wider font-medium">
                                                {agent.role}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-surface-light dark:bg-surface-dark border border-light dark:border-dark">
                                        <p className="text-textSecondary-light dark:text-textSecondary-dark leading-relaxed">
                                            {agent.analysis}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
