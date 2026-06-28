import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: number;
                email: string;
            };
        }
    }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // PERMISSIVE AUTH FOR HACKATHON/DEVELOPMENT
    // Allows requests without tokens to use a default demo user
    if (!token) {
        console.log('[Auth Middleware] No token provided, using default demo user (ID: 1)');
        req.user = { userId: 1, email: 'demo@nebulafinance.com' };
        return next();
    }

    jwt.verify(token, process.env.JWT_SECRET!, (err: any, user: any) => {
        if (err) {
            console.log('[Auth Middleware] Invalid token, falling back to default demo user (ID: 1)');
            req.user = { userId: 1, email: 'demo@nebulafinance.com' };
            return next();
        }
        req.user = user;
        next();
    });
};
