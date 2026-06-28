export type AccountType = 'bank' | 'cash' | 'credit_card' | 'savings' | 'investment';

export interface Account {
    id: number;
    user_id: number;
    name: string;
    type: AccountType;
    balance: number;
    color: string;
    created_at: Date;
    updated_at: Date;
    is_active: boolean;
}

export interface CreateAccountDTO {
    name: string;
    type: AccountType;
    balance?: number;
    color?: string;
}

export interface UpdateAccountDTO {
    name?: string;
    type?: AccountType;
    balance?: number;
    color?: string;
    is_active?: boolean;
}
