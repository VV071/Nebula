import { useState, useEffect } from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';

interface DisclaimerModalProps {
    onAcknowledge: () => void;
}

export function DisclaimerModal({ onAcknowledge }: DisclaimerModalProps) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [checks, setChecks] = useState({
        notAdvice: false,
        consultPro: false,
        researchOnly: false
    });

    useEffect(() => {
        const hasAcknowledged = localStorage.getItem('market_insights_acknowledged');
        if (!hasAcknowledged) {
            setIsOpen(true);
        } else {
            onAcknowledge();
        }
    }, []);

    const handleCheck = (key: keyof typeof checks) => {
        setChecks(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const canProceed = Object.values(checks).every(Boolean);

    const handleConfirm = () => {
        if (!canProceed) return;
        localStorage.setItem('market_insights_acknowledged', 'true');
        setIsOpen(false);
        onAcknowledge();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-surface-light dark:bg-surface-dark w-full max-w-lg rounded-2xl shadow-2xl p-6 md:p-8 border border-light dark:border-dark animate-scale-in">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mb-4">
                        <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-textPrimary-light dark:text-textPrimary-dark">
                        {t('disclaimer.title')}
                    </h2>
                    <p className="text-textSecondary-light dark:text-textSecondary-dark mt-2">
                        {t('disclaimer.intro')}
                    </p>
                </div>

                <div className="space-y-4 mb-8 bg-surfaceHover-light dark:bg-surfaceHover-dark p-4 rounded-xl">
                    <label className="flex items-start gap-4 cursor-pointer">
                        <input
                            type="checkbox"
                            className="mt-1 w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            checked={checks.notAdvice}
                            onChange={() => handleCheck('notAdvice')}
                        />
                        <span className="text-sm text-textPrimary-light dark:text-textPrimary-dark">
                            <Trans i18nKey="disclaimer.notAdvice" components={{ strong: <strong /> }} />
                        </span>
                    </label>

                    <label className="flex items-start gap-4 cursor-pointer">
                        <input
                            type="checkbox"
                            className="mt-1 w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            checked={checks.consultPro}
                            onChange={() => handleCheck('consultPro')}
                        />
                        <span className="text-sm text-textPrimary-light dark:text-textPrimary-dark">
                            {t('disclaimer.consultPro')}
                        </span>
                    </label>

                    <label className="flex items-start gap-4 cursor-pointer">
                        <input
                            type="checkbox"
                            className="mt-1 w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            checked={checks.researchOnly}
                            onChange={() => handleCheck('researchOnly')}
                        />
                        <span className="text-sm text-textPrimary-light dark:text-textPrimary-dark">
                            <Trans i18nKey="disclaimer.researchOnly" components={{ strong: <strong /> }} />
                        </span>
                    </label>
                </div>

                <button
                    onClick={handleConfirm}
                    disabled={!canProceed}
                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${canProceed
                            ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg transform hover:-translate-y-0.5'
                            : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    <ShieldCheck className="w-5 h-5" />
                    {t('disclaimer.button')}
                </button>
            </div>
        </div>
    );
}
