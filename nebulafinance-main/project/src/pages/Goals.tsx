import { useState, useEffect } from 'react';
import { useFinance } from '../contexts/FinanceContext';
import { Plus, X, Target, Calendar, Banknote, Wallet } from 'lucide-react';
import { GoalCard } from '../components/GoalCard';
import { Goal } from '../utils/goals';
import { useTranslation } from 'react-i18next';
import { useToast } from '../contexts/ToastContext';

export default function Goals() {
    const { t } = useTranslation();
    const { transactions } = useFinance();
    const { showToast } = useToast();

    // Persistence for goals
    const [goals, setGoals] = useState<Goal[]>(() => {
        const saved = localStorage.getItem('savingsGoals');
        return saved ? JSON.parse(saved) : [
            {
                id: 'target-laptop',
                name: 'New MacBook Pro',
                targetAmount: 180000,
                currentSavings: 45000,
                targetDate: '2025-12-31',
            },
            {
                id: 'vacation-japan',
                name: 'Japan Vacation',
                targetAmount: 300000,
                currentSavings: 120000,
                targetDate: '2026-06-15',
            }
        ];
    });

    useEffect(() => {
        localStorage.setItem('savingsGoals', JSON.stringify(goals));
    }, [goals]);

    const [showModal, setShowModal] = useState(false);
    const [newGoal, setNewGoal] = useState<Partial<Goal>>({
        name: '',
        targetAmount: 0,
        currentSavings: 0,
        targetDate: new Date().toISOString().split('T')[0],
    });

    const handleAddGoal = () => {
        if (newGoal.name && newGoal.targetAmount && newGoal.targetAmount > 0) {
            const goal: Goal = {
                id: `goal_${Date.now()}`,
                name: newGoal.name,
                targetAmount: Number(newGoal.targetAmount),
                currentSavings: Number(newGoal.currentSavings) || 0,
                targetDate: newGoal.targetDate || new Date().toISOString().split('T')[0],
            };
            setGoals(prev => [...prev, goal]);
            setShowModal(false);
            setNewGoal({
                name: '',
                targetAmount: 0,
                currentSavings: 0,
                targetDate: new Date().toISOString().split('T')[0],
            });
            showToast('Goal created successfully!');
        }
    };

    return (
        <div className="page-wrapper">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-fluid-3xl font-bold text-textPrimary-light dark:text-textPrimary-dark">
                            {t('goals.title')}
                        </h1>
                        <p className="text-textSecondary-light dark:text-textSecondary-dark mt-2">
                            {t('goals.subtitle')}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn-primary flex items-center gap-2 animate-pulse-subtle"
                    >
                        <Plus className="w-5 h-5" />
                        {t('goals.addGoal')}
                    </button>
                </div>

                {goals.length === 0 ? (
                    <div className="bg-surface-light dark:bg-surface-dark border border-dashed border-light dark:border-dark p-12 text-center rounded-3xl flex flex-col items-center justify-center mb-8">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                            <Target className="w-6 h-6 text-textSecondary-light dark:text-textSecondary-dark opacity-70" />
                        </div>
                        <h4 className="text-lg font-bold text-textPrimary-light dark:text-textPrimary-dark">No Goals Found</h4>
                        <p className="text-textSecondary-light dark:text-textSecondary-dark mt-2 max-w-sm mx-auto text-sm leading-relaxed mb-6">
                            Start by adding a new savings goal to track your progress and stay motivated.
                        </p>
                        <button
                            onClick={() => setShowModal(true)}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            {t('goals.addGoal')}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {goals.map(goal => (
                            <GoalCard key={goal.id} goal={goal} transactions={transactions} />
                        ))}

                        <button
                            onClick={() => setShowModal(true)}
                            className="h-full min-h-[300px] border-2 border-dashed border-light dark:border-dark rounded-3xl flex flex-col items-center justify-center gap-4 text-textSecondary-light dark:text-textSecondary-dark hover:border-primary-500 hover:text-primary-500 hover-lift stagger-item transition-all group"
                        >
                            <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors">
                                <Plus className="w-8 h-8" />
                            </div>
                            <span className="text-lg font-bold">{t('goals.createAnother')}</span>
                        </button>
                    </div>
                )}

                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-surface-light dark:bg-surface-dark w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-light dark:border-dark">
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-2xl font-black text-textPrimary-light dark:text-textPrimary-dark">
                                        {t('goals.createModal.title')}
                                    </h2>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-textPrimary-light dark:text-textPrimary-dark mb-2 flex items-center gap-2">
                                            <Target className="w-4 h-4 text-primary-500" />
                                            {t('goals.createModal.name')}
                                        </label>
                                        <input
                                            type="text"
                                            placeholder={t('goals.createModal.placeholderName')}
                                            className="w-full px-5 py-3 rounded-2xl border-2 border-light dark:border-dark bg-gray-50 dark:bg-gray-900 focus:border-primary-500 outline-none transition-all dark:text-textPrimary-dark"
                                            value={newGoal.name}
                                            onChange={(e) => setNewGoal(prev => ({ ...prev, name: e.target.value }))}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-textPrimary-light dark:text-textPrimary-dark mb-2 flex items-center gap-2">
                                                <Banknote className="w-4 h-4 text-secondary-500" />
                                                {t('goals.createModal.targetAmount')}
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                className="w-full px-5 py-3 rounded-2xl border-2 border-light dark:border-dark bg-gray-50 dark:bg-gray-900 focus:border-primary-500 outline-none transition-all dark:text-textPrimary-dark"
                                                value={newGoal.targetAmount || ''}
                                                onChange={(e) => setNewGoal(prev => ({ ...prev, targetAmount: Number(e.target.value) }))}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-textPrimary-light dark:text-textPrimary-dark mb-2 flex items-center gap-2">
                                                <Wallet className="w-4 h-4 text-primary-500" />
                                                {t('goals.createModal.initialSavings')}
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                className="w-full px-5 py-3 rounded-2xl border-2 border-light dark:border-dark bg-gray-50 dark:bg-gray-900 focus:border-primary-500 outline-none transition-all dark:text-textPrimary-dark"
                                                value={newGoal.currentSavings || ''}
                                                onChange={(e) => setNewGoal(prev => ({ ...prev, currentSavings: Number(e.target.value) }))}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-textPrimary-light dark:text-textPrimary-dark mb-2 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-primary-500" />
                                            {t('goals.createModal.targetDate')}
                                        </label>
                                        <input
                                            type="date"
                                            className="w-full px-5 py-3 rounded-2xl border-2 border-light dark:border-dark bg-gray-50 dark:bg-gray-900 focus:border-primary-500 outline-none transition-all dark:text-textPrimary-dark"
                                            value={newGoal.targetDate}
                                            onChange={(e) => setNewGoal(prev => ({ ...prev, targetDate: e.target.value }))}
                                        />
                                    </div>

                                    <button
                                        onClick={handleAddGoal}
                                        className="w-full py-4 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-lg transition-all shadow-lg active:scale-95 mt-4"
                                    >
                                        {t('goals.createModal.submit')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
