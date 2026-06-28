import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertTriangle } from 'lucide-react';
import { useFinance } from '../contexts/FinanceContext';
import { useToast } from '../contexts/ToastContext';

interface AccountModalProps {
  account?: any;
  onClose: () => void;
  onAccountCreated?: (newAccount: any) => void;
}

const ACCOUNT_TYPES = ['bank', 'cash', 'credit_card', 'savings', 'investment'];
const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#3B82F6'];

export default function AccountModal(props: AccountModalProps) {
  const { account, onClose, onAccountCreated } = props;
  const { t } = useTranslation();
  const { createAccount, updateAccount } = useFinance();
  const { showToast } = useToast();

  const [name, setName] = useState(account?.name || '');
  const [type, setType] = useState(account?.type || 'bank');
  const [balance, setBalance] = useState(account?.balance?.toString() || '0');
  const [color, setColor] = useState(account?.color || COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('\n\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('[MODAL] SUBMIT HANDLER - DIAGNOSTIC MODE');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('[STEP 1] Submit triggered at:', new Date().toISOString());
    console.log('[STEP 1] Form data:', JSON.stringify({ name, type, balance, color }, null, 2));

    console.log('\n[STEP 2] Clearing previous errors...');
    setError(null);
    console.log('[STEP 2] ✅ Error state cleared');

    console.log('\n[STEP 3] Validating form data...');
    if (!name?.trim()) {
      console.log('[STEP 3] ❌ Validation failed: name is empty');
      setError(t('errors.accountNameRequired'));
      console.log('[STEP 3] Error set, returning');
      return;
    }
    console.log('[STEP 3] ✅ Name validation passed');

    if (!type) {
      console.log('[STEP 3] ❌ Validation failed: type is empty');
      setError(t('errors.accountTypeRequired'));
      return;
    }
    console.log('[STEP 3] ✅ Type validation passed');

    console.log('[STEP 3] ✅ All validation passed');

    console.log('\n[STEP 4] Setting loading state...');
    setLoading(true);
    console.log('[STEP 4] ✅ Loading state set to true');

    try {
      console.log('\n[STEP 5] Preparing API call data...');
      const apiData = {
        name: name.trim(),
        type,
        balance: parseFloat(String(balance || 0)),
        color: color || '#6366f1'
      };
      console.log('[STEP 5] API data:', JSON.stringify(apiData, null, 2));

      console.log('\n[STEP 6] Calling API service...');
      // Use updateAccount if we're editing an existing account, otherwise createAccount
      const result = account?.id
        ? await updateAccount(account.id, apiData)
        : await createAccount(apiData);

      console.log('[STEP 6] ✅ API call returned via FinanceContext');
      console.log('[STEP 6] Result:', JSON.stringify(result, null, 2));

      if (result?.error) {
        console.log('[STEP 6] ❌ API call returned error');
        throw result.error;
      }

      const newAccount = result.data || (result as any).account || result;
      console.log('[STEP 6] New account:', JSON.stringify(newAccount, null, 2));

      console.log('\n[STEP 7] Checking for onAccountCreated callback...');
      if (onAccountCreated) {
        console.log('[STEP 7] ✅ Callback exists, calling it...');
        console.log('[STEP 7] Passing account:', newAccount);
        onAccountCreated(newAccount);
        console.log('[STEP 7] ✅ Callback executed');
      } else {
        console.log('[STEP 7] ⚠️ WARNING: onAccountCreated callback is missing!');
        console.log('[STEP 7] This means parent component will NOT refresh via callback!');
      }

      console.log('\n[STEP 8] Resetting form...');
      setName('');
      setType('bank');
      setBalance('0');
      setColor(COLORS[0]);
      console.log('[STEP 8] ✅ Form reset');

      showToast(account ? 'Account updated successfully!' : 'Account saved successfully!');

      console.log('\n[STEP 9] Closing modal...');
      onClose();
      console.log('[STEP 9] ✅ Modal close triggered');

      console.log('═══════════════════════════════════════════════════════════');
      console.log('[SUCCESS] Form submission completed successfully');
      console.log('═══════════════════════════════════════════════════════════\n\n');

    } catch (error: any) {
      console.log('\n');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('[MODAL ERROR] EXCEPTION CAUGHT');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('[ERROR] Type:', error.constructor?.name);
      console.log('[ERROR] Message:', error.message);
      console.log('[ERROR] Stack:', error.stack);
      console.log('[ERROR] Setting error state...');

      setError(error instanceof Error ? error.message : 'Failed to create account');
      console.log('[ERROR] Error state set');
      console.log('[ERROR] NOT closing modal (so user can retry)');
      console.log('═══════════════════════════════════════════════════════════\n\n');

    } finally {
      console.log('\n[FINALLY] Setting loading to false...');
      setLoading(false);
      console.log('[FINALLY] ✅ Loading state cleared');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full lg:max-w-lg bg-surface-light dark:bg-surface-dark rounded-t-3xl lg:rounded-3xl shadow-level-3 animate-slide-up">
        <div className="sticky top-0 bg-surface-light dark:bg-surface-dark border-b border-light dark:border-dark p-6 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-2xl font-bold text-textPrimary-light dark:text-textPrimary-dark">
            {account ? t('accounts.editAccount') : t('accounts.addAccount')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-button hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark mb-2">
              {t('accounts.accountName')}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder={t('accounts.placeholderName')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark mb-2">
              {t('accounts.accountType')}
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="input-field"
              required
            >
              {ACCOUNT_TYPES.map((tVal) => (
                <option key={tVal} value={tVal}>
                  {t(`accounts.types.${tVal}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark mb-2">
              {account ? t('accounts.currentBalance') : t('accounts.initialBalance')}
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-xl font-bold text-textSecondary-light dark:text-textSecondary-dark">
                ₹
              </span>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="input-field !pl-12 !pr-24 text-xl font-mono w-full"
                placeholder="0"
                required
                step="0.01"
              />
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const current = parseFloat(balance) || 0;
                    setBalance((current - 1000).toString());
                  }}
                  className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-textPrimary-light dark:text-textPrimary-dark flex items-center justify-center font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const current = parseFloat(balance) || 0;
                    setBalance((current + 1000).toString());
                  }}
                  className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-textPrimary-light dark:text-textPrimary-dark flex items-center justify-center font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark mb-3">
              {t('accounts.color')}
            </label>
            <div className="flex gap-3 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-12 h-12 rounded-xl transition-all ${color === c
                    ? 'ring-4 ring-primary-500 ring-offset-2 ring-offset-surface-light dark:ring-offset-surface-dark scale-110'
                    : 'hover:scale-105'
                    }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('common.loading') : t('common.save')}
          </button>
        </form>
      </div>
    </div>
  );
}
