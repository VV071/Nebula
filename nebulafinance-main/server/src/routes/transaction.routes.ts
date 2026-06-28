import { Router } from 'express';

const router = Router();

// GET /api/transactions
router.get('/', (req: any, res: any) => {
    res.json({ transactions: [] });
});

export default router;
