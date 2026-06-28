import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { useInsights } from '../hooks/useInsights';
import { SmartInsight } from '../utils/insights';

// Type definitions matching backend schema
type Account = {
  id: number;
  user_id: number;
  name: string;
  type: 'bank' | 'cash' | 'credit_card' | 'savings' | 'investment';
  balance: number;
  color: string;
  created_at?: string;
};

type Transaction = {
  id: number;
  user_id: number;
  account_id: number;
  category_id: number;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  date: string;
  balance_before?: number;
  balance_after?: number;
  budgetImpact?: {
    category: string;
    remaining: number;
  };
  created_at?: string;
};

type Category = {
  id: number;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
};

type Insight = {
  id: string;
  user_id: string;
  type: 'warning' | 'reminder' | 'opportunity';
  title: string;
  message: string;
  suggestion: string;
  created_at?: string;
};

interface FinanceContextType {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  insights: Insight[];
  loading: boolean;
  refreshAccounts: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  createAccount: (account: Omit<Account, 'id' | 'user_id' | 'created_at'>) => Promise<{ data?: Account; error: Error | null }>;
  updateAccount: (id: number, updates: Partial<Account>) => Promise<{ data?: Account; error: Error | null }>;
  deleteAccount: (id: number) => Promise<{ error: Error | null }>;
  createTransaction: (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => Promise<{ error: Error | null }>;
  updateTransaction: (id: number, updates: Partial<Transaction>) => Promise<{ error: Error | null }>;
  deleteTransaction: (id: number) => Promise<{ error: Error | null }>;

  dismissInsight: (id: string) => Promise<{ error: Error | null }>;

  // AI Smart Insights
  aiInsights: SmartInsight[];
  dismissSmartInsight: (id: string) => void;

  // Budget Methods
  getBudgets: () => Promise<any[]>;
  createBudget: (data: { category_id: string; limit_amount: number; period?: 'monthly' | 'weekly' }) => Promise<{ error: Error | null }>;
  deleteBudget: (categoryId: string) => Promise<{ error: Error | null }>;

  // Summary Methods
  getMonthlySummary: (year: number, month: number) => Promise<any>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

// Default categories
const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, name: 'Salary', type: 'income', icon: 'Coins', color: '#10B981' },
  { id: 2, name: 'Freelance', type: 'income', icon: 'Briefcase', color: '#3B82F6' },
  { id: 3, name: 'Investment', type: 'income', icon: 'TrendingUp', color: '#8B5CF6' },
  { id: 4, name: 'Food', type: 'expense', icon: 'Utensils', color: '#EF4444' },
  { id: 5, name: 'Transport', type: 'expense', icon: 'Car', color: '#F59E0B' },
  { id: 6, name: 'Bills', type: 'expense', icon: 'FileText', color: '#6366F1' },
  { id: 7, name: 'Entertainment', type: 'expense', icon: 'Film', color: '#EC4899' },
  { id: 8, name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#14B8A6' },
  { id: 9, name: 'Health', type: 'expense', icon: 'Activity', color: '#F43F5E' },
];

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  // Computed AI Insights
  const { smartInsights: aiInsights, dismissInsight: dismissSmartInsight } = useInsights(transactions, categories);

  // Fetch accounts from API
  const refreshAccounts = async () => {
    console.log('[FinanceContext] Refreshing accounts...', { user });
    if (!user) {
      console.log('[FinanceContext] Skip refresh: No user');
      return;
    }

    try {
      const data = await api.getAccounts();
      console.log('[FinanceContext] Accounts received:', data);
      setAccounts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('[Finance] Error fetching accounts:', error);
      setAccounts([]);
    }
  };

  // Fetch transactions from API
  const refreshTransactions = async () => {
    if (!user) return;

    try {
      const data = await api.getTransactions();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('[Finance] Error fetching transactions:', error);
      setTransactions([]);
    }
  };

  // Load data when user logs in
  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([refreshAccounts(), refreshTransactions()])
        .finally(() => setLoading(false));
    } else {
      setAccounts([]);
      setTransactions([]);
      setInsights([]);
      setLoading(false);
    }
  }, [user]);

  const createAccount = async (account: Omit<Account, 'id' | 'user_id' | 'created_at'>) => {
    try {
      const result = await api.createAccount(account);
      await refreshAccounts();
      return { data: result, error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const updateAccount = async (id: number, updates: Partial<Account>) => {
    try {
      const result = await api.updateAccount(id, updates);
      await refreshAccounts();
      return { data: result, error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const deleteAccount = async (id: number) => {
    try {
      await api.deleteAccount(id);
      await refreshAccounts();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const createTransaction = async (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
    try {
      await api.createTransaction(transaction);
      await refreshTransactions();
      await refreshAccounts(); // Refresh accounts to update balances
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const updateTransaction = async (id: number, updates: Partial<Transaction>) => {
    try {
      await api.updateTransaction(id, updates);
      await refreshTransactions();
      await refreshAccounts();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const deleteTransaction = async (id: number) => {
    try {
      await api.deleteTransaction(id);
      await refreshTransactions();
      await refreshAccounts();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const dismissInsight = async (id: string) => {
    try {
      // Remove from local state
      setInsights(prev => prev.filter(i => i.id !== id));
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const getBudgets = async () => {
    try {
      const data = await api.getBudgets();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching budgets:', error);
      return [];
    }
  };

  const createBudget = async (data: { category_id: string; limit_amount: number; period?: 'monthly' | 'weekly' }) => {
    try {
      await api.createBudget(data);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const deleteBudget = async (categoryId: string) => {
    try {
      await api.deleteBudget(categoryId);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const getMonthlySummary = async (year: number, month: number) => {
    try {
      const response = await api.getMonthlySummary(year, month);
      return response?.summary || response?.data || null;
    } catch (error) {
      console.error('Error fetching summary:', error);
      return null;
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        accounts,
        transactions,
        categories,
        insights,
        loading,
        refreshAccounts,
        refreshTransactions,
        createAccount,
        updateAccount,
        deleteAccount,
        createTransaction,
        updateTransaction,
        deleteTransaction,

        dismissInsight,
        aiInsights,
        dismissSmartInsight,

        getBudgets,
        createBudget,
        deleteBudget,
        getMonthlySummary,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within FinanceProvider');
  }
  return context;
}
