import express from 'express';
import { InsightController } from '../controllers/insightController';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();
const insightController = new InsightController();

router.use(authenticateToken);
router.get('/', insightController.getInsights);
router.post('/generate', insightController.generateInsights);
router.patch('/:id/dismiss', insightController.dismissInsight);

export default router;
