import express from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();
const authController = new AuthController();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authenticateToken, authController.logout);
router.get('/me', authenticateToken, authController.getCurrentUser);

export default router;
