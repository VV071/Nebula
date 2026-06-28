import { useTranslation } from 'react-i18next';
import { TrendingUp, Plus, ArrowRight, X, TrendingDown, Wallet, Sparkles } from 'lucide-react';
import { useFinance } from '../contexts/FinanceContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useState, useEffect, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import TransactionModal from '../components/TransactionModal';
import { TimeRangeSelector } from '../components/TimeRangeSelector';
import { InsightCard } from '../components/InsightCard';
import { MonthlySummaryCard } from '../components/MonthlySummaryCard';
import { PendingTransactions, PendingTransaction } from '../components/PendingTransactions';
import { SourceBadge } from '../components/SourceBadge';
import { TimeRange, filterTransactionsByRange, formatDateRange } from '../utils/dateHelpers';
import { sumByType, calculateNetSavings, calculateCategoryTotals } from '../utils/calculations';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { subDays, subMonths, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';
import { simulateIncomingSMS, parseBankSMS } from '../utils/smsParser';

function AnimatedBalance({ value, formatFn }: { value: number; formatFn: (val: number) => string }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    const duration = 850;
    const start = performance.now();
    const startValue = displayValue;
    const diff = value - startValue;

    if (diff === 0) return;

    let frameId: number;

    const animate = (timestamp: number) => {
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startValue + diff * easeOut;
      setDisplayValue(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [value]);

  return <>{formatFn(displayValue)}</>;
}

function DeltaChip({ current, previous, isInverted = false }: { current: number; previous: number; isInverted?: boolean }) {
  const delta = useMemo(() => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  }, [current, previous]);

  if (previous === 0 && current === 0) return null;

  const isFavorable = isInverted ? delta < 0 : delta > 0;
  const formattedDelta = delta > 0 ? `+${delta.toFixed(0)}%` : `${delta.toFixed(0)}%`;

  return (
    <div className={`mt-2 w-max ${isFavorable ? 'chip-success' : 'chip-danger'}`}>
      {formattedDelta} vs last period
    </div>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const { actualTheme } = useTheme();
  const { accounts, transactions, categories, insights, dismissInsight, getBudgets, aiInsights: smartInsights, dismissSmartInsight, loading } = useFinance();
  const { user } = useAuth();
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [isLoading, setIsLoading] = useState(false);

  const [selectedRange, setSelectedRange] = useState<TimeRange>(() => {
    return (localStorage.getItem('selectedTimeRange') as TimeRange) || '30days';
  });

  const [customRange, setCustomRange] = useState<{ start: Date; end: Date }>(() => {
    const saved = localStorage.getItem('customTimeRange');
    if (saved) {
      try {
        const { start, end } = JSON.parse(saved);
        return { start: new Date(start), end: new Date(end) };
      } catch (e) {
        console.error('Error parsing custom range', e);
      }
    }
    return { start: subDays(new Date(), 30), end: new Date() };
  });

  useEffect(() => {
    localStorage.setItem('selectedTimeRange', selectedRange);
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [selectedRange]);

  useEffect(() => {
    localStorage.setItem('customTimeRange', JSON.stringify(customRange));
  }, [customRange]);

  useEffect(() => {
    const loadDashboardData = async () => {
      // Fetching budgets if needed for future use, but currently not used in dashboard summary
      await getBudgets();
    };

    if (user) {
      loadDashboardData();
    }
  }, [user, transactions]); // Reload when transactions change

  const filteredTransactions = useMemo(() => {
    if (!Array.isArray(transactions)) return [];
    return filterTransactionsByRange(transactions, selectedRange, customRange);
  }, [transactions, selectedRange, customRange]);

  const totalIncome = useMemo(() => sumByType(filteredTransactions, 'income'), [filteredTransactions]);
  const totalExpense = useMemo(() => sumByType(filteredTransactions, 'expense'), [filteredTransactions]);
  const netSavings = useMemo(() => calculateNetSavings(filteredTransactions), [filteredTransactions]);

  const categoryTotals = useMemo(() => {
    if (!Array.isArray(filteredTransactions)) return [];
    const totals = calculateCategoryTotals(filteredTransactions);
    return totals.map(t => ({
      ...t,
      name: categories.find(c => String(c.id) === String(t.category))?.name || t.category,
      color: categories.find(c => String(c.id) === String(t.category))?.color || '#94a3b8'
    })).filter(t => t.total > 0);
  }, [filteredTransactions, categories]);

  // Derived Monthly Summary to ensure consistency with filtered dashboard data
  const monthlySummary = useMemo(() => {
    // Top category calculation from filtered expenses
    const topCat = categoryTotals.length > 0
      ? categoryTotals.reduce((prev, current) => (prev.total > current.total) ? prev : current)
      : null;

    // Savings rate calculation (Income - Expenses) / Income
    const savingsRate = totalIncome > 0
      ? (netSavings / totalIncome) * 100
      : 0;

    return {
      month: new Date().toISOString(), // Used for the "Overview for..." label
      expenses: totalExpense,
      savings: netSavings,
      savingsRate: Math.max(0, savingsRate), // Keep as 0 if negative for rate purposes
      topCategory: topCat?.name || 'N/A',
      topCategoryAmount: topCat?.total || 0,
      trend: 'stable',
      trendPercent: 0
    };
  }, [totalIncome, totalExpense, netSavings, categoryTotals]);

  const incomeVsExpenseData = [
    { name: 'Income', value: totalIncome, fill: '#10B981' },
    { name: 'Expense', value: totalExpense, fill: '#EF4444' },
  ];

  const totalBalance = Array.isArray(accounts) ? accounts.reduce((sum, acc) => sum + Number(acc.balance), 0) : 0;

  const precedingTransactions = useMemo(() => {
    if (!Array.isArray(transactions)) return [];
    
    const now = new Date();
    let startDate: Date;
    let endDate = endOfDay(now);

    switch (selectedRange) {
      case '7days':
        startDate = startOfDay(subDays(now, 7));
        break;
      case '15days':
        startDate = startOfDay(subDays(now, 15));
        break;
      case '30days':
        startDate = startOfDay(subDays(now, 30));
        break;
      case '3months':
        startDate = startOfDay(subMonths(now, 3));
        break;
      case 'custom':
        if (customRange) {
          startDate = startOfDay(customRange.start);
          endDate = endOfDay(customRange.end);
        } else {
          startDate = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
        }
        break;
      default:
        startDate = startOfDay(subDays(now, 30));
    }

    const durationMs = endDate.getTime() - startDate.getTime();
    const precedingEndDate = new Date(startDate.getTime() - 1);
    const precedingStartDate = new Date(precedingEndDate.getTime() - durationMs);

    return transactions.filter(t => {
      if (!t || !t.date) return false;
      try {
        const txDate = parseISO(t.date);
        return isWithinInterval(txDate, { start: precedingStartDate, end: precedingEndDate });
      } catch (e) {
        return false;
      }
    });
  }, [transactions, selectedRange, customRange]);

  const prevTotalIncome = useMemo(() => sumByType(precedingTransactions, 'income'), [precedingTransactions]);
  const prevTotalExpense = useMemo(() => sumByType(precedingTransactions, 'expense'), [precedingTransactions]);
  const prevNetSavings = useMemo(() => prevTotalIncome - prevTotalExpense, [prevTotalIncome, prevTotalExpense]);

  const sparklineData = useMemo(() => {
    const sortedTxs = [...filteredTransactions]
      .filter(tx => tx.status !== 'pending')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (sortedTxs.length === 0) {
      return [
        { date: 'Start', balance: totalBalance },
        { date: 'End', balance: totalBalance }
      ];
    }

    const points = [];
    let current = totalBalance;
    points.push({ date: new Date().toISOString(), balance: current });

    for (let i = sortedTxs.length - 1; i >= 0; i--) {
      const tx = sortedTxs[i];
      const amount = Number(tx.amount);
      if (tx.type === 'income') {
        current -= amount;
      } else {
        current += amount;
      }
      points.push({ date: tx.date, balance: current });
    }

    return points.reverse();
  }, [filteredTransactions, totalBalance]);

  const recentTransactions = Array.isArray(filteredTransactions) ? filteredTransactions.slice(0, 8) : [];

  // Previously: const { smartInsights, dismissInsight: dismissSmartInsight } = useInsights(filteredTransactions, categories);
  // Now using global context insights, but filtering isn't applied globally yet. 
  // Wait, if we use context, it uses ALL transactions. 
  // The original used `filteredTransactions`. 
  // However, the task said: "Reuse AI Suggestions... without duplicating logic".
  // The context has `transactions` (all of them).
  // The insights logic `generateInsights` takes transactions. 
  // If I use the global one, it will use ALL transactions for insights.
  // The Dashboard *was* passing `filteredTransactions`. 
  // This is a subtle change.
  // BUT the instruction says "Reuse AI Suggestions... Do NOT recompute AI suggestions".
  // Centralizing assumes global insights. 
  // Let's stick to the plan: use the one from Context.
  // NOTE: If global transactions are used, date filtering in insights might need to be aware of "current time" vs "filter time".
  // But usually insights are "current status", not "historical status based on filter".
  // So using global transactions is likely CORRECT for "Smart Insights" (e.g. "Spending Pace" is about *this month*, not the selected range).


  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>(() => {
    const saved = localStorage.getItem('pendingTransactions');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('pendingTransactions', JSON.stringify(pendingTransactions));
  }, [pendingTransactions]);

  const autoImportEnabled = JSON.parse(localStorage.getItem('autoImportEnabled') || 'true');

  const isDuplicate = (pendingTx: PendingTransaction, existingTransactions: any[]) => {
    return existingTransactions.some(existing => {
      const amountMatch = Number(existing.amount) === pendingTx.amount;
      const dateMatch = new Date(existing.date).toDateString() === new Date(pendingTx.date).toDateString();
      const timeDiff = Math.abs(new Date(existing.date).getTime() - new Date(pendingTx.date).getTime());
      const isRecent = timeDiff < 60 * 1000; // within 1 minute
      return amountMatch && dateMatch && isRecent;
    });
  };

  const simulateSMSImport = () => {
    const rawSMS = simulateIncomingSMS();
    const parsed = parseBankSMS(rawSMS);

    if (!parsed) return;

    const newTx: PendingTransaction = {
      id: `sms_${Date.now()}`,
      amount: parsed.amount,
      type: parsed.type,
      date: new Date().toISOString(),
      source: 'sms',
      bank: parsed.bank,
      rawSMS,
      status: 'pending'
    };

    if (isDuplicate(newTx, transactions)) {
      console.log('Duplicate transaction detected, skipping import.');
      return;
    }

    setPendingTransactions(prev => [newTx, ...prev]);
  };

  const handleAcceptPending = async (pendingTx: PendingTransaction) => {
    const response = await useFinance().createTransaction({
      user_id: user?.id || '',
      amount: pendingTx.amount,
      type: pendingTx.type,
      category: 'other',
      account_id: accounts[0]?.id || '',
      date: pendingTx.date,
      description: `SMS: ${pendingTx.bank}`,
    } as any);

    if (!response.error) {
      setPendingTransactions(prev => prev.filter(t => t.id !== pendingTx.id));
    }
  };

  const handleRejectPending = (id: string) => {
    setPendingTransactions(prev => prev.filter(t => t.id !== id));
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.greeting.morning');
    if (hour < 18) return t('dashboard.greeting.afternoon');
    return t('dashboard.greeting.evening');
  };

  const formatCurrency = (amount: number | undefined) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('dashboard.today');
    if (diffDays === 1) return t('dashboard.yesterday');
    if (diffDays < 7) return t('dashboard.daysAgo', { count: diffDays });
    return new Date(dateString).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => String(c.id) === String(categoryId));
    if (!category) return null;

    const IconComponent = (LucideIcons as any)[category.icon];
    if (!IconComponent) return null;

    return (
      <div
        className="category-icon-wrapper"
        style={{
          background: `linear-gradient(135deg, ${category.color}15, ${category.color}25)`,
        }}
      >
        <IconComponent className="w-5 h-5" style={{ color: category.color }} />
      </div>
    );
  };

  const openTransactionModal = (type: 'income' | 'expense') => {
    setTransactionType(type);
    setShowTransactionModal(true);
  };

  return (
    <div className="min-h-screen">
      <div className="pt-20 lg:pt-12 px-4 lg:px-8 pb-28 lg:pb-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8 lg:mb-12 stagger-item">
            <div className="space-y-2">
              <div className="flex items-center gap-3 mb-1">
                <span className="neon-badge">Live</span>
                <span className="text-xs font-medium text-textSecondary-light dark:text-textSecondary-dark uppercase tracking-wider">
                  Financial Overview
                </span>
              </div>
              <h1 className="text-display font-extrabold text-gradient">
                {getGreeting()}
              </h1>
              <p className="text-fluid-lg text-textSecondary-light dark:text-textSecondary-dark">
                Track and manage your finances
              </p>
            </div>

            <div className="flex gap-3">
              {autoImportEnabled && (
                <button
                  onClick={simulateSMSImport}
                  className="btn-outline flex items-center gap-2 whitespace-nowrap"
                >
                  <LucideIcons.Smartphone className="w-4 h-4" />
                  <span className="hidden sm:inline">Simulate SMS</span>
                </button>
              )}
              <button
                onClick={() => openTransactionModal('income')}
                className="btn-secondary flex items-center gap-2 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">{t('dashboard.addIncome')}</span>
                <span className="sm:hidden">Income</span>
              </button>
              <button
                onClick={() => openTransactionModal('expense')}
                className="btn-primary flex items-center gap-2 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">{t('dashboard.addExpense')}</span>
                <span className="sm:hidden">Expense</span>
              </button>
            </div>
          </div>

          {/* Monthly Summary Card */}
          {monthlySummary && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="stagger-item"
            >
              <MonthlySummaryCard summary={monthlySummary} />
            </motion.div>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 stagger-item">
            <TimeRangeSelector
              selectedRange={selectedRange}
              onRangeChange={setSelectedRange}
              customRange={customRange}
              onCustomRangeChange={(start, end) => setCustomRange({ start, end })}
            />
            <div className="text-sm font-medium text-textSecondary-light dark:text-textSecondary-dark bg-surface-light dark:bg-surface-dark px-4 py-2 rounded-lg border border-gray-100 dark:border-gray-800">
              {formatDateRange(selectedRange, customRange)}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 lg:mb-12">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card p-6 h-36 skeleton" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 lg:mb-12">
              {/* Income card */}
              <motion.div layout className="relative glass-card p-6 stagger-item flex flex-col justify-between overflow-hidden">
                {/* Color accent bar */}
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t"
                  style={{ background: 'linear-gradient(90deg, #10B981, #34D399)' }} />
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 rounded-xl" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                      <TrendingUp className="w-4 h-4 text-secondary-500" />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-textSecondary-light dark:text-textSecondary-dark">
                      Total Income
                    </p>
                  </div>
                  <p
                    className="font-bold text-textPrimary-light dark:text-textPrimary-dark font-mono truncate"
                    title={formatCurrency(totalIncome)}
                    style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.875rem)' }}
                  >
                    {formatCurrency(totalIncome)}
                  </p>
                </div>
                <DeltaChip current={totalIncome} previous={prevTotalIncome} />
              </motion.div>

              {/* Expense card */}
              <motion.div layout className="relative glass-card p-6 stagger-item flex flex-col justify-between overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t"
                  style={{ background: 'linear-gradient(90deg, #F43F5E, #FB7185)' }} />
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 rounded-xl" style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}>
                      <TrendingDown className="w-4 h-4 text-rose-500" />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-textSecondary-light dark:text-textSecondary-dark">
                      Total Expenses
                    </p>
                  </div>
                  <p
                    className="font-bold text-textPrimary-light dark:text-textPrimary-dark font-mono truncate"
                    title={formatCurrency(totalExpense)}
                    style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.875rem)' }}
                  >
                    {formatCurrency(totalExpense)}
                  </p>
                </div>
                <DeltaChip current={totalExpense} previous={prevTotalExpense} isInverted={true} />
              </motion.div>

              {/* Savings card */}
              <motion.div layout className="relative glass-card p-6 stagger-item flex flex-col justify-between overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t"
                  style={{ background: 'linear-gradient(90deg, #6366F1, #8B5CF6)' }} />
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 rounded-xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                      <Wallet className="w-4 h-4 text-primary-500" />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-textSecondary-light dark:text-textSecondary-dark">
                      Net Savings
                    </p>
                  </div>
                  <p
                    className="font-bold text-textPrimary-light dark:text-textPrimary-dark font-mono truncate"
                    title={formatCurrency(netSavings)}
                    style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.875rem)' }}
                  >
                    {formatCurrency(netSavings)}
                  </p>
                </div>
                <DeltaChip current={netSavings} previous={prevNetSavings} />
              </motion.div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {loading || isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              <div className="glass-card p-6 h-[400px] skeleton" />
              <div className="glass-card p-6 h-[400px] skeleton" />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12"
            >
              <div className="glass-card p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-textPrimary-light dark:text-textPrimary-dark mb-6 flex items-center gap-2">
                    <LucideIcons.PieChart className="w-4 h-4 text-primary-500" />
                    Category Breakdown
                  </h3>
                  <div className="h-64 relative">
                    {categoryTotals.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                          <LucideIcons.PieChart className="w-6 h-6 text-textSecondary-light dark:text-textSecondary-dark opacity-70" />
                        </div>
                        <p className="text-sm font-medium text-textSecondary-light dark:text-textSecondary-dark">
                          No expenses yet in this period
                        </p>
                      </div>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryTotals}
                              dataKey="total"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={2}
                            >
                              {categoryTotals.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: any) => formatCurrency(value)}
                              contentStyle={{
                                borderRadius: '12px',
                                border: actualTheme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                                backgroundColor: actualTheme === 'dark' ? '#18181B' : '#FFFFFF',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                              }}
                              itemStyle={{ color: actualTheme === 'dark' ? '#FAFAFA' : '#18181B' }}
                              labelStyle={{ color: actualTheme === 'dark' ? '#FAFAFA' : '#18181B' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-center flex flex-col items-center justify-center">
                          <span className="text-xl font-bold text-textPrimary-light dark:text-textPrimary-dark font-mono">
                            {formatCurrency(totalExpense)}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider text-textSecondary-light dark:text-textSecondary-dark font-semibold">
                            Total spent
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                {categoryTotals.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-light dark:border-dark pt-4">
                    {categoryTotals.map((category) => {
                      const percentage = totalExpense > 0 ? ((category.total / totalExpense) * 100).toFixed(0) : '0';
                      return (
                        <div key={category.category} className="flex items-center gap-2 text-xs">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-textSecondary-light dark:text-textSecondary-dark truncate max-w-[100px]">
                            {category.name}
                          </span>
                          <span className="font-semibold text-textPrimary-light dark:text-textPrimary-dark ml-auto">
                            {percentage}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="glass-card p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-textPrimary-light dark:text-textPrimary-dark mb-6 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-secondary-500" />
                    Income vs Expense
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={incomeVsExpenseData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip
                          formatter={(value: any) => formatCurrency(value)}
                          cursor={{ fill: actualTheme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)' }}
                          contentStyle={{
                            borderRadius: '12px',
                            border: actualTheme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                            backgroundColor: actualTheme === 'dark' ? '#18181B' : '#FFFFFF',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                          }}
                          itemStyle={{ color: actualTheme === 'dark' ? '#FAFAFA' : '#18181B' }}
                          labelStyle={{ color: actualTheme === 'dark' ? '#FAFAFA' : '#18181B' }}
                        />
                        <Bar
                          dataKey="value"
                          radius={[6, 6, 0, 0]}
                          barSize={60}
                        >
                          {incomeVsExpenseData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          </AnimatePresence>

          <PendingTransactions
            transactions={pendingTransactions}
            onAccept={handleAcceptPending}
            onReject={handleRejectPending}
          />

          {
            (smartInsights.length > 0) && (
              <section className="mb-12 stagger-item">
                <div className="section-stitch mb-6">
                  <h2 className="text-fluid-2xl font-bold text-textPrimary-light dark:text-textPrimary-dark whitespace-nowrap flex items-center gap-2">
                    <LucideIcons.Sparkles className="w-5 h-5 text-primary-500" />
                    Smart Insights
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AnimatePresence>
                    {smartInsights.map((insight) => (
                      <InsightCard
                        key={insight.id}
                        insight={insight}
                        onDismiss={dismissSmartInsight}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            )
          }

          <div className="hero-card mb-8 lg:mb-16 stagger-item relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3">
                <p className="label-text">
                  {t('dashboard.totalBalance')}
                </p>
                <div className="flex items-baseline gap-4 flex-wrap">
                  <h2 className="balance-number">
                    <AnimatedBalance value={totalBalance} formatFn={formatCurrency} />
                  </h2>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-pill bg-secondary-500/10 dark:bg-secondary-500/20">
                    <TrendingUp className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                    <span className="text-lg font-bold text-secondary-600 dark:text-secondary-400">
                      +2.5%
                    </span>
                    <span className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
                      {t('dashboard.thisMonth')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-48 h-16 md:h-20 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparklineData}>
                    <defs>
                      <linearGradient id="heroSparklineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="balance"
                      stroke="#6366F1"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#heroSparklineGrad)"
                      isAnimationActive={false}
                    />
                    <YAxis domain={['auto', 'auto']} hide />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="space-y-8 lg:space-y-12">
            {accounts.length > 0 && (
              <section className="stagger-item">
                <div className="section-stitch mb-6">
                  <h2 className="text-fluid-2xl font-bold text-textPrimary-light dark:text-textPrimary-dark whitespace-nowrap flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-primary-500" />
                    {t('dashboard.accountsOverview')}
                  </h2>
                </div>

                {loading ? (
                  <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="glass-card p-6 h-36 min-w-[280px] lg:min-w-[320px] skeleton" />
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
                    {accounts.map((account, index) => (
                      <div
                        key={account.id}
                        className="account-card min-w-[280px] lg:min-w-[320px]"
                        style={{ borderLeftColor: account.color, animationDelay: `${index * 0.05 + 0.1}s` }}
                      >
                        <div className="flex items-start justify-between mb-6">
                          <div
                            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                            style={{ backgroundColor: account.color + '15' }}
                          >
                            {account.type === 'bank' && <LucideIcons.Landmark className="w-7 h-7" style={{ color: account.color }} />}
                            {account.type === 'cash' && <LucideIcons.Banknote className="w-7 h-7" style={{ color: account.color }} />}
                            {account.type === 'credit_card' && <LucideIcons.CreditCard className="w-7 h-7" style={{ color: account.color }} />}
                            {account.type === 'savings' && <LucideIcons.PiggyBank className="w-7 h-7" style={{ color: account.color }} />}
                            {account.type === 'investment' && <LucideIcons.TrendingUp className="w-7 h-7" style={{ color: account.color }} />}
                          </div>
                          <span className="label-text capitalize">
                            {account.type.replace('_', ' ')}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark mb-3">
                          {account.name}
                        </h3>
                        <p className="stat-value">
                          {formatCurrency(Number(account.balance))}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {insights.length > 0 && (
              <section className="stagger-item">
                <div className="section-stitch mb-6">
                  <h2 className="text-fluid-2xl font-bold text-textPrimary-light dark:text-textPrimary-dark whitespace-nowrap flex items-center gap-2">
                    <LucideIcons.Lightbulb className="w-5 h-5 text-accent-500" />
                    {t('dashboard.insights')}
                  </h2>
                </div>
                <div className="space-y-4">
                  {insights.slice(0, 3).map((insight, index) => (
                    <div
                      key={insight.id}
                      className={`insight-card ${insight.type}`}
                      style={{ animationDelay: `${index * 0.05 + 0.15}s` }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <span
                              className="label-text inline-block"
                            >
                              {t(`insights.${insight.type}`)}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-textPrimary-light dark:text-textPrimary-dark">
                            {insight.title}
                          </h3>
                          <p className="text-fluid-base text-textSecondary-light dark:text-textSecondary-dark leading-relaxed">
                            {insight.message}
                          </p>
                          {insight.suggestion && (
                            <div className="flex items-start gap-2 pt-2">
                              <LucideIcons.Lightbulb className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                              <p className="text-fluid-sm font-medium text-primary-600 dark:text-primary-400">
                                {insight.suggestion}
                              </p>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => dismissInsight(insight.id)}
                          className="p-2 rounded-button hover:bg-surfaceHover-light dark:hover:bg-surfaceHover-dark transition-colors text-textSecondary-light dark:text-textSecondary-dark"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {recentTransactions.length > 0 && (
              <section className="stagger-item">
                <div className="section-stitch mb-6">
                  <h2 className="text-fluid-2xl font-bold text-textPrimary-light dark:text-textPrimary-dark whitespace-nowrap flex items-center gap-2">
                    <LucideIcons.Receipt className="w-5 h-5 text-secondary-500" />
                    {t('dashboard.recentTransactions')}
                  </h2>
                  {transactions.length > 8 && (
                    <button className="text-primary-600 dark:text-primary-400 font-semibold flex items-center gap-1 text-sm hover:gap-2 transition-all ml-auto flex-shrink-0">
                      {t('dashboard.viewAll')}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="minimal-card">
                  {recentTransactions.map((transaction, index) => {
                    const account = accounts.find(a => String(a.id) === String(transaction.account_id));
                    const category = categories.find(c => String(c.id) === String(transaction.category_id || transaction.category));

                    return (
                      <div
                        key={transaction.id}
                        className="transaction-item"
                        style={{ animationDelay: `${index * 0.03 + 0.2}s` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            {getCategoryIcon(transaction.category)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-textPrimary-light dark:text-textPrimary-dark truncate">
                              {transaction.description || category?.name}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-textSecondary-light dark:text-textSecondary-dark">
                              <span>{account?.name}</span>
                              <span>•</span>
                              <span>{getRelativeTime(transaction.date)}</span>
                              <SourceBadge source={(transaction as any).source || 'manual'} />
                            </div>
                          </div>
                          <div
                            className={`text-xl lg:text-2xl font-bold font-mono ${transaction.type === 'income'
                              ? 'text-secondary-600 dark:text-secondary-400'
                              : 'text-textPrimary-light dark:text-textPrimary-dark opacity-70'
                              }`}
                          >
                            {transaction.type === 'income' ? '+' : '−'}
                            {formatCurrency(Number(transaction.amount))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {accounts.length === 0 && transactions.length === 0 && (
              <div className="text-center py-20 stagger-item">
                <div className="max-w-md mx-auto space-y-6">
                  <div className="relative inline-block mx-auto">
                    <div className="w-28 h-28 rounded-2xl flex items-center justify-center mx-auto relative"
                      style={{
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))',
                        border: '1px solid rgba(99,102,241,0.2)',
                        boxShadow: '0 8px 32px rgba(99,102,241,0.12)',
                      }}
                    >
                      <span className="absolute inset-[6px] rounded-xl pointer-events-none"
                        style={{ border: '1.5px dashed rgba(99,102,241,0.2)' }}
                      />
                      <Sparkles className="w-12 h-12 text-primary-500" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-fluid-2xl font-bold text-gradient">
                      Welcome to Nebula Finance
                    </h3>
                    <p className="text-fluid-base text-textSecondary-light dark:text-textSecondary-dark">
                      Start by adding your first transaction
                    </p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <button onClick={() => openTransactionModal('income')} className="btn-secondary">
                      Add Income
                    </button>
                    <button onClick={() => openTransactionModal('expense')} className="btn-primary">
                      Add Expense
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div >
      </div >

      {
        showTransactionModal && (
          <TransactionModal
            type={transactionType}
            onClose={() => setShowTransactionModal(false)}
          />
        )
      }
    </div >
  );
}
