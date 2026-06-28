import { useEffect, useState } from 'react';
import { marketService, MarketIndex } from '../../services/marketService';
import { StockCard } from './StockCard';
import { StockDetailModal } from './StockDetailModal';


export function MarketOverview() {
    const [indices, setIndices] = useState<MarketIndex[]>([]);
    const [selectedStock, setSelectedStock] = useState<MarketIndex | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadIndices = async () => {
            try {
                const data = await marketService.getIndicesOverview();
                setIndices(data);
            } catch (err) {
                console.error("Failed to load indices", err);
            } finally {
                setLoading(false);
            }
        };
        loadIndices();
    }, []);

    return (
        <div className="animate-fade-in mb-12">
            <h2 className="text-xl font-bold text-textPrimary-light dark:text-textPrimary-dark mb-6">Market Overview</h2>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {loading ? (
                    <>
                        <div className="h-48 rounded-xl bg-surface-light dark:bg-surface-dark animate-pulse"></div>
                        <div className="h-48 rounded-xl bg-surface-light dark:bg-surface-dark animate-pulse"></div>
                    </>
                ) : (
                    indices.map((index) => (
                        <StockCard
                            key={index.symbol}
                            stock={index}
                            onClick={(stock) => setSelectedStock(stock)}
                        />
                    ))
                )}
            </div>

            {/* News Feed Section */}
            <div>
                {/* News Feed is technically requested at the bottom, but the container can hold it. 
                 Wait, the requirement says "Always-visible Indian Market Overview". 
                 And "Live stock-market-related news feed (India) Inside the free bottom space".
                 So I will actually export NewsFeed separately and let the page decide layout, OR 
                 I can include it here if this component represents the "Overview Panel".
                 
                 Let's stick to the structure:
                 MarketOverview component = The top section with Index Cards.
                 NewsFeed component = The bottom section.
                 
                 However, to keep things clean, I will NOT include NewsFeed here. 
                 I will keep MarketOverview focused on the Cards/Modal.
                 Wait, the prompt asked for "Market Overview Panel... Create a top 'Market Overview' section".
                 So I will keep this strictly for the Cards.
                 
                 BUT, I need to make sure the users request is met.
                 "MarketOverview visible on page load" 
                 "News feed scrolls & updates"
                 
                 I'll remove NewsFeed from this component and place it in the Page for better layout control 
                 as per the prompt's structural hint "Integrate MarketOverview at the top... Integrate NewsFeed at the bottom".
                 */}
            </div>

            {/* Modal */}
            <StockDetailModal
                stock={selectedStock}
                onClose={() => setSelectedStock(null)}
            />
        </div>
    );
}
