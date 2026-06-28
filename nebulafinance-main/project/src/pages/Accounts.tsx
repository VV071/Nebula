import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, Landmark, Banknote, CreditCard, PiggyBank, TrendingUp } from 'lucide-react';
import { useFinance } from '../contexts/FinanceContext';
import AccountModal from '../components/AccountModal';

export default function Accounts() {
  const { t } = useTranslation();
  const { accounts, deleteAccount, loading } = useFinance();
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this account?')) {
      await deleteAccount(id);
    }
  };

  const openEditModal = (account: any) => {
    setEditingAccount(account);
    setShowModal(true);
  };

  const closeModal = () => {
    setEditingAccount(null);
    setShowModal(false);
  };

  const handleAccountCreated = (newAccount: any) => {
    console.log('\n\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('[PARENT] ACCOUNT CREATED CALLBACK');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('[STEP 1] Callback triggered at:', new Date().toISOString());
    console.log('[STEP 1] New account:', JSON.stringify(newAccount, null, 2));

    console.log('\n[STEP 2] Current accounts state:', accounts);
    console.log('[STEP 2] Accounts count before:', accounts.length);

    // In this app, FinanceContext handles the list, but we can log that it refresh was called
    // or if we were manually managing state, we would do:
    // setAccounts(prev => [...prev, newAccount]);

    console.log('[STEP 3] Note: FinanceContext handles the global state update.');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('[SUCCESS] Callback completed');
    console.log('═══════════════════════════════════════════════════════════\n\n');
  };

  return (
    <div className="page-wrapper">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-fluid-3xl font-bold text-textPrimary-light dark:text-textPrimary-dark">
            {t('accounts.title')}
          </h1>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t('accounts.addAccount')}
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-6 h-48 skeleton" />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-4">
                <Plus className="w-10 h-10 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-bold text-textPrimary-light dark:text-textPrimary-dark mb-2">
                {t('accounts.noAccounts')}
              </h3>
              <p className="text-textSecondary-light dark:text-textSecondary-dark mb-6">
                {t('accounts.addFirstAccount')}
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary"
              >
                {t('accounts.addAccount')}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account) => (
              <div key={account.id} className="account-card stagger-item" style={{ borderLeftColor: account.color }}>
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                    style={{ backgroundColor: account.color + '20' }}
                  >
                    {account.type === 'bank' && <Landmark className="w-7 h-7" style={{ color: account.color }} />}
                    {account.type === 'cash' && <Banknote className="w-7 h-7" style={{ color: account.color }} />}
                    {account.type === 'credit_card' && <CreditCard className="w-7 h-7" style={{ color: account.color }} />}
                    {account.type === 'savings' && <PiggyBank className="w-7 h-7" style={{ color: account.color }} />}
                    {account.type === 'investment' && <TrendingUp className="w-7 h-7" style={{ color: account.color }} />}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(account)}
                      className="p-2 rounded-button hover:bg-slate-100 dark:hover:bg-slate-800 text-textSecondary-light dark:text-textSecondary-dark hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(account.id)}
                      className="p-2 rounded-button hover:bg-slate-100 dark:hover:bg-slate-800 text-textSecondary-light dark:text-textSecondary-dark hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 mb-4">
                  <h3 className="text-xl font-bold text-textPrimary-light dark:text-textPrimary-dark">
                    {account.name}
                  </h3>
                  <span className="inline-block text-xs px-3 py-1 rounded-pill bg-slate-100 dark:bg-slate-800 text-textSecondary-light dark:text-textSecondary-dark capitalize">
                    {account.type.replace('_', ' ')}
                  </span>
                </div>

                <div className="pt-4 border-t border-light dark:border-dark">
                  <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark mb-1">
                    {t('accounts.currentBalance')}
                  </p>
                  <p className="text-3xl font-bold font-mono text-textPrimary-light dark:text-textPrimary-dark">
                    {formatCurrency(Number(account.balance))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <AccountModal
          account={editingAccount}
          onClose={closeModal}
          onAccountCreated={handleAccountCreated}
        />
      )}
    </div>
  );
}
