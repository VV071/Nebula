import { Request, Response } from 'express';
import { TransactionService } from '../services/transactionService';
import { createTransactionSchema } from '../utils/validator';

export class TransactionController {
    private transactionService = new TransactionService();

    getTransactions = async (req: Request, res: Response) => {
        try {
            const userId = req.user!.userId;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;
            const filters = {
                startDate: req.query.startDate as string,
                endDate: req.query.endDate as string,
                // ... map other query params to filters
            };

            const result = await this.transactionService.getTransactions(userId, filters, page, limit);
            res.json({ success: true, data: result });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch transactions' });
        }
    };

    createTransaction = async (req: Request, res: Response) => {
        try {
            const userId = req.user!.userId;
            const validation = createTransactionSchema.safeParse(req.body);
            if (!validation.success) {
                return res.status(400).json({ error: validation.error });
            }

            const transaction = await this.transactionService.createTransaction(userId, req.body);
            res.status(201).json({ success: true, data: transaction, message: 'Transaction created' });
        } catch (error: any) {
            console.error('[TransactionController] Error creating transaction:', error);
            if (error.message === 'Account not found') return res.status(404).json({ error: error.message });
            if (error.code === 'INSUFFICIENT_BALANCE') {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: 'Failed to create transaction', details: error.message });
        }
    };

    deleteTransaction = async (req: Request, res: Response) => {
        try {
            const userId = req.user!.userId;
            const id = parseInt(req.params.id);
            await this.transactionService.deleteTransaction(userId, id);
            res.json({ success: true, message: 'Transaction deleted' });
        } catch (error: any) {
            if (error.message === 'Transaction not found') return res.status(404).json({ error: error.message });
            res.status(500).json({ error: 'Failed to delete transaction' });
        }
    };
}
