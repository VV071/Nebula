import express from 'express';
import { TransactionController } from '../controllers/transactionController';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();
const transactionController = new TransactionController();

router.use(authenticateToken);

router.get('/', transactionController.getTransactions);
router.post('/', transactionController.createTransaction);
router.delete('/:id', transactionController.deleteTransaction);

export default router;
