import { Router, Request, Response } from 'express';
import { SummaryController } from '../controllers/summaryController';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const summaryController = new SummaryController();

// All summary routes require authentication
router.use(authenticateToken);

// GET /api/summary/current - Get current month summary
router.get('/current', (req: Request, res: Response) => summaryController.getCurrentMonthlySummary(req, res));

// GET /api/summary/:year/:month - Get summary for specific month
router.get('/:year/:month', (req: Request, res: Response) => summaryController.getMonthlySummary(req, res));

export default router;
