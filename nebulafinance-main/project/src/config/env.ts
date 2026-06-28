// Validate environment variables on app startup
export const ENV = {
    API_BASE_URL: (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5005',
    MODE: (import.meta as any).env.MODE, // 'development' or 'production'
};

// Log configuration on startup (helpful for debugging)
console.log('[ENV] API Base URL:', ENV.API_BASE_URL);
console.log('[ENV] Mode:', ENV.MODE);

export default ENV;
