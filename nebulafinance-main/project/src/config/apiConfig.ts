export const API_CONFIG = {
    ANTHROPIC: {
        API_URL: 'https://api.anthropic.com/v1/messages',
        // In a real app, this should be in .env. For hackathon, we might need a fallback or instructions.
        // We'll try to read from env, else warn.
        API_KEY: (import.meta as any).env.VITE_ANTHROPIC_API_KEY || '',
        MODEL: 'claude-3-sonnet-20240229', // Updated to a valid model name for general use
    },
    STOCK_DATA: {
        // using Alpha Vantage as primary example
        BASE_URL: 'https://www.alphavantage.co/query',
        API_KEY: (import.meta as any).env.VITE_STOCK_API_KEY || 'demo', // 'demo' works for specific symbols like IBM on AlphaVantage
    },
    TIMEOUTS: {
        ANALYST: 30000, // 30s
        CHAIRMAN: 45000, // 45s
    }
};

export const hasValidKeys = () => {
    return !!API_CONFIG.ANTHROPIC.API_KEY;
};
