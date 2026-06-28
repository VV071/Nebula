import express, { Request, Response } from 'express';
import { stockHoldingsService } from '../services/market/stockHoldingsService';
import { stockDataService } from '../services/market/stockDataService';
import { newsService } from '../services/market/newsService';
import { comparisonService } from '../services/market/comparisonService';

const router = express.Router();

// Mock userId for now (should come from auth middleware)
const getUserId = () => 1;

router.get('/holdings', async (req: Request, res: Response) => {
    try {
        const holdings = await stockHoldingsService.getHoldings(getUserId());
        res.json(holdings);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/buy', async (req: Request, res: Response) => {
    try {
        const { symbol, companyName, quantity, price, bankAccountId } = req.body;
        const userId = getUserId();
        await stockHoldingsService.buyStock(userId, symbol, companyName, quantity, price, bankAccountId);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/sell', async (req: Request, res: Response) => {
    try {
        const { stockId, quantity, price, bankAccountId } = req.body;
        const userId = getUserId();
        await stockHoldingsService.sellStock(userId, stockId, quantity, price, bankAccountId);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/news', async (req: Request, res: Response) => {
    try {
        const news = await newsService.getMarketNews();
        res.json(news);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/search', async (req: Request, res: Response) => {
    try {
        const { q } = req.query;
        const results = await stockDataService.searchStocks(q as string);
        res.json(results);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Compare two stocks using the Python comparison engine
router.get('/compare', async (req: Request, res: Response) => {
    try {
        const { stock_a, stock_b } = req.query;
        if (!stock_a || !stock_b) {
            return res.status(400).json({ error: 'stock_a and stock_b query params are required' });
        }
        const result = await comparisonService.compare(stock_a as string, stock_b as string);
        res.json(result);
    } catch (error: any) {
        res.status(503).json({ error: error.message });
    }
});

// Get a single-stock scorecard from the Python comparison engine
router.get('/scorecard', async (req: Request, res: Response) => {
    try {
        const { ticker } = req.query;
        if (!ticker) {
            return res.status(400).json({ error: 'ticker query param is required' });
        }
        const result = await comparisonService.scorecard(ticker as string);
        res.json(result);
    } catch (error: any) {
        res.status(503).json({ error: error.message });
    }
});

// Check whether the Python engine is up
router.get('/engine-health', async (_req: Request, res: Response) => {
    const result = await comparisonService.engineHealth();
    res.json(result);
});

export default router;
