import { Request, Response } from 'express';
import { InsightService } from '../services/insightService';

export class InsightController {
    private insightService = new InsightService();

    getInsights = async (req: Request, res: Response) => {
        try {
            const userId = req.user!.userId;
            const insights = await this.insightService.getInsights(userId);
            res.json({ success: true, data: insights });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch insights' });
        }
    };

    generateInsights = async (req: Request, res: Response) => {
        try {
            await this.insightService.generateInsights(req.user!.userId);
            res.status(200).json({ success: true, message: 'Insights generation triggered' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to generate insights' });
        }
    };

    dismissInsight = async (req: Request, res: Response) => {
        try {
            const userId = req.user!.userId;
            const id = parseInt(req.params.id);
            await this.insightService.dismissInsight(userId, id);
            res.json({ success: true, message: 'Insight dismissed' });
        } catch (error) {
            res.status(500).json({ error: 'Failed to dismiss insight' });
        }
    };
}
