import React from 'react';
import { FileText, Smartphone } from 'lucide-react';

interface SourceBadgeProps {
    source: 'manual' | 'sms';
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({ source }) => {
    if (source === 'sms') {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800">
                <Smartphone className="w-3 h-3" />
                SMS
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-50 dark:bg-gray-800 text-textSecondary-light dark:text-textSecondary-dark border border-gray-100 dark:border-gray-700">
            <FileText className="w-3 h-3" />
            Manual
        </span>
    );
};
