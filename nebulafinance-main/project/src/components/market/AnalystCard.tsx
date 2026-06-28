import { Loader2, AlertCircle } from 'lucide-react';
import { AnalystResponse } from '../../services/llmCouncil';
import { useTranslation } from 'react-i18next';

interface AnalystCardProps {
    name: string;
    icon: string | React.ReactNode;
    description: string;
    analysis: AnalystResponse | null;
    loading: boolean;
}

export function AnalystCard({ name, icon, description, analysis, loading }: AnalystCardProps) {
    const { t } = useTranslation();

    return (
        <div className="bg-surface-light dark:bg-surface-dark border border-light dark:border-dark rounded-2xl p-6 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-light dark:border-dark">
                <div className="text-3xl p-2 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                    {icon}
                </div>
                <div>
                    <h3 className="font-bold text-lg text-textPrimary-light dark:text-textPrimary-dark">{name}</h3>
                    <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark">{description}</p>
                </div>
            </div>

            <div className="flex-1">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center py-8 text-textSecondary-light dark:text-textSecondary-dark gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                        <p className="text-sm font-medium animate-pulse">{t('market.analyzing')}</p>
                    </div>
                ) : analysis ? (
                    analysis.error ? (
                        <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl flex items-start gap-3 text-red-600 dark:text-red-400">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p className="text-sm">{analysis.analysis}</p>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-scale-in">
                            <div className="prose dark:prose-invert prose-sm max-w-none">
                                <p className="text-textPrimary-light dark:text-textPrimary-dark leading-relaxed text-sm">
                                    {analysis.analysis}
                                </p>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-textSecondary-light dark:text-textSecondary-dark mb-2">{t('market.keyPoints')}</h4>
                                <ul className="space-y-2">
                                    {analysis.keyPoints.map((point, idx) => (
                                        <li key={idx} className="text-sm flex items-start gap-2 bg-surfaceHover-light dark:bg-surfaceHover-dark p-2 rounded-lg">
                                            <span className="text-primary-500 font-bold">•</span>
                                            <span className="text-textPrimary-light dark:text-textPrimary-dark">{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="pt-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 dark:bg-primary-900/20 rounded-full border border-primary-100 dark:border-primary-800">
                                    <span className="text-xs text-textSecondary-light dark:text-textSecondary-dark">{t('market.confidence')}:</span>
                                    <span className="text-xs font-bold text-primary-600 dark:text-primary-400">{analysis.confidence}</span>
                                </div>
                            </div>
                        </div>
                    )
                ) : (
                    <div className="h-full flex items-center justify-center text-textSecondary-light dark:text-textSecondary-dark text-sm italic">
                        {t('empty.waiting')}
                    </div>
                )}
            </div>
        </div>
    );
}
