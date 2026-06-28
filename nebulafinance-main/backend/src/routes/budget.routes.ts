import { Router, Request, Response } from 'express';
import { BudgetController } from '../controllers/budgetController';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const budgetController = new BudgetController();

// All budget routes require authentication
router.use(authenticateToken);

// GET /api/budgets - Get all budgets with spending info
router.get('/', (req: Request, res: Response) => budgetController.getBudgets(req, res));

// GET /api/budgets/alerts - Get budget alerts
router.get('/alerts', (req: Request, res: Response) => budgetController.getBudgetAlerts(req, res));

// POST /api/budgets - Create or update a budget
router.post('/', (req: Request, res: Response) => budgetController.createOrUpdateBudget(req, res));

// DELETE /api/budgets/:categoryId - Delete a budget
router.delete('/:categoryId', (req: Request, res: Response) => budgetController.deleteBudget(req, res));

export default router;
