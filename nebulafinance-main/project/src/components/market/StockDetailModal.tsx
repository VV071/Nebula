import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { MarketIndex, OHLCData, marketService } from '../../services/marketService';
import { CandleChart } from './CandleChart';
import { CouncilTabs } from './CouncilTabs';

interface StockDetailModalProps {
    stock: MarketIndex | null;
    onClose: () => void;
}

export function StockDetailModal({ stock, onClose }: StockDetailModalProps) {
    const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '6M' | '1Y'>('1D');
    const [chartData, setChartData] = useState<OHLCData[]>([]);
    const [loading, setLoading] = useState(false);

    // Reset timeframe when stock changes
    useEffect(() => {
        if (stock) {
            setTimeframe('1D');
        }
    }, [stock]);

    // Fetch chart data when stock or timeframe changes
    useEffect(() => {
        if (!stock) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await marketService.getStockHistory(stock.symbol, timeframe);
                setChartData(data);
            } catch (error) {
                console.error("Failed to load chart", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [stock, timeframe]);

    if (!stock) return null;

    const isBullish = stock.trend === 'bullish';
    const glowColor = isBullish ? 'shadow-[0_0_50px_-12px_rgba(34,197,94,0.3)]' : 'shadow-[0_0_50px_-12px_rgba(239,68,68,0.3)]';
    const borderColor = isBullish ? 'border-green-500/30' : 'border-red-500/30';

    return (
        <div className="fixed inset-0 z[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in z-[70]">
            <div
                className={`bg-surface-light dark:bg-surface-dark w-full max-w-5xl rounded-2xl ${glowColor} border ${borderColor} flex flex-col max-h-[90vh] overflow-hidden animate-scale-in`}
            >
                {/* Header */}
                <div className="p-6 border-b border-light dark:border-dark flex items-center justify-between bg-surface-light dark:bg-surface-dark z-10">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-bold text-textPrimary-light dark:text-textPrimary-dark">{stock.symbol}</h2>
                            <span className={`px-3 py-1 text-sm font-bold rounded-full ${isBullish ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                {isBullish ? 'BULLISH' : 'BEARISH'}
                            </span>
                        </div>
                        <p className="text-textSecondary-light dark:text-textSecondary-dark mt-1">{stock.name}</p>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-surfaceHover-light dark:hover:bg-surfaceHover-dark rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-textSecondary-light dark:text-textSecondary-dark" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="p-4 bg-surfaceHover-light dark:bg-surfaceHover-dark rounded-xl">
                            <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark mb-1">Current Price</p>
                            <p className="text-xl font-mono font-bold text-textPrimary-light dark:text-textPrimary-dark">
                                {stock.price.toLocaleString('en-IN')}
                            </p>
                        </div>
                        <div className="p-4 bg-surfaceHover-light dark:bg-surfaceHover-dark rounded-xl">
                            <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark mb-1">Day Change</p>
                            <p className={`text-xl font-mono font-bold ${isBullish ? 'text-green-500' : 'text-red-500'}`}>
                                {stock.change > 0 ? '+' : ''}{stock.change} ({stock.changePercent}%)
                            </p>
                        </div>
                        <div className="p-4 bg-surfaceHover-light dark:bg-surfaceHover-dark rounded-xl">
                            <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark mb-1">Open</p>
                            <p className="text-xl font-mono font-bold text-textPrimary-light dark:text-textPrimary-dark">
                                {(stock.price - stock.change).toLocaleString('en-IN')} {/* Approx */}
                            </p>
                        </div>
                        <div className="p-4 bg-surfaceHover-light dark:bg-surfaceHover-dark rounded-xl">
                            <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark mb-1">Volume</p>
                            <p className="text-xl font-mono font-bold text-textPrimary-light dark:text-textPrimary-dark">
                                {(Math.random() * 10000000).toFixed(0)} {/* Mock */}
                            </p>
                        </div>
                    </div>

                    {/* Chart Section */}
                    <div className="bg-surfaceHover-light dark:bg-surfaceHover-dark p-4 rounded-xl border border-light dark:border-dark mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-textPrimary-light dark:text-textPrimary-dark">Price Action</h3>
                            <div className="flex bg-surface-light dark:bg-surface-dark rounded-lg p-1 border border-light dark:border-dark">
                                {(['1D', '1W', '1M', '6M', '1Y'] as const).map((tf) => (
                                    <button
                                        key={tf}
                                        onClick={() => setTimeframe(tf)}
                                        className={`px-3 py-1 text-xs font-bold rounded transition-all ${timeframe === tf
                                            ? 'bg-primary-600 text-white shadow-sm'
                                            : 'text-textSecondary-light dark:text-textSecondary-dark hover:text-textPrimary-light dark:hover:text-textPrimary-dark'
                                            }`}
                                    >
                                        {tf}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-[400px] w-full">
                            {loading ? (
                                <div className="h-full w-full flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                                </div>
                            ) : (
                                <CandleChart data={chartData} height={400} />
                            )}
                        </div>
                    </div>

                    {/* AI Council */}
                    <CouncilTabs />

                </div>
            </div>
        </div>
    );
}
