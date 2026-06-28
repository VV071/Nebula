import { motion } from 'framer-motion';

interface Tab {
    id: string;
    label: string;
}

interface CouncilTabsProps {
    tabs: Tab[];
    activeTab: string;
    onChange: (id: string) => void;
}

export function CouncilTabs({ tabs, activeTab, onChange }: CouncilTabsProps) {
    return (
        <div className="flex gap-6 border-b border-border-light dark:border-border-dark mb-6">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={`relative pb-3 text-sm font-medium transition-colors ${activeTab === tab.id
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-textSecondary-light dark:text-textSecondary-dark hover:text-textPrimary-light dark:hover:text-textPrimary-dark'
                        }`}
                >
                    {tab.label}
                    {activeTab === tab.id && (
                        <motion.div
                            layoutId="council-tab-indicator"
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400"
                            initial={false}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                    )}
                </button>
            ))}
        </div>
    );
}
