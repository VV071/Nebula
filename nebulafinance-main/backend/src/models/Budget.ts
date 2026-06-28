export interface Budget {
    id: number;
    user_id: number;
    category_id: number;
    limit_amount: number;
    period: 'monthly' | 'weekly';
    created_at: Date;
    updated_at: Date;

    // Joined fields
    category_name?: string;
    category_icon?: string;
    category_color?: string;
}

export interface CreateBudgetDTO {
    category_id: number;
    limit_amount: number;
    period?: 'monthly' | 'weekly';
}

export interface UpdateBudgetDTO {
    limit_amount?: number;
    period?: 'monthly' | 'weekly';
}

export interface BudgetWithSpending extends Budget {
    spent: number;
    remaining: number;
    percentUsed: number;
}
