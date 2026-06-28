import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, CreateUserDTO } from '../models/User';
import db from '../config/database';

export class AuthService {
    async getUserById(userId: number): Promise<User> {
        const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (result.rowCount === 0) {
            throw new Error('User not found');
        }
        return result.rows[0];
    }

    async register(userData: CreateUserDTO): Promise<{ user: User; accessToken: string; refreshToken: string }> {
        // 1. Check if user exists
        const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [userData.email]);
        if (existingUser.rowCount > 0) {
            throw new Error('Email already exists');
        }

        // 2. Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        // 3. Create user
        const defaultPreferences = JSON.stringify({
            currency: 'INR',
            language: 'en',
            theme: 'dark',
            dateFormat: 'DD/MM/YYYY'
        });

        const result = await db.query(
            `INSERT INTO users (email, password_hash, name, preferences) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
            [userData.email, hashedPassword, userData.name, defaultPreferences]
        );

        let user: User;
        if (result.rows && result.rows.length > 0) {
            user = result.rows[0] as User;
        } else if (result.lastID) {
            // Fallback for SQLite
            user = await this.getUserById(result.lastID);
        } else {
            throw new Error('Failed to create user');
        }

        // 4. Create default categories for user (copying defaults)
        await db.query(`
      INSERT INTO categories (user_id, name, icon, color, type, is_default)
      SELECT $1, name, icon, color, type, 0
      FROM categories 
      WHERE is_default = 1 AND user_id IS NULL
    `, [user.id]);

        // 5. Generate tokens
        const accessToken = this.generateAccessToken(user.id, user.email);
        const refreshToken = this.generateRefreshToken(user.id);

        // 6. Store refresh token
        await this.storeRefreshToken(user.id, refreshToken);

        return { user, accessToken, refreshToken };
    }

    async login(email: string, password: string): Promise<{ user: User; accessToken: string; refreshToken: string }> {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rowCount === 0) {
            throw new Error('Invalid email or password');
        }

        const user = result.rows[0] as User;
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            throw new Error('Invalid email or password');
        }

        // Update last login
        await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

        const accessToken = this.generateAccessToken(user.id, user.email);
        const refreshToken = this.generateRefreshToken(user.id);

        await this.storeRefreshToken(user.id, refreshToken);

        return { user, accessToken, refreshToken };
    }

    async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
        try {
            const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as any;

            const tokenRecord = await db.query(
                'SELECT * FROM refresh_tokens WHERE token = $1 AND user_id = $2 AND is_revoked = 0',
                [token, decoded.userId]
            );

            if (tokenRecord.rowCount === 0) {
                throw new Error('Invalid refresh token');
            }

            // Rotation
            const newAccessToken = this.generateAccessToken(decoded.userId, 'user@example.com'); // We might need to fetch email
            const newRefreshToken = this.generateRefreshToken(decoded.userId);

            // Revoke old
            await db.query('UPDATE refresh_tokens SET is_revoked = 1 WHERE id = $1', [tokenRecord.rows[0].id]);

            // Store new
            await this.storeRefreshToken(decoded.userId, newRefreshToken);

            return { accessToken: newAccessToken, refreshToken: newRefreshToken };
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    }

    async logout(refreshToken: string): Promise<void> {
        await db.query('UPDATE refresh_tokens SET is_revoked = 1 WHERE token = $1', [refreshToken]);
    }

    private generateAccessToken(userId: number, email: string): string {
        return jwt.sign({ userId, email }, process.env.JWT_SECRET!, { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any });
    }

    private generateRefreshToken(userId: number): string {
        return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any });
    }

    private async storeRefreshToken(userId: number, token: string): Promise<void> {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // match JWT_REFRESH_EXPIRES_IN

        await db.query(
            'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
            [userId, token, expiresAt]
        );
    }
}
