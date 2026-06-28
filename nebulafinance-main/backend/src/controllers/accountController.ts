import { Request, Response } from 'express';
import { AccountService } from '../services/accountService';
import { createAccountSchema, updateAccountSchema } from '../utils/validator';

export class AccountController {
    private accountService = new AccountService();

    getAllAccounts = async (req: Request, res: Response) => {
        try {
            const userId = req.user!.userId;
            const accounts = await this.accountService.getUserAccounts(userId);
            res.json({ success: true, data: accounts });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch accounts' });
        }
    };

    getAccount = async (req: Request, res: Response) => {
        try {
            const userId = req.user!.userId;
            const accountId = parseInt(req.params.id);
            const account = await this.accountService.getAccountById(userId, accountId);
            res.json({ success: true, data: account });
        } catch (error: any) {
            if (error.message === 'Account not found') {
                return res.status(404).json({ error: 'Account not found' });
            }
            res.status(500).json({ error: 'Failed to fetch account' });
        }
    };

    createAccount = async (req: Request, res: Response) => {
        try {
            const userId = req.user!.userId;
            const validation = createAccountSchema.safeParse(req.body);

            if (!validation.success) {
                return res.status(400).json({ error: validation.error });
            }

            const account = await this.accountService.createAccount(userId, req.body);
            res.status(201).json({ success: true, account });
        } catch (error: any) {
            console.error('[AccountController] Error creating account:', error);
            res.status(500).json({ error: error.message || 'Failed to create account' });
        }
    };

    updateAccount = async (req: Request, res: Response) => {
        try {
            const userId = req.user!.userId;
            const accountId = parseInt(req.params.id);
            const validation = updateAccountSchema.safeParse(req.body);

            if (!validation.success) {
                return res.status(400).json({ error: validation.error });
            }

            const account = await this.accountService.updateAccount(userId, accountId, req.body);
            res.json({ success: true, data: account, message: 'Account updated successfully' });
        } catch (error: any) {
            if (error.message === 'Account not found') {
                return res.status(404).json({ error: 'Account not found' });
            }
            res.status(500).json({ error: 'Failed to update account' });
        }
    };

    deleteAccount = async (req: Request, res: Response) => {
        try {
            const userId = req.user!.userId;
            const accountId = parseInt(req.params.id);
            await this.accountService.deleteAccount(userId, accountId);
            res.json({ success: true, message: 'Account deleted successfully' });
        } catch (error: any) {
            if (error.message === 'Account not found') {
                return res.status(404).json({ error: 'Account not found' });
            }
            res.status(500).json({ error: 'Failed to delete account' });
        }
    };
}
