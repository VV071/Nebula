import { Router } from 'express';
import { ExportController } from '../controllers/exportController';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const exportController = new ExportController();

// GET /api/export
router.get('/', authenticateToken, exportController.exportData);

export default router;
