import { Shield, Loader2, AlertTriangle, Lightbulb, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ChairmanReportProps {
    report: {
        summary: string;
        consensus: string;
        riskFactors: string[];
        opportunities: string[];
        error?: boolean;
    } | null;
    loading: boolean;
}

export function ChairmanReport({ report, loading }: ChairmanReportProps) {
    const { t } = useTranslation();

    if (loading) {
        return (
            <div className="mt-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-white text-center flex flex-col items-center justify-center min-h-[300px]">
                <Loader2 className="w-12 h-12 text-primary-400 animate-spin mb-4" />
                <h3 className="text-xl font-bold mb-2">{t('market.chairman.loadingHeading')}</h3>
                <p className="text-gray-400 max-w-md">{t('market.chairman.loadingBody')}</p>
            </div>
        );
    }

    if (!report) return null;

    if (report.error) {
        return (
            <div className="mt-8 bg-red-900/10 border border-red-900/20 rounded-2xl p-8 text-center">
                <h3 className="text-red-500 font-bold mb-2">{t('market.chairman.failed')}</h3>
                <p className="text-gray-400">{report.summary}</p>
            </div>
        );
    }

    return (
        <div className="mt-8 bg-gradient-to-br from-primary-900 via-gray-900 to-gray-900 rounded-2xl p-1 shadow-2xl relative overflow-hidden animate-slide-up">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 blur-[100px] rounded-full pointr-events-none"></div>

            <div className="bg-gray-900/90 backdrop-blur-xl rounded-xl p-8 relative z-10">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/10">
                    <div className="p-3 bg-primary-500/20 rounded-xl">
                        <Shield className="w-8 h-8 text-primary-400" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-1">{t('market.chairman.title')}</h3>
                        <p className="text-gray-400 text-sm">{t('market.chairman.subtitle')}</p>
                    </div>
                </div>

                <div className="space-y-8">
                    <section>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-primary-400 mb-3">{t('market.chairman.execSummary')}</h4>
                        <p className="text-lg text-gray-200 leading-relaxed font-medium">
                            {report.summary}
                        </p>
                    </section>

                    <section className="bg-white/5 rounded-xl p-6 border border-white/5">
                        <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                            <Target className="w-4 h-4 text-emerald-400" />
                            {t('market.chairman.consensus')}
                        </h4>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            {report.consensus}
                        </p>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-red-500/5 rounded-xl p-6 border border-red-500/10">
                            <h4 className="text-sm font-bold text-red-400 mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                {t('market.chairman.risks')}
                            </h4>
                            <ul className="space-y-3">
                                {report.riskFactors.map((risk, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-300">
                                        <span className="text-red-500/50 mt-1">•</span>
                                        {risk}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-emerald-500/5 rounded-xl p-6 border border-emerald-500/10">
                            <h4 className="text-sm font-bold text-emerald-400 mb-4 flex items-center gap-2">
                                <Lightbulb className="w-4 h-4" />
                                {t('market.chairman.opportunities')}
                            </h4>
                            <ul className="space-y-3">
                                {report.opportunities.map((opp, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-sm text-gray-300">
                                        <span className="text-emerald-500/50 mt-1">•</span>
                                        {opp}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-gray-500">
                    <p>{t('market.chairman.footer')}</p>
                    <Shield className="w-4 h-4 opacity-50" />
                </div>
            </div>
        </div>
    );
}
