export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: 'bank' | 'cash' | 'credit_card' | 'savings' | 'investment';
          balance: number;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: 'bank' | 'cash' | 'credit_card' | 'savings' | 'investment';
          balance?: number;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: 'bank' | 'cash' | 'credit_card' | 'savings' | 'investment';
          balance?: number;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          account_id: string;
          amount: number;
          type: 'income' | 'expense';
          category: string;
          description: string;
          date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_id: string;
          amount: number;
          type: 'income' | 'expense';
          category: string;
          description?: string;
          date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_id?: string;
          amount?: number;
          type?: 'income' | 'expense';
          category?: string;
          description?: string;
          date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          icon: string;
          color: string;
          type: 'income' | 'expense' | 'both';
          is_default: boolean;
        };
        Insert: {
          id: string;
          name: string;
          icon: string;
          color: string;
          type: 'income' | 'expense' | 'both';
          is_default?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          icon?: string;
          color?: string;
          type?: 'income' | 'expense' | 'both';
          is_default?: boolean;
        };
      };
      insights: {
        Row: {
          id: string;
          user_id: string;
          type: 'warning' | 'reminder' | 'opportunity';
          title: string;
          message: string;
          suggestion: string;
          dismissed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'warning' | 'reminder' | 'opportunity';
          title: string;
          message: string;
          suggestion?: string;
          dismissed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'warning' | 'reminder' | 'opportunity';
          title?: string;
          message?: string;
          suggestion?: string;
          dismissed?: boolean;
          created_at?: string;
        };
      };
      user_settings: {
        Row: {
          user_id: string;
          language: 'en' | 'hi' | 'ta' | 'te' | 'kn' | 'ml';
          theme: 'light' | 'dark' | 'auto';
          currency: string;
          date_format: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          language?: 'en' | 'hi' | 'ta' | 'te' | 'kn' | 'ml';
          theme?: 'light' | 'dark' | 'auto';
          currency?: string;
          date_format?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          language?: 'en' | 'hi' | 'ta' | 'te' | 'kn' | 'ml';
          theme?: 'light' | 'dark' | 'auto';
          currency?: string;
          date_format?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
