import { API_CONFIG } from '../config/apiConfig';

export interface StockData {
    symbol: string;
    companyName: string;
    price: number;
    change: number;
    changePercent: string;
    volume: number;
    marketCap: string;
    isManual?: boolean;
}

export const stockDataService = {
    async searchStock(symbol: string): Promise<StockData> {
        try {
            // 1. Try Alpha Vantage (Global Quote)
            const response = await fetch(
                `${API_CONFIG.STOCK_DATA.BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_CONFIG.STOCK_DATA.API_KEY}`
            );

            const data = await response.json();

            // Check for API limits or errors
            if (data['Note'] || data['Information'] || data['Error Message'] || !data['Global Quote']) {
                console.warn('[StockData] API limit/error, falling back to mock/manual', data);
                throw new Error('API Unavailable');
            }

            const quote = data['Global Quote'];
            if (!quote || Object.keys(quote).length === 0) {
                throw new Error('Stock not found');
            }

            return {
                symbol: quote['01. symbol'],
                companyName: symbol.toUpperCase(), // Alpha Vantage Quote doesn't return name, usually requires separate SEARCH endpoint
                price: parseFloat(quote['05. price']),
                change: parseFloat(quote['09. change']),
                changePercent: quote['10. change percent'],
                volume: parseInt(quote['06. volume']),
                marketCap: 'N/A', // Not in Global Quote, would need Overview endpoint
                isManual: false
            };

        } catch (error) {
            console.warn('[StockData] Fetch failed:', error);
            // Fallback: Return manual entry structure to trigger UI fallback or mock
            // Since the requirements say "Fallback: Allow manual input", 
            // we might just return a partial object or throw a specific error 
            // that the UI catches to show the Manual Input form.
            // For now, let's return a "not found" state unless it's a specific mock symbol.

            // Improved search: match by symbol OR company name
            const searchTerm = symbol.toUpperCase();

            // Check each mock stock
            for (const [, stock] of Object.entries(MOCK_STOCKS)) {
                if (stock.symbol.toUpperCase() === searchTerm ||
                    stock.companyName.toUpperCase().includes(searchTerm) ||
                    searchTerm.includes(stock.symbol.toUpperCase())) {
                    return stock;
                }
            }

            throw new Error('Stock data unavailable. Please enter details manually.');
        }
    },

    async getCompanyOverview(_symbol: string) {
        // Optional: Fetch fuller details like Name and Market Cap
        return {
            Description: 'Mock description for hackathon',
            Sector: 'Technology',
            Industry: 'Consumer Electronics'
        };
    }
};

const MOCK_STOCKS: Record<string, StockData> = {
    AAPL: { symbol: 'AAPL', companyName: 'Apple Inc.', price: 185.92, change: 1.25, changePercent: '0.68%', volume: 55000000, marketCap: '2.8T', isManual: true },
    GOOGL: { symbol: 'GOOGL', companyName: 'Alphabet Inc.', price: 142.38, change: -0.5, changePercent: '-0.35%', volume: 25000000, marketCap: '1.7T', isManual: true },
    TSLA: { symbol: 'TSLA', companyName: 'Tesla Inc.', price: 215.55, change: 5.10, changePercent: '2.42%', volume: 98000000, marketCap: '700B', isManual: true },
    TCS: { symbol: 'TCS', companyName: 'Tata Consultancy Services', price: 3850.50, change: 25.30, changePercent: '0.66%', volume: 2500000, marketCap: '14T INR', isManual: true },
};

