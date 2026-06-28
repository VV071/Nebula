import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useFinance } from '../contexts/FinanceContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface TransactionModalProps {
  type: 'income' | 'expense';
  onClose: () => void;
  transaction?: any;
}

export default function TransactionModal({ type: initialType, onClose, transaction }: TransactionModalProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { accounts, categories, createTransaction, updateTransaction } = useFinance();
  const { showToast } = useToast();

  const [transactionType, setTransactionType] = useState<'income' | 'expense'>(transaction?.type || initialType);
  const [amount, setAmount] = useState(transaction?.amount?.toString() || '');
  const [selectedCategory, setSelectedCategory] = useState(transaction?.category || '');
  const [selectedAccount, setSelectedAccount] = useState(transaction?.account_id || accounts[0]?.id || '');
  const [description, setDescription] = useState(transaction?.description || '');
  const [date, setDate] = useState(transaction?.date || new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [showCategoryError, setShowCategoryError] = useState(false);
  const [insufficientBalance, setInsufficientBalance] = useState(false);

  const filteredCategories = categories.filter(
    (cat) => cat.type === transactionType
  );

  useEffect(() => {
    const currentCategoryValid = filteredCategories.some(cat => cat.id === selectedCategory);
    if (!currentCategoryValid) {
      setSelectedCategory('');
    }
  }, [transactionType, filteredCategories, selectedCategory]);

  // Balance Check
  useEffect(() => {
    if (transactionType === 'expense' && amount && selectedAccount) {
      const account = accounts.find(a => String(a.id) === String(selectedAccount));
      if (account) {
        const balance = Number(account.balance);
        const expenseAmount = parseFloat(amount);
        if (expenseAmount > balance) {
          setInsufficientBalance(true);
        } else {
          setInsufficientBalance(false);
        }
      }
    } else {
      setInsufficientBalance(false);
    }
  }, [transactionType, amount, selectedAccount, accounts]);

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setTransactionType(newType);
    setSelectedCategory('');
    setShowCategoryError(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCategory) {
      setShowCategoryError(true);
      return;
    }

    if (insufficientBalance) return;

    if (!user || !selectedAccount || !amount) return;

    setLoading(true);
    try {
      const transactionData = {
        user_id: user.id,
        account_id: Number(selectedAccount),
        amount: parseFloat(amount),
        type: transactionType,
        category_id: Number(selectedCategory),
        description,
        date,
      };

      if (transaction) {
        const result = await updateTransaction(transaction.id, transactionData);
        if (result?.error) {
          alert('Error updating transaction: ' + result.error.message);
          return;
        }
      } else {
        const result = await createTransaction(transactionData);
        if (result?.error) {
          alert('Error creating transaction: ' + result.error.message);
          return;
        }
      }

      showToast('Transaction saved successfully!');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (iconName: string, color: string) => {
    // Check if it's an emoji (most emojis are 1-2 characters, not a Lucide component name)
    if (iconName.length <= 2) {
      return <span className="text-2xl">{iconName}</span>;
    }
    // Otherwise try to render as Lucide icon
    const IconComponent = (LucideIcons as any)[iconName];
    if (!IconComponent) return <span className="text-2xl">{iconName}</span>;
    return <IconComponent className="w-6 h-6" style={{ color }} />;
  };

  const isIncome = transactionType === 'income';
  const borderColorClass = isIncome
    ? 'border-secondary-500 dark:border-secondary-400'
    : 'border-red-500 dark:border-red-400';
  const accentColorClass = isIncome
    ? 'text-secondary-600 dark:text-secondary-400'
    : 'text-red-600 dark:text-red-400';
  const bgColorClass = isIncome
    ? 'bg-secondary-50 dark:bg-secondary-900/20'
    : 'bg-red-50 dark:bg-red-900/20';

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full lg:max-w-2xl bg-surface-light dark:bg-surface-dark rounded-t-3xl lg:rounded-3xl shadow-level-3 max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="sticky top-0 bg-surface-light dark:bg-surface-dark border-b border-light dark:border-dark p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-textPrimary-light dark:text-textPrimary-dark">
            {transaction
              ? t('transactions.editTransaction')
              : isIncome ? t('transactions.addIncome') : t('transactions.addExpense')
            }
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-button hover:bg-surfaceHover-light dark:hover:bg-surfaceHover-dark transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {!transaction && (
            <div>
              <label className="block text-sm font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-3">
                {t('transactions.typeLabel')} *
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleTypeChange('expense')}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-button font-semibold transition-all ${transactionType === 'expense'
                    ? 'bg-red-600 dark:bg-red-600 text-white shadow-level-2'
                    : 'bg-surfaceHover-light dark:bg-surfaceHover-dark text-textSecondary-light dark:text-textSecondary-dark hover:bg-red-50 dark:hover:bg-red-900/20'
                    }`}
                >
                  <TrendingDown className="w-5 h-5" />
                  <span>{t('transactions.expense')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('income')}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-button font-semibold transition-all ${transactionType === 'income'
                    ? 'bg-secondary-600 dark:bg-secondary-600 text-white shadow-level-2'
                    : 'bg-surfaceHover-light dark:bg-surfaceHover-dark text-textSecondary-light dark:text-textSecondary-dark hover:bg-secondary-50 dark:hover:bg-secondary-900/20'
                    }`}
                >
                  <TrendingUp className="w-5 h-5" />
                  <span>{t('transactions.income')}</span>
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-3">
              {t('transactions.amount')} *
            </label>
            <div className="relative">
              <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-bold ${accentColorClass}`}>
                ₹
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full pl-14 pr-4 py-4 text-3xl font-bold font-mono rounded-button border-2 ${borderColorClass} bg-surface-light dark:bg-surface-dark text-textPrimary-light dark:text-textPrimary-dark focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                placeholder="0"
                required
                step="0.01"
                min="0.01"
              />
            </div>
            <p className="mt-2 text-xs text-textTertiary-light dark:text-textTertiary-dark">
              {t('transactions.enterPositiveAmount', {
                type: isIncome ? t('transactions.income') : t('transactions.expense'),
                action: isIncome ? 'added to' : 'subtracted from'
              })}
            </p>
            {insufficientBalance && (
              <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400 animate-pulse">
                {t('transactions.insufficientBalance')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-3">
              {t('transactions.category')} *
            </label>
            {filteredCategories.length === 0 ? (
              <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
                {t('transactions.noCategories', { type: isIncome ? t('transactions.income') : t('transactions.expense') })}
              </p>
            ) : (
              <>
                <div className="grid grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setShowCategoryError(false);
                      }}
                      className={`p-4 rounded-button border-2 transition-all ${selectedCategory === category.id
                        ? `${borderColorClass} ${bgColorClass}`
                        : 'border-borderColor-light dark:border-borderColor-dark hover:border-primary-300 dark:hover:border-primary-700'
                        }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        {getCategoryIcon(category.icon, category.color)}
                        <span className="text-xs font-medium text-textPrimary-light dark:text-textPrimary-dark text-center">
                          {category.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                {showCategoryError && !selectedCategory && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    {t('transactions.selectCategory')}
                  </p>
                )}
              </>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-2">
              {t('transactions.account')} *
            </label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="input-field"
              required
            >
              {accounts.length === 0 ? (
                <option value="">{t('transactions.noAccounts')}</option>
              ) : (
                accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} - {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(account.balance))}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-2">
              {t('transactions.date')} *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-2">
              {t('transactions.description')} ({t('common.optional')})
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field resize-none"
              rows={3}
              placeholder={t('transactions.addNotePlaceholder')}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !selectedCategory || !amount || !selectedAccount || insufficientBalance}
            className={`w-full px-6 py-4 rounded-button font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isIncome
              ? 'bg-secondary-600 hover:bg-secondary-700 shadow-level-2 hover:shadow-level-3 hover:scale-[1.02]'
              : 'bg-red-600 hover:bg-red-700 shadow-level-2 hover:shadow-level-3 hover:scale-[1.02]'
              }`}
          >
            {loading ? t('common.loading') : transaction ? t('common.save') : isIncome ? t('transactions.addIncome') : t('transactions.addExpense')}
          </button>
        </form>
      </div>
    </div>
  );
}
