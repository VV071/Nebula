import { useState } from 'react';
import { Layers, BarChart2, Activity, User } from 'lucide-react';

export function CouncilTabs() {
    const [activeTab, setActiveTab] = useState<'technical' | 'fundamental' | 'sentiment' | 'chairman'>('technical');

    const tabs = [
        { id: 'technical', label: 'Technical', icon: BarChart2, color: 'text-blue-500' },
        { id: 'fundamental', label: 'Fundamental', icon: Layers, color: 'text-purple-500' },
        { id: 'sentiment', label: 'Sentiment', icon: Activity, color: 'text-orange-500' },
        { id: 'chairman', label: 'Chairman', icon: User, color: 'text-emerald-500' },
    ] as const;

    return (
        <div className="mt-6 bg-surfaceHover-light dark:bg-surfaceHover-dark rounded-xl p-4 border border-light dark:border-dark">
            <div className="flex items-center justify-between mb-4 border-b border-light dark:border-dark pb-2">
                <h3 className="font-bold text-textPrimary-light dark:text-textPrimary-dark">AI Research Council</h3>
                <span className="text-xs font-mono text-textSecondary-light dark:text-textSecondary-dark bg-surface-light dark:bg-surface-dark px-2 py-1 rounded">
                    MOCK ANALYSIS
                </span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab.id
                            ? 'bg-surface-light dark:bg-surface-dark shadow-sm text-textPrimary-light dark:text-textPrimary-dark ring-1 ring-border-light dark:ring-border-dark'
                            : 'text-textSecondary-light dark:text-textSecondary-dark hover:bg-surface-light/50 dark:hover:bg-surface-dark/50'
                            }`}
                    >
                        <tab.icon className={`w-4 h-4 ${tab.color}`} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="min-h-[120px] text-sm text-textPrimary-light dark:text-textPrimary-dark leading-relaxed animate-fade-in">
                {activeTab === 'technical' && (
                    <p>
                        <strong className="text-blue-500">Technical Analyst:</strong> The index is currently testing key resistance levels.
                        RSI indicates slightly overbought conditions on the daily timeframe, but momentum remains strong.
                        Moving averages (20 EMA &gt; 50 SMA) confirm the bullish trend. Watch for a potential retracement to support zones before further upside.
                    </p>
                )}
                {activeTab === 'fundamental' && (
                    <p>
                        <strong className="text-purple-500">Fundamental Analyst:</strong> Corporate earnings for the quarter have exceeded street estimates, providing strong fundamental support.
                        Banking and auto sectors are driving growth. PE ratios are slightly elevated but justifiable given the projected GDP growth rate.
                    </p>
                )}
                {activeTab === 'sentiment' && (
                    <p>
                        <strong className="text-orange-500">Sentiment Analyst:</strong> Market sentiment is predominantly positive, driven by favorable global cues and stable domestic inflation data.
                        Retail participation is at an all-time high. News flows regarding infrastructure spending are boosting confidence.
                    </p>
                )}
                {activeTab === 'chairman' && (
                    <p>
                        <strong className="text-emerald-500">Chairman Summary:</strong> The council remains cautiously optimistic.
                        While technicals suggest a minor cool-off, fundamentals and sentiment provide a strong safety net.
                        <br /><br />
                        <em className="text-xs opacity-70">"Buy the dips" seems to be the prevailing strategy, but strict stop-losses are advised.</em>
                    </p>
                )}
            </div>

            <div className="mt-4 pt-3 border-t border-light dark:border-dark text-xs text-textSecondary-light dark:text-textSecondary-dark text-center italic">
                Disclaimer: AI-generated research for educational visualization only. Not financial advice.
            </div>
        </div>
    );
}
