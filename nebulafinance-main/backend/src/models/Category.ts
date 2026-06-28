export type CategoryType = 'income' | 'expense' | 'both';

export interface Category {
    id: number;
    user_id: number | null; // null for system default categories
    name: string;
    icon: string; // Lucide icon name
    color: string;
    type: CategoryType;
    is_default: boolean;
    created_at: Date;
}

export interface CreateCategoryDTO {
    name: string;
    icon: string;
    color: string;
    type: CategoryType;
}

export interface UpdateCategoryDTO {
    name?: string;
    icon?: string;
    color?: string;
}
