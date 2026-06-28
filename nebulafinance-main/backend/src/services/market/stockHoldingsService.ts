import db from '../../config/database';

export interface StockHolding {
    id: number;
    symbol: string;
    company_name: string;
    quantity: number;
    purchase_price: number;
    current_price: number;
    pnl: number;
    pnl_percent: number;
}

export const stockHoldingsService = {
    // Get all holdings for user
    getHoldings: async (userId: number): Promise<StockHolding[]> => {
        const sql = `
            SELECT id, symbol, company_name, quantity, purchase_price, current_price 
            FROM stocks 
            WHERE user_id = $1
            ORDER BY symbol ASC
        `;
        const result = await db.query(sql, [userId]);

        // Calculate dynamic P&L
        return result.rows.map((row: any) => {
            const currentPrice = row.current_price || row.purchase_price; // Fallback
            const value = row.quantity * currentPrice;
            const cost = row.quantity * row.purchase_price;
            const pnl = value - cost;
            const pnlPercent = cost !== 0 ? (pnl / cost) * 100 : 0;

            return {
                ...row,
                current_price: currentPrice,
                pnl,
                pnl_percent: pnlPercent
            };
        });
    },

    // Buy Stock
    buyStock: async (userId: number, symbol: string, companyName: string, quantity: number, price: number, bankAccountId: number) => {
        // 1. Check Balance
        const accountRes = await db.query('SELECT balance FROM accounts WHERE id = $1 AND user_id = $2', [bankAccountId, userId]);
        if (!accountRes.rows.length) throw new Error('Account not found');

        const totalCost = quantity * price;
        if (parseFloat(accountRes.rows[0].balance) < totalCost) {
            throw new Error('Insufficient funds');
        }

        // Deduct money
        await db.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [totalCost, bankAccountId]);

        // Add Transaction record
        const transResult = await db.query(`
            INSERT INTO transactions (user_id, account_id, category_id, amount, type, description, date, balance_after)
            VALUES ($1, $2, (SELECT id FROM categories WHERE type='expense' LIMIT 1), $3, 'expense', $4, CURRENT_DATE, $5)
            RETURNING id
        `, [
            userId,
            bankAccountId,
            totalCost,
            `Bought ${quantity} shares of ${symbol}`,
            parseFloat(accountRes.rows[0].balance) - totalCost
        ]);

        const txnId = transResult.rows[0]?.id || (transResult as any).lastID;

        // Update or Insert Stock Holding
        const existing = await db.query('SELECT id, quantity, purchase_price FROM stocks WHERE user_id = $1 AND symbol = $2', [userId, symbol]);

        let stockId;
        if (existing.rows.length) {
            const oldQty = existing.rows[0].quantity;
            const oldPrice = existing.rows[0].purchase_price;
            const newQty = oldQty + quantity;
            const newAvgPrice = ((oldQty * oldPrice) + (quantity * price)) / newQty;

            await db.query('UPDATE stocks SET quantity = $1, purchase_price = $2, current_price = $3 WHERE id = $4', [newQty, newAvgPrice, price, existing.rows[0].id]);
            stockId = existing.rows[0].id;
        } else {
            const res = await db.query(`
                INSERT INTO stocks (user_id, symbol, company_name, quantity, purchase_price, current_price, purchase_transaction_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id
            `, [userId, symbol, companyName, quantity, price, price, txnId]);
            stockId = res.rows[0]?.id || (res as any).lastID;
        }

        // Log Stock Transaction
        await db.query(`
            INSERT INTO stock_transactions (user_id, stock_id, type, symbol, company_name, quantity, price, total_amount, bank_account_id)
            VALUES ($1, $2, 'BUY', $3, $4, $5, $6, $7, $8)
        `, [userId, stockId, symbol, companyName, quantity, price, totalCost, bankAccountId]);

        return { success: true };
    },

    // Sell Stock
    sellStock: async (userId: number, stockId: number, quantity: number, price: number, bankAccountId: number) => {
        const stockRes = await db.query('SELECT * FROM stocks WHERE id = $1 AND user_id = $2', [stockId, userId]);
        if (!stockRes.rows.length) throw new Error('Stock not found');

        const holding = stockRes.rows[0];
        if (holding.quantity < quantity) throw new Error('Insufficient shares');

        const totalValue = quantity * price;

        // Credit Money
        await db.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [totalValue, bankAccountId]);

        // Add Transaction record
        await db.query(`
            INSERT INTO transactions (user_id, account_id, category_id, amount, type, description, date)
            VALUES ($1, $2, (SELECT id FROM categories WHERE type='income' LIMIT 1), $3, 'income', $4, CURRENT_DATE)
        `, [
            userId,
            bankAccountId,
            totalValue,
            `Sold ${quantity} shares of ${holding.symbol}`
        ]);

        // Update Holding
        if (holding.quantity === quantity) {
            await db.query('DELETE FROM stocks WHERE id = $1', [stockId]);
        } else {
            await db.query('UPDATE stocks SET quantity = quantity - $1 WHERE id = $2', [quantity, stockId]);
        }

        // Log Stock Transaction
        await db.query(`
            INSERT INTO stock_transactions (user_id, stock_id, type, symbol, company_name, quantity, price, total_amount, bank_account_id)
            VALUES ($1, $2, 'SELL', $3, $4, $5, $6, $7, $8)
        `, [userId, stockId, holding.symbol, holding.company_name, quantity, price, totalValue, bankAccountId]);

        return { success: true };
    }
};
