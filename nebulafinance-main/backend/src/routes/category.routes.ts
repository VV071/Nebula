import express from 'express';
import { CategoryController } from '../controllers/categoryController';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();
const categoryController = new CategoryController();

router.use(authenticateToken);
router.get('/', categoryController.getAllCategories);

export default router;
