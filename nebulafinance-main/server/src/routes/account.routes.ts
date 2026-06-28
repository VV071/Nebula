import { Router } from 'express';

const router = Router();

// GET /api/accounts
router.get('/', (req: any, res: any) => {
    res.json({ accounts: [] });
});

export default router;
