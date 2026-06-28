import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { NewsItem as NewsItemType, newsService } from '../../services/newsService';
import { NewsItem } from './NewsItem';


export function NewsFeed() {
    // const { t } = useTranslation(); 
    const [news, setNews] = useState<NewsItemType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadNews = async () => {
            setLoading(true);
            try {
                const data = await newsService.getMarketNews();
                setNews(data);
            } catch (err) {
                console.error("Failed to load news", err);
            } finally {
                setLoading(false);
            }
        };

        loadNews();

        // Subscribe to simulated live updates
        const unsubscribe = newsService.subscribeToNews((updatedNews) => {
            setNews(updatedNews);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="w-full bg-surface-light dark:bg-surface-dark rounded-xl border border-light dark:border-dark overflow-hidden flex flex-col h-[400px]">
            <div className="p-4 border-b border-light dark:border-dark flex items-center justify-between bg-surface-light dark:bg-surface-dark z-10">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <h3 className="font-bold text-textPrimary-light dark:text-textPrimary-dark">Live Market News</h3>
                </div>
                {loading && <RefreshCw className="w-4 h-4 animate-spin text-textSecondary-light dark:text-textSecondary-dark" />}
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
                {news.map((item) => (
                    <NewsItem key={item.id} item={item} />
                ))}
            </div>
        </div>
    );
}
