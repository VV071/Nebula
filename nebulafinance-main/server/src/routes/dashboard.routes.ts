import { Router } from 'express';

const router = Router();

// GET /api/dashboard/summary
router.get('/summary', (req: any, res: any) => {
    res.json({
        message: 'Dashboard summary endpoint',
        data: {
            totalBalance: 0,
            monthlyIncome: 0,
            monthlyExpenses: 0
        }
    });
});

export default router;
