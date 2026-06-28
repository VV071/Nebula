import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useFinance } from '../contexts/FinanceContext';
import { useTheme } from '../contexts/ThemeContext';
import { PieChart as PieChartIcon } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { InsightCard } from '../components/InsightCard';
import { AnimatePresence } from 'framer-motion';
import { TimeRange, filterTransactionsByRange, formatDateRange } from '../utils/dateHelpers';
import { TimeRangeSelector } from '../components/TimeRangeSelector';
import { subDays, subMonths, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';

function DeltaChip({ current, previous, isInverted = false }: { current: number; previous: number; isInverted?: boolean }) {
  const delta = useMemo(() => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  }, [current, previous]);

  if (previous === 0 && current === 0) return null;

  const isFavorable = isInverted ? delta < 0 : delta > 0;
  const formattedDelta = delta > 0 ? `+${delta.toFixed(0)}%` : `${delta.toFixed(0)}%`;

  return (
    <div className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mt-2 w-max ${
      isFavorable
        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
    }`}>
      {formattedDelta} vs last period
    </div>
  );
}

export default function Insights() {
  const { t } = useTranslation();
  const { actualTheme } = useTheme();
  const { transactions, categories, aiInsights, dismissSmartInsight } = useFinance();

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
  }, [selectedRange]);

  useEffect(() => {
    localStorage.setItem('customTimeRange', JSON.stringify(customRange));
  }, [customRange]);

  const filteredTransactions = useMemo(() =>
    filterTransactionsByRange(transactions, selectedRange, customRange),
    [transactions, selectedRange, customRange]);

  const expenseTransactions = filteredTransactions.filter(t => t.type === 'expense');
  const incomeTransactions = filteredTransactions.filter(t => t.type === 'income');

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

  const categoryData = categories.map(category => {
    const categoryTransactions = expenseTransactions.filter(t => String(t.category) === String(category.id));
    const total = categoryTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    return {
      name: category.name,
      value: total,
      color: category.color,
      category: category.id,
    };
  }).filter(d => d.value > 0);

  const incomeVsExpenseData = [
    { name: 'Income', value: totalIncome, fill: '#10B981' },
    { name: 'Expense', value: totalExpense, fill: '#EF4444' },
  ];

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

  const prevTotalIncome = useMemo(() => {
    const incomeTxs = precedingTransactions.filter(t => t.type === 'income');
    return incomeTxs.reduce((sum, t) => sum + Number(t.amount), 0);
  }, [precedingTransactions]);

  const prevTotalExpense = useMemo(() => {
    const expenseTxs = precedingTransactions.filter(t => t.type === 'expense');
    return expenseTxs.reduce((sum, t) => sum + Number(t.amount), 0);
  }, [precedingTransactions]);

  const prevNetSavings = useMemo(() => prevTotalIncome - prevTotalExpense, [prevTotalIncome, prevTotalExpense]);

  const formatCurrency = (value: number | undefined) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  return (
    <div className="page-wrapper">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8 stagger-item">
          <div>
            <h1 className="text-fluid-3xl font-bold text-textPrimary-light dark:text-textPrimary-dark">
              {t('insights.title')}
            </h1>
            <p className="text-textSecondary-light dark:text-textSecondary-dark mt-2">
              Advanced analysis of your spending and savings patterns
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
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
        </div>

        {
          (aiInsights.length > 0) && (
            <section className="mb-12 stagger-item">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-fluid-2xl font-bold text-textPrimary-light dark:text-textPrimary-dark">
                  Smart Insights
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence>
                  {aiInsights.map((insight) => (
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="glass-card p-6 flex flex-col justify-between">
            <div>
              <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark mb-2">
                Total Income
              </p>
              <p className="text-3xl font-bold text-secondary-600 dark:text-secondary-400 font-mono">
                {formatCurrency(totalIncome)}
              </p>
            </div>
            <DeltaChip current={totalIncome} previous={prevTotalIncome} />
          </div>

          <div className="glass-card p-6 flex flex-col justify-between">
            <div>
              <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark mb-2">
                Total Expense
              </p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 font-mono">
                {formatCurrency(totalExpense)}
              </p>
            </div>
            <DeltaChip current={totalExpense} previous={prevTotalExpense} isInverted={true} />
          </div>

          <div className="glass-card p-6 flex flex-col justify-between">
            <div>
              <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark mb-2">
                Net Savings
              </p>
              <p className={`text-3xl font-bold font-mono ${totalIncome - totalExpense >= 0
                ? 'text-secondary-600 dark:text-secondary-400'
                : 'text-red-600 dark:text-red-400'
                }`}>
                {formatCurrency(totalIncome - totalExpense)}
              </p>
            </div>
            <DeltaChip current={totalIncome - totalExpense} previous={prevNetSavings} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="glass-card p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold text-textPrimary-light dark:text-textPrimary-dark mb-6">
                {t('insights.categoryBreakdown')}
              </h2>
              <div className="h-64 relative">
                {categoryData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                      <PieChartIcon className="w-6 h-6 text-textSecondary-light dark:text-textSecondary-dark opacity-70" />
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
                          data={categoryData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                        >
                          {categoryData.map((entry, index) => (
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
            {categoryData.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-light dark:border-dark pt-4">
                {categoryData.map((category) => {
                  const percentage = totalExpense > 0 ? ((category.value / totalExpense) * 100).toFixed(0) : '0';
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

          {incomeVsExpenseData.length > 0 && (
            <div className="glass-card p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-bold text-textPrimary-light dark:text-textPrimary-dark mb-6">
                  {t('insights.incomeVsExpense')}
                </h2>
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
                      <Bar dataKey="value" fill="#4F46E5" radius={[6, 6, 0, 0]} barSize={60}>
                        {incomeVsExpenseData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
