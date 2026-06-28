import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

interface ExportModalProps {
    onClose: () => void;
}

type TimeRange = '7d' | '15d' | '30d' | '3m' | '6m';

export default function ExportModal({ onClose }: ExportModalProps) {
    const { t } = useTranslation();
    const [range, setRange] = useState<TimeRange>('30d');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const ranges: { value: TimeRange; label: string }[] = [
        { value: '7d', label: 'Last 7 Days' },
        { value: '15d', label: 'Last 15 Days' },
        { value: '30d', label: 'Last 30 Days' },
        { value: '3m', label: 'Last 3 Months' },
        { value: '6m', label: 'Last 6 Months' },
    ];

    const handleExport = async () => {
        setLoading(true);
        setError(null);
        try {
            const blob = await api.exportData(range);

            if (blob.size === 0) {
                setError('No data available for the selected range.');
                setLoading(false);
                return;
            }

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            // Filename logic: Backend sets header, but simple fallback here
            const dateStr = new Date().toISOString().split('T')[0];
            link.setAttribute('download', `NebulaFinance_Report_${dateStr}.xlsx`);
            document.body.appendChild(link);
            link.click();

            // Cleanup
            link.remove();
            window.URL.revokeObjectURL(url);

            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 2000); // Close after showing success briefly

        } catch (err: any) {
            console.error('Export failed:', err);
            // Clean up error message for display
            const message = err.message || 'Failed to export data. Please try again.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md bg-surface-light dark:bg-surface-dark rounded-2xl shadow-level-3 p-6 animate-scale-in">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-textPrimary-light dark:text-textPrimary-dark">
                        {t('profile.exportData')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-surfaceHover-light dark:hover:bg-surfaceHover-dark transition-colors"
                    >
                        <X className="w-5 h-5 text-textSecondary-light dark:text-textSecondary-dark" />
                    </button>
                </div>

                {!success ? (
                    <>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-textSecondary-light dark:text-textSecondary-dark mb-3">
                                Select Time Range
                            </label>
                            <div className="space-y-2">
                                {ranges.map((option) => (
                                    <label
                                        key={option.value}
                                        className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${range === option.value
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                            : 'border-light dark:border-dark hover:border-primary-200 dark:hover:border-primary-800'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="exportRange"
                                            value={option.value}
                                            checked={range === option.value}
                                            onChange={() => setRange(option.value)}
                                            className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                                        />
                                        <span className="ml-3 font-medium text-textPrimary-light dark:text-textPrimary-dark">
                                            {option.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-3 rounded-xl font-medium border border-light dark:border-dark text-textSecondary-light dark:text-textSecondary-dark hover:bg-surfaceHover-light dark:hover:bg-surfaceHover-dark transition-colors"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleExport}
                                disabled={loading}
                                className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-level-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-5 h-5" />
                                        <span>Export Excel</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold text-textPrimary-light dark:text-textPrimary-dark mb-2">
                            Export Complete!
                        </h3>
                        <p className="text-textSecondary-light dark:text-textSecondary-dark mb-6">
                            Your report has been downloaded successfully.
                        </p>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 rounded-xl font-bold text-white bg-primary-600 hover:bg-primary-700"
                        >
                            Done
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
