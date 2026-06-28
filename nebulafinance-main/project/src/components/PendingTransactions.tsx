import React from 'react';
import { Check, X, Smartphone, Banknote, Calendar, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface PendingTransaction {
    id: string;
    amount: number;
    type: 'income' | 'expense';
    date: string;
    source: 'sms';
    bank: string;
    rawSMS?: string;
    status: 'pending';
}

interface PendingTransactionsProps {
    transactions: PendingTransaction[];
    onAccept: (tx: PendingTransaction) => void;
    onReject: (id: string) => void;
}

export const PendingTransactions: React.FC<PendingTransactionsProps> = ({
    transactions,
    onAccept,
    onReject,
}) => {
    if (transactions.length === 0) return null;

    return (
        <section className="mb-12 stagger-item">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-fluid-2xl font-bold text-textPrimary-light dark:text-textPrimary-dark flex items-center gap-2">
                    <Smartphone className="w-6 h-6 text-primary-500" />
                    Pending Approval
                    <span className="ml-2 px-2.5 py-0.5 rounded-full bg-primary-500 text-white text-sm">
                        {transactions.length}
                    </span>
                </h2>
                <div className="flex items-center gap-2 text-sm font-medium text-secondary-600 dark:text-secondary-400">
                    <span className="w-2 h-2 rounded-full bg-secondary-500 animate-pulse"></span>
                    Auto-Import: ON
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {transactions.map((tx) => (
                        <motion.div
                            key={tx.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className="glass-card overflow-hidden group border-t-4 border-t-primary-500"
                        >
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className={`text-2xl font-black font-mono ${tx.type === 'income' ? 'text-secondary-600' : 'text-textPrimary-light dark:text-textPrimary-dark'
                                            }`}>
                                            {tx.type === 'income' ? '+' : '−'}₹{tx.amount.toLocaleString('en-IN')}
                                        </p>
                                        <p className="text-xs font-bold uppercase tracking-wider text-textSecondary-light dark:text-textSecondary-dark mt-1">
                                            {tx.type} • From SMS
                                        </p>
                                    </div>
                                    <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                                        <Banknote className="w-5 h-5 text-textSecondary-light dark:text-textSecondary-dark" />
                                    </div>
                                </div>

                                <div className="space-y-2 mb-6">
                                    <div className="flex items-center gap-2 text-sm text-textPrimary-light dark:text-textPrimary-dark font-medium">
                                        <Calendar className="w-4 h-4 text-primary-500" />
                                        {new Date(tx.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-textSecondary-light dark:text-textSecondary-dark">
                                        <Clock className="w-4 h-4" />
                                        {new Date(tx.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="text-xs font-semibold text-textSecondary-light dark:text-textSecondary-dark bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded inline-block">
                                        {tx.bank}
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => onAccept(tx)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
                                    >
                                        <Check className="w-4 h-4" />
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => onReject(tx.id)}
                                        className="flex items-center justify-center p-2.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 font-bold transition-all border border-red-100 dark:border-red-800"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {tx.rawSMS && (
                                <div className="px-5 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
                                    <p className="text-[10px] text-textSecondary-light dark:text-textSecondary-dark font-mono italic truncate">
                                        "{tx.rawSMS}"
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </section>
    );
};
