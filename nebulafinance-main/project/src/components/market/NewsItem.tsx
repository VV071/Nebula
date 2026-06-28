import { Newspaper } from 'lucide-react';
import { NewsItem as NewsItemType } from '../../services/newsService';

interface NewsItemProps {
    item: NewsItemType;
}

export function NewsItem({ item }: NewsItemProps) {


    const getSentimentBadge = () => {
        switch (item.sentiment) {
            case 'bullish':
                return <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-100 dark:bg-green-900/20 px-2 py-0.5 rounded">Bullish</span>;
            case 'bearish':
                return <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-100 dark:bg-red-900/20 px-2 py-0.5 rounded">Bearish</span>;
            default:
                return <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">Neutral</span>;
        }
    }

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 24 * 60) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="flex gap-4 p-4 border-b border-light dark:border-dark last:border-0 hover:bg-surfaceHover-light dark:hover:bg-surfaceHover-dark transition-colors">
            <div className="flex-shrink-0 mt-1">
                <div className="w-10 h-10 rounded-full bg-surface-light dark:bg-surface-dark flex items-center justify-center border border-light dark:border-dark">
                    <Newspaper className="w-5 h-5 text-primary-500" />
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-textSecondary-light dark:text-textSecondary-dark">{item.source}</span>
                    <span className="text-xs text-textSecondary-light dark:text-textSecondary-dark">•</span>
                    <span className="text-xs text-textSecondary-light dark:text-textSecondary-dark">{formatTime(item.timestamp)}</span>
                    <span className="ml-auto">{getSentimentBadge()}</span>
                </div>
                <h4 className="text-sm font-semibold text-textPrimary-light dark:text-textPrimary-dark leading-snug hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer transition-colors">
                    {item.headline}
                </h4>
            </div>
        </div>
    );
}
