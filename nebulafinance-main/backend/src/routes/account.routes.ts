import express from 'express';
import { AccountController } from '../controllers/accountController';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();
const accountController = new AccountController();

router.use(authenticateToken);

router.get('/', accountController.getAllAccounts);
router.get('/:id', accountController.getAccount);
router.post('/', accountController.createAccount);
router.put('/:id', accountController.updateAccount);
router.delete('/:id', accountController.deleteAccount);

export default router;
