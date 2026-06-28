import axios from 'axios';

export interface StockData {
    symbol: string;
    companyName: string;
    price: number;
    change: number;
    changePercent: number;
    currency: string;
    exchange: string;
    marketCap?: number;
    volume?: number;
    high?: number;
    low?: number;
    open?: number;
    prevClose?: number;
}

export interface OHLCData {
    date: string; // ISO date string
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface MarketIndex {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    history: number[]; // Sparkline data (last 20 points)
}

class StockDataService {
    private useMock: boolean = true; // Default to mock until APIs provided

    constructor() {
        // user can enable real APIs via env vars later
        if (process.env.STOCK_API_KEY) {
            this.useMock = false;
        }
    }

    // Get Nifty 50 and Sensex Data
    async getIndices(): Promise<{ nifty50: MarketIndex; sensex: MarketIndex }> {
        if (!this.useMock) {
            try {
                // Alpha Vantage doesn't have direct indices easily accessible on free tier
                return this.generateMockIndices();
            } catch (e) {
                console.error('Failed to fetch indices, using mock', e);
            }
        }
        return this.generateMockIndices();
    }

    // Search for stocks
    async searchStocks(query: string): Promise<StockData[]> {
        if (!query) return [];

        if (!this.useMock) {
            try {
                const response = await axios.get(`https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${query}&apikey=${process.env.STOCK_API_KEY}`);
                if (response.data.bestMatches) {
                    return response.data.bestMatches.map((m: any) => ({
                        symbol: m['1. symbol'],
                        companyName: m['2. name'],
                        price: 0, // Search endpoint doesn't return price
                        change: 0,
                        changePercent: 0,
                        currency: m['8. currency'],
                        exchange: m['4. region']
                    }));
                }
            } catch (e) {
                console.error('Stock search failed, falling back to mock');
            }
        }

        // Fallback to mock
        return this.mockStockSearch(query);
    }

    // Get specific stock details
    async getStockDetails(symbol: string): Promise<StockData | null> {
        if (!this.useMock) {
            try {
                const response = await axios.get(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.STOCK_API_KEY}`);
                const quote = response.data['Global Quote'];

                if (quote && quote['01. symbol']) {
                    return {
                        symbol: quote['01. symbol'],
                        companyName: quote['01. symbol'], // Quote doesn't give name
                        price: parseFloat(quote['05. price']),
                        change: parseFloat(quote['09. change']),
                        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
                        currency: 'USD', // Default
                        exchange: 'Unknown',
                        volume: parseInt(quote['06. volume']),
                        high: parseFloat(quote['03. high']),
                        low: parseFloat(quote['04. low']),
                        open: parseFloat(quote['02. open']),
                        prevClose: parseFloat(quote['08. previous close'])
                    };
                }
            } catch (e) {
                console.error(`Failed to fetch details for ${symbol}, using mock`);
            }
        }
        return this.mockStockDetails(symbol);
    }

    // Get Historical Data
    async getHistoricalData(symbol: string, timeframe: '1D' | '7D' | '30D' | '12M'): Promise<OHLCData[]> {
        if (this.useMock) {
            return this.generateMockHistory(symbol, timeframe);
        }
        return [];
    }

    // --- MOCK GENERATORS ---

    private generateMockIndices() {
        const nPrice = 22450 + (Math.random() * 200 - 100);
        const nChange = Math.random() * 150 * (Math.random() > 0.4 ? 1 : -1);
        const sPrice = 73800 + (Math.random() * 400 - 200);
        const sChange = Math.random() * 300 * (Math.random() > 0.4 ? 1 : -1);

        return {
            nifty50: {
                symbol: 'NIFTY 50',
                name: 'Nifty 50',
                price: parseFloat(nPrice.toFixed(2)),
                change: parseFloat(nChange.toFixed(2)),
                changePercent: parseFloat(((nChange / nPrice) * 100).toFixed(2)),
                history: this.generateSparkline(nPrice)
            },
            sensex: {
                symbol: 'SENSEX',
                name: 'BSE Sensex',
                price: parseFloat(sPrice.toFixed(2)),
                change: parseFloat(sChange.toFixed(2)),
                changePercent: parseFloat(((sChange / sPrice) * 100).toFixed(2)),
                history: this.generateSparkline(sPrice)
            }
        };
    }

    private generateSparkline(basePrice: number): number[] {
        let current = basePrice;
        const history: number[] = [];
        for (let i = 0; i < 20; i++) {
            current = current + (Math.random() * (basePrice * 0.005) - (basePrice * 0.0025));
            history.push(parseFloat(current.toFixed(2)));
        }
        return history;
    }

    private mockStockSearch(query: string): StockData[] {
        const q = query.toLowerCase();
        const db = [
            { s: 'RELIANCE', n: 'Reliance Industries', p: 2980 },
            { s: 'TCS', n: 'Tata Consultancy Services', p: 4100 },
            { s: 'HDFCBANK', n: 'HDFC Bank', p: 1450 },
            { s: 'INFY', n: 'Infosys', p: 1600 },
            { s: 'ICICIBANK', n: 'ICICI Bank', p: 1080 },
            { s: 'SBIN', n: 'State Bank of India', p: 760 },
            { s: 'BHARTIARTL', n: 'Bharti Airtel', p: 1200 },
            { s: 'ITC', n: 'ITC Limited', p: 430 },
            { s: 'LTIM', n: 'LTIMindtree', p: 5200 },
            { s: 'TATAMOTORS', n: 'Tata Motors', p: 980 }
        ];

        return db
            .filter(i => i.s.toLowerCase().includes(q) || i.n.toLowerCase().includes(q))
            .map(i => ({
                symbol: i.s,
                companyName: i.n,
                price: i.p,
                change: 10,
                changePercent: 0.5,
                currency: 'INR',
                exchange: 'NSE'
            }));
    }

    private mockStockDetails(symbol: string): StockData {
        const seed = symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const basePrice = seed * 5;

        return {
            symbol: symbol.toUpperCase(),
            companyName: `${symbol.toUpperCase()} Ltd`,
            price: basePrice,
            change: basePrice * 0.015,
            changePercent: 1.5,
            currency: 'INR',
            exchange: 'NSE',
            volume: 1500000,
            marketCap: 500000000000,
            high: basePrice * 1.02,
            low: basePrice * 0.98,
            open: basePrice * 0.99,
            prevClose: basePrice * 0.985
        };
    }

    private generateMockHistory(symbol: string, timeframe: '1D' | '7D' | '30D' | '12M'): OHLCData[] {
        const count = timeframe === '1D' ? 24 : timeframe === '7D' ? 7 : timeframe === '30D' ? 30 : 50;
        const seed = symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        let currentPrice = seed * 5;

        const data: OHLCData[] = [];
        const now = new Date();

        for (let i = count; i >= 0; i--) {
            const date = new Date(now);
            if (timeframe === '1D') date.setHours(date.getHours() - i);
            else date.setDate(date.getDate() - i);

            const volatility = currentPrice * 0.02;
            const open = currentPrice;
            const close = currentPrice + (Math.random() - 0.5) * volatility;
            const high = Math.max(open, close) + Math.random() * (volatility * 0.5);
            const low = Math.min(open, close) - Math.random() * (volatility * 0.5);

            data.push({
                date: date.toISOString(),
                open,
                high,
                low,
                close,
                volume: Math.floor(Math.random() * 100000 + 5000)
            });
            currentPrice = close;
        }
        return data;
    }
}

export const stockDataService = new StockDataService();
