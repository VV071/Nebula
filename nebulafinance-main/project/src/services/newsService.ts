export interface NewsItem {
    id: string;
    headline: string;
    source: string;
    timestamp: string; // ISO string or relative time
    sentiment: 'bullish' | 'bearish' | 'neutral';
    url?: string;
}

const MOCK_NEWS: NewsItem[] = [
    {
        id: '1',
        headline: 'RBI Monetary Policy: Repo Rate remains unchanged at 6.5%, focus on inflation control.',
        source: 'Financial Express',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
        sentiment: 'neutral'
    },
    {
        id: '2',
        headline: 'HDFC Bank Q4 Results: Net profit jumps 2% YoY, beats street estimates.',
        source: 'Moneycontrol',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
        sentiment: 'bullish'
    },
    {
        id: '3',
        headline: 'IT Sector under pressure as global headwinds persist; Infosys and TCS slide.',
        source: 'LiveMint',
        timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 hours ago
        sentiment: 'bearish'
    },
    {
        id: '4',
        headline: 'Sensex hits fresh all-time high, Nifty crosses 22,500 mark led by auto stocks.',
        source: 'Economic Times',
        timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(), // 5 hours ago
        sentiment: 'bullish'
    },
    {
        id: '5',
        headline: 'Rupee falls 12 paise against US Dollar amid rising crude oil prices.',
        source: 'Business Standard',
        timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(), // 6 hours ago
        sentiment: 'bearish'
    }
];

export const newsService = {
    getMarketNews: async (): Promise<NewsItem[]> => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_NEWS;
    },

    // Simulate live updates for later use
    subscribeToNews: (callback: (news: NewsItem[]) => void) => {
        const interval = setInterval(() => {
            // Randomly rotate news to simulate "live" feed
            const first = MOCK_NEWS.shift();
            if (first) {
                first.timestamp = new Date().toISOString();
                MOCK_NEWS.push(first);
                callback([...MOCK_NEWS]);
            }
        }, 15000); // Update every 15 seconds

        return () => clearInterval(interval);
    }
};
