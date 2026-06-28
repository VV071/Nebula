export interface NewsItem {
    id: string;
    title: string;
    summary: string;
    source: string;
    url: string;
    imageUrl?: string;
    publishedAt: string;
    sentiment?: 'Positive' | 'Negative' | 'Neutral';
}

class NewsService {
    private useMock: boolean = true;

    constructor() {
        if (process.env.NEWS_API_KEY) {
            this.useMock = false;
        }
    }

    async getMarketNews(limit: number = 10): Promise<NewsItem[]> {
        return this.generateMockNews(limit);
    }

    private generateMockNews(limit: number): NewsItem[] {
        const sources = ['MoneyControl', 'Economic Times', 'CNBC TV18', 'Mint', 'Bloomberg'];
        const topics = [
            { t: 'Sensex hits all-time high led by banking stocks', s: 'Positive' },
            { t: 'RBI keeps repo rate unchanged at 6.5%', s: 'Neutral' },
            { t: 'Tech stocks slide amid global recession fears', s: 'Negative' },
            { t: 'Reliance Industries announces bonus share issue', s: 'Positive' },
            { t: 'Inflation data comes higher than expected', s: 'Negative' },
            { t: 'Adani Group plans new green energy investment', s: 'Positive' },
            { t: 'Gold prices surge to record highs', s: 'Neutral' },
            { t: 'Automobile sales drop in March', s: 'Negative' }
        ];

        return Array.from({ length: limit }).map((_, i) => {
            const topic = topics[i % topics.length];
            return {
                id: `news-${Date.now()}-${i}`,
                title: topic.t,
                summary: `${topic.t}. The market reacted strongly to this development as key indices showed significant movement during the trading session. Analysts suggest watching this sector closely over the coming week.`,
                source: sources[i % sources.length],
                url: '#',
                publishedAt: new Date(Date.now() - i * 3600000).toISOString(),
                sentiment: topic.s as any
            };
        });
    }
}

export const newsService = new NewsService();
