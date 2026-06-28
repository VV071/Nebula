import { Request, Response } from 'express';
import { startOfDay, endOfDay, subDays, subMonths } from 'date-fns';
import db from '../config/database';
import ExcelJS from 'exceljs';

export class ExportController {

    exportData = async (req: Request, res: Response) => {
        try {
            const userId = req.user!.userId;
            const range = req.query.range as string || '30d';

            // 1. Date Normalization based on Range
            const now = new Date();
            const endDate = endOfDay(now);
            let startDate = startOfDay(subDays(now, 30)); // Default

            switch (range) {
                case '7d':
                    startDate = startOfDay(subDays(now, 7));
                    break;
                case '15d':
                    startDate = startOfDay(subDays(now, 15));
                    break;
                case '30d':
                    startDate = startOfDay(subDays(now, 30));
                    break;
                case '3m':
                    startDate = startOfDay(subMonths(now, 3));
                    break;
                case '6m':
                    startDate = startOfDay(subMonths(now, 6));
                    break;
            }

            // 2. Fetch Data
            const query = `
                SELECT 
                    t.date,
                    t.type,
                    c.name as category_name,
                    t.amount,
                    a.name as account_name,
                    t.balance_after,
                    t.description
                FROM transactions t
                JOIN accounts a ON t.account_id = a.id
                JOIN categories c ON t.category_id = c.id
                WHERE t.user_id = $1 
                  AND t.date >= $2 
                  AND t.date <= $3
                ORDER BY t.date ASC, t.created_at ASC
            `;

            const result = await db.query(query, [userId, startDate.toISOString(), endDate.toISOString()]);
            const transactions = result.rows;

            // 3. Generate Excel (XLSX)
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Transactions');

            // Define Columns with Widths (Fix for "########")
            worksheet.columns = [
                { header: 'Date', key: 'date', width: 15 },       // Increased width
                { header: 'Type', key: 'type', width: 10 },
                { header: 'Category', key: 'category', width: 20 },
                { header: 'Amount', key: 'amount', width: 15 },
                { header: 'Account', key: 'account', width: 20 },
                { header: 'Balance After', key: 'balance', width: 15 },
                { header: 'Description', key: 'description', width: 40 }
            ];

            // Add Rows
            transactions.forEach((t: any) => {
                const dateObj = new Date(t.date);
                // Strict YYYY-MM-DD format
                const dateStr = dateObj.toISOString().split('T')[0];

                worksheet.addRow({
                    date: dateStr,
                    type: t.type === 'income' ? 'Income' : 'Expense',
                    category: t.category_name,
                    amount: Number(t.amount),
                    account: t.account_name,
                    balance: t.balance_after !== null ? Number(t.balance_after) : '',
                    description: t.description || ''
                });
            });

            // Optional: Header Styling
            worksheet.getRow(1).font = { bold: true };

            // 4. Send Response
            const filename = `NebulaFinance_Report_${now.toISOString().split('T')[0]}.xlsx`;

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

            await workbook.xlsx.write(res);
            res.end();

        } catch (error: any) {
            console.error('[ExportController] Error exporting data:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Failed to export data', details: error.message });
            }
        }
    };
}
