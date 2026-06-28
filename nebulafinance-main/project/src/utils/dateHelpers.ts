import { subDays, subMonths, startOfMonth, startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns';

export type TimeRange = '7days' | '15days' | '30days' | '3months' | 'custom';

export function filterTransactionsByRange(transactions: any[], range: TimeRange, customRange?: { start: Date; end: Date }) {
    if (!Array.isArray(transactions)) {
        console.error('[dateHelpers] transactions is not an array:', transactions);
        return [];
    }

    const now = new Date();
    let startDate: Date;
    let endDate = endOfDay(now);

    switch (range) {
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
                startDate = startOfMonth(now);
            }
            break;
        default:
            startDate = startOfDay(subDays(now, 30));
    }

    return transactions.filter(t => {
        if (!t || !t.date) return false;
        try {
            const txDate = parseISO(t.date);
            return isWithinInterval(txDate, { start: startDate, end: endDate });
        } catch (e) {
            console.error('[dateHelpers] Error parsing date:', t.date, e);
            return false;
        }
    });
}

export function getCurrentDayOfMonth() {
    return new Date().getDate();
}

export function monthsBetween(date1: Date, date2: Date) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    let months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth();
    months += d2.getMonth();
    return months <= 0 ? 0 : months;
}

export function formatDateRange(range: TimeRange, customRange?: { start: Date; end: Date }) {
    const now = new Date();
    let start: Date;
    let end = now;

    switch (range) {
        case '7days':
            start = subDays(now, 7);
            break;
        case '15days':
            start = subDays(now, 15);
            break;
        case '30days':
            start = subDays(now, 30);
            break;
        case '3months':
            start = subMonths(now, 3);
            break;
        case 'custom':
            if (customRange) {
                start = customRange.start;
                end = customRange.end;
            } else {
                start = startOfMonth(now);
            }
            break;
        default:
            start = subDays(now, 30);
    }

    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return `Showing data from ${start.toLocaleDateString('en-IN', options)} - ${end.toLocaleDateString('en-IN', options)}`;
}
