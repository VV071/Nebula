import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { useFinance } from '../contexts/FinanceContext';
import TransactionModal from '../components/TransactionModal';
import { TransactionCard } from '../components/TransactionCard';

export default function Transactions() {
  const { t } = useTranslation();
  const { transactions, accounts, categories, deleteTransaction, loading } = useFinance();
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  const filteredTransactions = transactions.filter(tx =>
    filterType === 'all' || tx.type === filterType
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      await deleteTransaction(Number(id));
    }
  };

  const openEditModal = (transaction: any) => {
    setEditingTransaction(transaction);
    setShowModal(true);
  };

  const closeModal = () => {
    setEditingTransaction(null);
    setShowModal(false);
  };

  return (
    <div className="page-wrapper">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <h1 className="text-fluid-3xl font-bold text-textPrimary-light dark:text-textPrimary-dark">
            {t('transactions.title')}
          </h1>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t('transactions.addTransaction')}
          </button>
        </div>

        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          {['all', 'income', 'expense'].map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterType(filter as any)}
              className={`px-4 py-2 rounded-pill font-medium whitespace-nowrap transition-all ${filterType === filter
                ? 'bg-primary-600 text-white shadow-elevation-2'
                : 'bg-slate-100 dark:bg-slate-800 text-textSecondary-light dark:text-textSecondary-dark hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
            >
              {filter === 'all' ? 'All' : filter === 'income' ? t('transactions.income') : t('transactions.expense')}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="glass-card p-6 h-24 skeleton animate-shimmer" />
            <div className="glass-card p-6 h-24 skeleton animate-shimmer" />
            <div className="glass-card p-6 h-24 skeleton animate-shimmer" />
            <div className="glass-card p-6 h-24 skeleton animate-shimmer" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-4">
                <Plus className="w-10 h-10 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-bold text-textPrimary-light dark:text-textPrimary-dark mb-2">
                {t('transactions.noTransactions')}
              </h3>
              <p className="text-textSecondary-light dark:text-textSecondary-dark mb-6">
                {t('transactions.startTracking')}
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary"
              >
                {t('transactions.addTransaction')}
              </button>
            </div>
          </div>
        ) : (
          <div className="glass-card divide-y divide-border-light dark:divide-border-dark">
            {filteredTransactions.map((transaction) => {
              const account = accounts.find(a => String(a.id) === String(transaction.account_id));
              const category = categories.find(c => String(c.id) === String((transaction as any).category_id || (transaction as any).category));

              return (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  account={account}
                  category={category}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                  formatCurrency={formatCurrency}
                />
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <TransactionModal
          type={editingTransaction?.type || 'expense'}
          transaction={editingTransaction}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
