import { Request, Response } from 'express';
import * as biddingService from '../services/biddingService';


export class BidsController {
    async getWallet(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const data = await biddingService.getWallet(userId);
            res.json(data);
        } catch (error: any) {
            console.error('[bids] getWallet error:', error);
            res.status(error.status ?? 500).json({ error: error.message });
        }
    }

    async placeBid(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const { ticker_a, ticker_b, chosen, stake } = req.body;
            if (!ticker_a || !ticker_b || !chosen || stake == null) {
                return res.status(400).json({ error: 'ticker_a, ticker_b, chosen, and stake are required' });
            }
            const result = await biddingService.placeBid(userId, ticker_a, ticker_b, chosen, Number(stake));
            res.status(201).json(result);
        } catch (error: any) {
            console.error('[bids] placeBid error:', error);
            res.status(error.status ?? 500).json({ error: error.message });
        }
    }

    async settleBid(req: Request, res: Response) {
        try {
            const bidId = parseInt(req.params.id, 10);
            if (isNaN(bidId)) {
                return res.status(400).json({ error: 'Invalid bid ID' });
            }
            const result = await biddingService.settleBid(bidId);
            res.json(result);
        } catch (error: any) {
            console.error('[bids] settleBid error:', error);
            res.status(error.status ?? 500).json({ error: error.message });
        }
    }

    async getBidHistory(req: Request, res: Response) {
        try {
            const userId = req.user!.userId;
            const history = await biddingService.getBidHistory(userId);
            res.json({ bids: history });
        } catch (error: any) {
            console.error('[bids] getBidHistory error:', error);
            res.status(error.status ?? 500).json({ error: error.message });
        }
    }

    async getLivePnl(req: Request, res: Response) {
        try {
            const bidId = parseInt(req.params.id, 10);
            if (isNaN(bidId)) return res.status(400).json({ error: 'Invalid bid ID' });
            const result = await biddingService.getPnl(bidId, req.user!.userId);
            res.json(result);
        } catch (error: any) {
            console.error('[bids] getLivePnl error:', error);
            res.status(error.status ?? 500).json({ error: error.message });
        }
    }
}
