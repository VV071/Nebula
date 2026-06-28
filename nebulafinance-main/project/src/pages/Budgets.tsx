import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFinance } from '../contexts/FinanceContext';
import { Plus, Edit2, AlertTriangle, CheckCircle } from 'lucide-react';

export default function Budgets() {
    const { t } = useTranslation();
    const { categories, getBudgets, createBudget } = useFinance();
    const [budgets, setBudgets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [editAmount, setEditAmount] = useState<number>(0);

    useEffect(() => {
        loadBudgets();
    }, [getBudgets]);

    const loadBudgets = async () => {
        setLoading(true);
        const data = await getBudgets();
        setBudgets(data);
        setLoading(false);
    };

    const handleSaveBudget = async (categoryId: string) => {
        if (editAmount > 0) {
            await createBudget({
                category_id: categoryId,
                limit_amount: editAmount,
                period: 'monthly'
            });
            await loadBudgets();
            setEditingCategory(null);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getAlertLevel = (percentUsed: number) => {
        if (percentUsed >= 100) return 'text-red-600 bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800';
        if (percentUsed >= 90) return 'text-amber-600 bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800';
        if (percentUsed >= 75) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800';
        return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800';
    };

    const getProgressBarColor = (percentUsed: number) => {
        if (percentUsed >= 100) return 'bg-red-500';
        if (percentUsed >= 90) return 'bg-amber-500';
        if (percentUsed >= 75) return 'bg-yellow-500';
        return 'bg-emerald-500';
    };

    return (
        <div className="page-wrapper">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-fluid-3xl font-bold text-textPrimary-light dark:text-textPrimary-dark mb-2">
                        Monthly Budgets
                    </h1>
                    <p className="text-textSecondary-light dark:text-textSecondary-dark">
                        Set and track spending limits for each category
                    </p>
                </div>

                <div className="grid gap-6">
                    {categories.map(category => {
                        const budget = budgets.find(b => b.category_id.toString() === category.id);
                        const percentUsed = budget ? budget.percentUsed : 0;
                        const alertClass = budget ? getAlertLevel(percentUsed) : '';
                        const isEditing = editingCategory === category.id;

                        return (
                            <div key={category.id} className={`glass-card p-6 border transition-all ${budget ? alertClass.split(' ')[2] : 'border-transparent'}`}>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="text-2xl p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                            {/* Handle icon rendering if needed, or just show category name */}
                                            <span style={{ color: category.color }} className="font-bold text-xl">
                                                {/* Simple color dot or wait for icon system */}
                                                <span className="inline-block w-4 h-4 rounded-full mr-2" style={{ backgroundColor: category.color }}></span>
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-textPrimary-light dark:text-textPrimary-dark">
                                                {category.name}
                                            </h3>
                                            {budget ? (
                                                <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark">
                                                    {formatCurrency(budget.spent)} spent of {formatCurrency(budget.limit_amount)}
                                                </p>
                                            ) : (
                                                <p className="text-sm text-textSecondary-light dark:text-textSecondary-dark italic">
                                                    No budget set
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {isEditing ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    autoFocus
                                                    className="input-field w-32 py-1 px-2"
                                                    value={editAmount}
                                                    onChange={(e) => setEditAmount(Number(e.target.value))}
                                                    placeholder="Limit"
                                                />
                                                <button
                                                    onClick={() => handleSaveBudget(category.id)}
                                                    className="btn-primary py-1 px-3 text-sm"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingCategory(null)}
                                                    className="btn-secondary py-1 px-3 text-sm"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setEditingCategory(category.id);
                                                    setEditAmount(budget?.limit_amount || 0);
                                                }}
                                                className="btn-secondary flex items-center gap-2 py-1 px-3 text-sm"
                                            >
                                                {budget ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                                {budget ? 'Edit Limit' : 'Set Budget'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {budget && (
                                    <div className="space-y-2">
                                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-500 ${getProgressBarColor(percentUsed)}`}
                                                style={{ width: `${Math.min(percentUsed, 100)}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between text-xs font-medium">
                                            <span className={percentUsed >= 100 ? 'text-red-600' : 'text-textSecondary-light'}>
                                                {percentUsed.toFixed(0)}% used
                                            </span>
                                            <span className="text-textSecondary-light">
                                                {formatCurrency(budget.remaining)} remaining
                                            </span>
                                        </div>
                                        {percentUsed >= 90 && (
                                            <div className="flex items-center gap-2 mt-2 text-sm text-amber-600 dark:text-amber-400">
                                                <AlertTriangle className="w-4 h-4" />
                                                <span>You are close to or over your budget limit!</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
