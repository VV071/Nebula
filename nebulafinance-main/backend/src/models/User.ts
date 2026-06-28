export interface UserPreferences {
    currency: 'INR' | 'USD' | 'EUR';
    language: 'en' | 'hi' | 'ta' | 'te' | 'kn' | 'ml';
    theme: 'light' | 'dark' | 'auto';
    dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY';
}

export interface User {
    id: number;
    email: string;
    password_hash: string;
    name: string;
    created_at: Date;
    updated_at: Date;
    last_login: Date | null;
    is_active: boolean;
    preferences: UserPreferences;
}

export interface CreateUserDTO {
    email: string;
    password: string;
    name: string;
}

export interface UpdateUserDTO {
    name?: string;
    preferences?: Partial<UserPreferences>;
}
