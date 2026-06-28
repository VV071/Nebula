import { Search, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EmptyStateProps {
    type: 'initial' | 'error' | 'not-found';
    message?: string;
}

export function EmptyState({ type, message }: EmptyStateProps) {
    const { t } = useTranslation();

    if (type === 'error') {
        return (
            <div className="text-center py-20 px-4 animate-scale-in">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-textPrimary-light dark:text-textPrimary-dark mb-2">
                    {t('empty.error.title')}
                </h3>
                <p className="text-textSecondary-light dark:text-textSecondary-dark max-w-sm mx-auto">
                    {message || t('empty.error.default')}
                </p>
            </div>
        );
    }

    if (type === 'not-found') {
        return (
            <div className="text-center py-20 px-4 animate-scale-in">
                <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-xl font-bold text-textPrimary-light dark:text-textPrimary-dark mb-2">
                    {t('empty.notFound.title')}
                </h3>
                <p className="text-textSecondary-light dark:text-textSecondary-dark max-w-sm mx-auto">
                    {t('empty.notFound.desc')}
                </p>
            </div>
        );
    }

    return (
        <div className="text-center py-24 px-4">
            <div className="w-20 h-20 rounded-full bg-surfaceHover-light dark:bg-surfaceHover-dark flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-textSecondary-light dark:text-textSecondary-dark opacity-50" />
            </div>
            <h3 className="text-2xl font-bold text-textPrimary-light dark:text-textPrimary-dark mb-3">
                {t('empty.initial.title')}
            </h3>
            <p className="text-textSecondary-light dark:text-textSecondary-dark max-w-md mx-auto text-lg">
                {t('empty.initial.desc')}
            </p>
        </div>
    );
}
