import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { z } from 'zod';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2)
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string()
});

export class AuthController {
    private authService = new AuthService();

    register = async (req: Request, res: Response) => {
        try {
            const validation = registerSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({ error: validation.error });
            }

            const result = await this.authService.register(req.body);
            res.status(201).json({ success: true, data: result });
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    };

    login = async (req: Request, res: Response) => {
        try {
            const validation = loginSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({ error: validation.error });
            }

            const result = await this.authService.login(req.body.email, req.body.password);
            res.json({ success: true, data: result });
        } catch (error: any) {
            res.status(401).json({ error: error.message });
        }
    };

    refreshToken = async (req: Request, res: Response) => {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

            const result = await this.authService.refreshToken(refreshToken);
            res.json({ success: true, data: result });
        } catch (error: any) {
            res.status(403).json({ error: error.message });
        }
    };

    logout = async (req: Request, res: Response) => {
        try {
            const { refreshToken } = req.body;
            if (refreshToken) {
                await this.authService.logout(refreshToken);
            }
            res.json({ success: true, message: 'Logged out successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Logout failed' });
        }
    };

    getCurrentUser = async (req: Request, res: Response) => {
        // Since middleware attaches user info
        res.json({ success: true, data: req.user });
    }
}
