export function sumByType(transactions: any[], type: 'income' | 'expense') {
    return transactions
        .filter(t => t.type === type)
        .reduce((sum, t) => sum + Number(t.amount), 0);
}

export function groupByCategory(transactions: any[]) {
    return transactions.reduce((groups: { [key: string]: any[] }, t) => {
        const category = t.category || 'Uncategorized';
        if (!groups[category]) groups[category] = [];
        groups[category].push(t);
        return groups;
    }, {});
}

export function calculateCategoryTotals(transactions: any[]) {
    const groups = groupByCategory(transactions);
    return Object.entries(groups).map(([category, txs]) => ({
        category,
        total: sumByType(txs, 'expense'),
        count: txs.length
    }));
}

export function calculateNetSavings(transactions: any[]) {
    const income = sumByType(transactions, 'income');
    const expense = sumByType(transactions, 'expense');
    return income - expense;
}
