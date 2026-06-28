import { Request, Response } from 'express';
import { SummaryService } from '../services/summaryService';

const summaryService = new SummaryService();

export class SummaryController {
    /**
     * GET /api/summary/:year/:month
     * Get monthly summary for a specific month
     */
    async getMonthlySummary(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const year = parseInt(req.params.year);
            const month = parseInt(req.params.month);

            if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
                return res.status(400).json({ error: 'Invalid year or month' });
            }

            // Create date for the first day of the specified month
            const date = new Date(year, month - 1, 1);

            const summary = await summaryService.generateMonthlySummary(userId, date);
            res.json({ summary });
        } catch (error: any) {
            console.error('Error generating monthly summary:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * GET /api/summary/current
     * Get summary for current month
     */
    async getCurrentMonthlySummary(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const now = new Date();

            const summary = await summaryService.generateMonthlySummary(userId, now);
            res.json({ summary });
        } catch (error: any) {
            console.error('Error generating current monthly summary:', error);
            res.status(500).json({ error: error.message });
        }
    }
}
