import { useState, useEffect, useMemo } from 'react';
import { generateInsights } from '../utils/insights';

export function useInsights(transactions: any[], categories: any[]) {
    const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
        const saved = localStorage.getItem('dismissedSmartInsights');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('dismissedSmartInsights', JSON.stringify(dismissedIds));
    }, [dismissedIds]);

    const smartInsights = useMemo(() => {
        return generateInsights(transactions, dismissedIds, categories);
    }, [transactions, dismissedIds, categories]);

    const dismissInsight = (id: string) => {
        setDismissedIds(prev => [...prev, id]);
    };

    return {
        smartInsights,
        dismissInsight,
        hasInsights: smartInsights.length > 0
    };
}
