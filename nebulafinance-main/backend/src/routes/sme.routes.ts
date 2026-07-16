/**
 * SME Growth & Advisory Agent — API routes.
 *   GET  /api/sme/status    -> Gemma wiring + demo-data info
 *   GET  /api/sme/data      -> the seed dataset (for charts / context)
 *   POST /api/sme/advise    -> { question, productId? } -> full advisory response
 */

import express, { Request, Response } from 'express';
import { runSmeAdvisor } from '../services/sme/smeAdvisor';
import { gemmaStatus } from '../services/gemma/gemmaClient';
import { SME_SEED_DATA } from '../services/sme/seedSmeData';
import { SME_TOOLS } from '../services/sme/agentTools';

const router = express.Router();

router.get('/status', (_req: Request, res: Response) => {
    res.json({
        gemma: gemmaStatus(),
        tools: Object.values(SME_TOOLS).map((t) => ({ name: t.name, description: t.description })),
        dataSource: 'seed-demo',
        business: SME_SEED_DATA.business,
    });
});

router.get('/data', (_req: Request, res: Response) => {
    res.json(SME_SEED_DATA);
});

router.post('/advise', async (req: Request, res: Response) => {
    try {
        const { question, productId } = req.body || {};
        if (!question || typeof question !== 'string' || !question.trim()) {
            return res.status(400).json({ error: 'A non-empty "question" string is required.' });
        }
        const result = await runSmeAdvisor(question.trim(), productId);
        res.json(result);
    } catch (error: any) {
        console.error('[SME] advise failed:', error);
        res.status(500).json({ error: error.message || 'SME advisory failed' });
    }
});

export default router;
