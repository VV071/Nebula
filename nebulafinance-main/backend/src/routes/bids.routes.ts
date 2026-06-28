import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { BidsController } from '../controllers/bidsController';

const router = express.Router();
const bids = new BidsController();

// All bidding routes require auth
router.use(authenticateToken);

router.get('/wallet',  bids.getWallet.bind(bids));
router.get('/history', bids.getBidHistory.bind(bids));
router.post('/',       bids.placeBid.bind(bids));

// Live P&L for a pending bid (polled by the frontend animation)
router.get('/:id/pnl', bids.getLivePnl.bind(bids));

// Manual settle — also used by the settlement scheduler (Phase 4)
router.post('/:id/settle', bids.settleBid.bind(bids));

export default router;
