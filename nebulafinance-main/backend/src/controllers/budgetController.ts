import { Request, Response } from 'express';
import { BudgetService } from '../services/budgetService';

const budgetService = new BudgetService();

export class BudgetController {
    /**
     * GET /api/budgets
     * Get all budgets with current spending
     */
    async getBudgets(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const budgets = await budgetService.getBudgets(userId);
            res.json({ budgets });
        } catch (error: any) {
            console.error('Error fetching budgets:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * POST /api/budgets
     * Create or update a budget
     */
    async createOrUpdateBudget(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { category_id, limit_amount, period } = req.body;

            if (!category_id || !limit_amount) {
                return res.status(400).json({ error: 'category_id and limit_amount are required' });
            }

            const budget = await budgetService.createBudget(userId, {
                category_id,
                limit_amount,
                period
            });

            res.json({ budget });
        } catch (error: any) {
            console.error('Error creating/updating budget:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * DELETE /api/budgets/:categoryId
     * Delete a budget
     */
    async deleteBudget(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const categoryId = parseInt(req.params.categoryId);

            if (isNaN(categoryId)) {
                return res.status(400).json({ error: 'Invalid category ID' });
            }

            await budgetService.deleteBudget(userId, categoryId);
            res.json({ success: true });
        } catch (error: any) {
            console.error('Error deleting budget:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * GET /api/budgets/alerts
     * Get budget alerts (budgets >= 75% used)
     */
    async getBudgetAlerts(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const alerts = await budgetService.getBudgetAlerts(userId);
            res.json({ alerts });
        } catch (error: any) {
            console.error('Error fetching budget alerts:', error);
            res.status(500).json({ error: error.message });
        }
    }
}
