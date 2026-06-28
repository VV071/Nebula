export type TransactionType = 'income' | 'expense';

export interface Transaction {
    id: number;
    user_id: number;
    account_id: number;
    category_id: number;
    amount: number;
    type: TransactionType;
    description: string | null;
    date: Date; // ISO Date string in JSON
    balance_before: number | null;
    balance_after: number | null;
    created_at: Date;
    updated_at: Date;

    // Joined fields
    account_name?: string;
    category_name?: string;
    category_icon?: string;
    category_color?: string;

    // Computed fields
    budgetImpact?: {
        category: string;
        remaining: number;
    };
}

export interface CreateTransactionDTO {
    account_id: number;
    category_id: number;
    amount: number;
    type: TransactionType;
    description?: string;
    date: string | Date;
}

export interface TransactionFilters {
    startDate?: string;
    endDate?: string;
    type?: TransactionType;
    account_id?: number[];
    category_id?: number[];
    minAmount?: number;
    maxAmount?: number;
    search?: string;
}
