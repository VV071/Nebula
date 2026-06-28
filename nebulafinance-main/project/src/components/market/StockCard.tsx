
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts';
import { MarketIndex } from '../../services/marketService';

interface StockCardProps {
    stock: MarketIndex;
    onClick: (stock: MarketIndex) => void;
}

export function StockCard({ stock, onClick }: StockCardProps) {
    const isBullish = stock.change >= 0;
    const color = isBullish ? '#10B981' : '#EF4444'; // green vs red
    const gradId = `gradient-${stock.symbol.replace(/\s+/g, '-')}`;

    // Transform history array for Recharts
    const chartData = stock.history.map((val, idx) => ({ i: idx, val }));

    return (
        <div
            onClick={() => onClick(stock)}
            className="group relative bg-surface-light dark:bg-surface-dark rounded-xl p-5 border border-light dark:border-dark hover:shadow-lg hover:border-primary-500/50 transition-all cursor-pointer overflow-hidden"
        >
            {/* Hover Glow Effect */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 pointer-events-none transition-opacity bg-gradient-to-br ${isBullish ? 'from-green-500 to-transparent' : 'from-red-500 to-transparent'}`} />

            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-textPrimary-light dark:text-textPrimary-dark text-lg">{stock.symbol}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl font-bold font-mono text-textPrimary-light dark:text-textPrimary-dark">
                            {stock.price.toLocaleString('en-IN')}
                        </span>
                        <div className={`flex items-center text-sm font-bold ${isBullish ? 'text-green-500' : 'text-red-500'}`}>
                            {stock.change > 0 ? '+' : ''}{stock.change}
                            <span className="ml-1 text-xs opacity-80">
                                ({stock.changePercent}%)
                            </span>
                        </div>
                    </div>
                </div>

                <div className={`p-2 rounded-lg ${isBullish ? 'bg-green-100 dark:bg-green-900/20 text-green-600' : 'bg-red-100 dark:bg-red-900/20 text-red-600'}`}>
                    {isBullish ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                </div>
            </div>

            {/* Mini Sparkline Chart */}
            <div className="h-16 w-full -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <YAxis domain={['auto', 'auto']} hide />
                        <defs>
                            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area
                            type="monotone"
                            dataKey="val"
                            stroke={color}
                            strokeWidth={2}
                            fill={`url(#${gradId})`}
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
