import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters').max(255)
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string()
});

export const createAccountSchema = z.object({
    name: z.string().min(1).max(255),
    type: z.enum(['bank', 'cash', 'credit_card', 'savings', 'investment']),
    balance: z.number().default(0),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6366F1')
});

export const updateAccountSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    type: z.enum(['bank', 'cash', 'credit_card', 'savings', 'investment']).optional(),
    balance: z.number().optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    is_active: z.boolean().optional()
});

export const createTransactionSchema = z.object({
    account_id: z.number().int().positive(),
    category_id: z.number().int().positive(),
    amount: z.number().positive(),
    type: z.enum(['income', 'expense']),
    description: z.string().optional(),
    date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).or(z.date()) // Accept ISO string, YYYY-MM-DD, or Date object
});
