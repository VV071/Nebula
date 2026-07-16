import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes';
import accountRoutes from './routes/account.routes';
import transactionRoutes from './routes/transaction.routes';
import categoryRoutes from './routes/category.routes';
import insightRoutes from './routes/insight.routes';
import budgetRoutes from './routes/budget.routes';
import summaryRoutes from './routes/summary.routes';
import exportRoutes from './routes/export.routes';
import testRoutes from './routes/test.routes';
import marketRoutes from './routes/market.routes';
import bidsRoutes from './routes/bids.routes';
import smeRoutes from './routes/sme.routes';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request Logging
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Root Route
app.get('/', (req: express.Request, res: express.Response) => {
    res.json({
        name: 'Nebula Finance API',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/api/health',
            testDb: '/api/test/db',
            testTransactions: '/api/test/transactions',
            createTestTransaction: 'POST /api/test/transaction'
        }
    });
});

// Rate limiting
const isProduction = process.env.NODE_ENV === 'production';
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProduction ? 100 : 10000, // Limit each IP to 100 requests in prod, 10,000 in dev
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
});

// Apply limiter - in development we use a very high limit to avoid 429s during rapid testing
app.use(limiter);

// Routes
const apiPrefix = '/api';

app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/accounts`, accountRoutes);
app.use(`${apiPrefix}/transactions`, transactionRoutes);
app.use(`${apiPrefix}/categories`, categoryRoutes);
app.use(`${apiPrefix}/insights`, insightRoutes);
app.use(`${apiPrefix}/budgets`, budgetRoutes);
app.use(`${apiPrefix}/summary`, summaryRoutes);
app.use(`${apiPrefix}/export`, exportRoutes);
app.use(`${apiPrefix}/market`, marketRoutes);
app.use(`${apiPrefix}/bids`,   bidsRoutes);
app.use(`${apiPrefix}/sme`,    smeRoutes);

app.use(`/api`, testRoutes);

// 404 Handler for undefined routes
app.use((req: express.Request, res: express.Response) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.path,
        method: req.method
    });
});

// Health check
app.get('/health', (req: express.Request, res: express.Response) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

export default app;
