import { useState } from 'react';
import { Search, Info, TrendingUp, TrendingDown, BarChart2, ArrowRight } from 'lucide-react';
import { DisclaimerModal } from '../components/market/DisclaimerModal';
import { EmptyState } from '../components/market/EmptyState';
import { stockDataService, StockData } from '../services/stockDataService';
import { CouncilAnalysis } from '../components/CouncilAnalysis';
import { useTranslation } from 'react-i18next';
import { MarketOverview } from '../components/market/MarketOverview';
import { NewsFeed } from '../components/market/NewsFeed';
import { StockCompare } from '../components/market/StockCompare';
import type { Page } from '../App';
import '../styles/market-insights.css';

interface MarketInsightsProps {
    onNavigate?: (page: Page) => void;
}

export default function MarketInsights({ onNavigate }: MarketInsightsProps) {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [stockData, setStockData] = useState<StockData | null>(null);

    const [loadingStock, setLoadingStock] = useState(false);
    const [error, setError] = useState<string | null>(null);



    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setLoadingStock(true);
        setError(null);
        setStockData(null);

        try {
            const data = await stockDataService.searchStock(searchQuery);
            setStockData(data);
        } catch (err: any) {
            setError(err.message || 'Failed to find stock');
        } finally {
            setLoadingStock(false);
        }
    };



    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
    };

    return (
        <div className="page-wrapper market-insights-page">
            <DisclaimerModal onAcknowledge={() => { }} />

            {/* Header */}
            <div className="max-w-[1400px] mx-auto mb-8">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                        <h1 className="text-display font-extrabold text-textPrimary-light dark:text-textPrimary-dark mb-2">
                            {t('market.title')} <span className="text-primary-500 text-lg align-top bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-md mx-2">{t('market.beta')}</span>
                        </h1>
                        <p className="text-textSecondary-light dark:text-textSecondary-dark flex items-center gap-2">
                            <Info className="w-4 h-4" />
                            {t('market.disclaimerShort')}
                        </p>
                    </div>
                    {/* Stock Prediction — separate entry point */}
                    <button
                        onClick={() => onNavigate?.('stock-prediction')}
                        className="flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white transition-all hover:scale-105 active:scale-95"
                        style={{
                            background: 'linear-gradient(135deg, #6366F1 0%, #7C3AED 100%)',
                            boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
                        }}
                    >
                        <BarChart2 className="w-4 h-4" />
                        Stock Prediction
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Always Visible Market Overview */}
            <div className="max-w-[1400px] mx-auto mb-8">
                <MarketOverview />
            </div>

            {/* Search & Data Section */}
            <div className="max-w-[1400px] mx-auto space-y-8">

                {/* Search Bar */}
                <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-light dark:border-dark">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-textSecondary-light dark:text-textSecondary-dark" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('market.searchPlaceholder')}
                                className="w-full pl-12 pr-4 py-4 rounded-xl bg-surfaceHover-light dark:bg-surfaceHover-dark border-none focus:ring-2 focus:ring-primary-500 text-lg"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loadingStock}
                            className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                        >
                            {loadingStock ? t('market.searching') : t('market.analyze')}
                        </button>
                    </form>

                    {/* Market Data Card */}
                    {stockData && (
                        <div className="mt-6 flex flex-wrap items-center justify-between gap-6 p-6 bg-surfaceHover-light dark:bg-surfaceHover-dark rounded-xl animate-scale-in border border-light dark:border-dark">
                            <div>
                                <h2 className="text-2xl font-bold text-textPrimary-light dark:text-textPrimary-dark">{stockData.symbol}</h2>
                                <p className="text-textSecondary-light dark:text-textSecondary-dark">{stockData.companyName}</p>
                            </div>

                            <div className="flex items-center gap-8">
                                <div>
                                    <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark mb-1">{t('market.price')}</p>
                                    <p className="text-2xl font-mono font-bold text-textPrimary-light dark:text-textPrimary-dark">
                                        {formatCurrency(stockData.price)}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark mb-1">{t('market.change')}</p>
                                    <div className={`flex items-center gap-1 font-bold ${stockData.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {stockData.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                        {stockData.change > 0 ? '+' : ''}{stockData.change} ({stockData.changePercent})
                                    </div>
                                </div>

                                <div className="hidden md:block">
                                    <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark mb-1">{t('market.volume')}</p>
                                    <p className="font-mono text-textPrimary-light dark:text-textPrimary-dark">
                                        {new Intl.NumberFormat('en-IN', { notation: 'compact' }).format(stockData.volume)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                {error ? (
                    <EmptyState type="not-found" />
                ) : !stockData ? (
                    <EmptyState type="initial" />
                ) : (
                    <div className="space-y-8 animate-slide-up">

                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-textPrimary-light dark:text-textPrimary-dark">{t('market.councilTitle')}</h2>
                            <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-bold rounded-full uppercase tracking-wider">
                                {t('market.researchOnly')}
                            </span>
                        </div>

                        {/* LLM Council - Tabbed Interface */}
                        {stockData.symbol && stockData.companyName && (
                            <div className="animate-slide-up">
                                <CouncilAnalysis symbol={stockData.symbol} companyName={stockData.companyName} />
                            </div>
                        )}
                    </div>
                )}

                {/* Comparison Engine */}
                <StockCompare />

                {/* Live News Feed */}
                <div className="pt-8 border-t border-light dark:border-dark">
                    <NewsFeed />
                </div>
            </div>
        </div>
    );
}
