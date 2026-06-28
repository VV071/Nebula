import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { TimeRange } from '../utils/dateHelpers';

interface TimeRangeSelectorProps {
    selectedRange: TimeRange;
    onRangeChange: (range: TimeRange) => void;
    customRange?: { start: Date; end: Date };
    onCustomRangeChange?: (start: Date, end: Date) => void;
}

const ranges: { label: string; value: TimeRange }[] = [
    { label: 'Last 7 Days', value: '7days' },
    { label: 'Last 15 Days', value: '15days' },
    { label: 'Last 30 Days', value: '30days' },
    { label: 'Last 3 Months', value: '3months' },
    { label: 'Custom Range', value: 'custom' },
];

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
    selectedRange,
    onRangeChange,
    customRange,
    onCustomRangeChange,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const selectedLabel = ranges.find(r => r.value === selectedRange)?.label || 'Last 30 Days';

    return (
        <div className="relative inline-block text-left">
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-textSecondary-light dark:text-textSecondary-dark">
                    Time Period
                </label>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="inline-flex items-center justify-between w-48 px-4 py-2.5 text-sm font-semibold text-textPrimary-light dark:text-textPrimary-dark bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-surfaceHover-dark transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary-500" />
                        {selectedLabel}
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    ></div>
                    <div className="absolute left-0 mt-2 z-20 w-56 origin-top-left bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1">
                        <div className="py-1">
                            {ranges.map((range) => (
                                <button
                                    key={range.value}
                                    onClick={() => {
                                        onRangeChange(range.value);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-3 text-sm transition-colors ${selectedRange === range.value
                                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-bold'
                                            : 'text-textPrimary-light dark:text-textPrimary-dark hover:bg-gray-50 dark:hover:bg-surfaceHover-dark'
                                        }`}
                                >
                                    {range.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {selectedRange === 'custom' && (
                <div className="mt-4 flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-left-1">
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-textSecondary-light dark:text-textSecondary-dark mb-1">
                            Start Date
                        </label>
                        <input
                            type="date"
                            className="w-full px-3 py-2 text-sm bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:text-textPrimary-dark"
                            value={customRange?.start.toISOString().split('T')[0] || ''}
                            onChange={(e) => onCustomRangeChange?.(new Date(e.target.value), customRange?.end || new Date())}
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-textSecondary-light dark:text-textSecondary-dark mb-1">
                            End Date
                        </label>
                        <input
                            type="date"
                            className="w-full px-3 py-2 text-sm bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:text-textPrimary-dark"
                            value={customRange?.end.toISOString().split('T')[0] || ''}
                            onChange={(e) => onCustomRangeChange?.(customRange?.start || new Date(), new Date(e.target.value))}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
