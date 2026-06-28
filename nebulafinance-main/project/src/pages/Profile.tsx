import { useTranslation } from 'react-i18next';
import { LogOut, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import ExportModal from '../components/ExportModal';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
  { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'മലയാളം', flag: '🇮🇳' },
];

export default function Profile() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();

  const [autoImportEnabled, setAutoImportEnabled] = useState(() => {
    const saved = localStorage.getItem('autoImportEnabled');
    return saved === null ? true : JSON.parse(saved);
  });

  const handleToggleAutoImport = () => {
    const newValue = !autoImportEnabled;
    setAutoImportEnabled(newValue);
    localStorage.setItem('autoImportEnabled', JSON.stringify(newValue));
  };

  const [showExportModal, setShowExportModal] = useState(false);

  return (
    <div className="page-wrapper">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-fluid-3xl font-bold text-textPrimary-light dark:text-textPrimary-dark mb-6">
          {t('profile.title')}
        </h1>

        <div className="glass-card p-8 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-2xl font-bold">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-textPrimary-light dark:text-textPrimary-dark">
                {user?.email}
              </h2>
              <p className="text-textSecondary-light dark:text-textSecondary-dark">
                {t('profile.memberSince')} {new Date(user?.created_at || Date.now()).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-8 mb-6">
          <h3 className="text-xl font-bold text-textPrimary-light dark:text-textPrimary-dark mb-6">
            {t('profile.preferences')}
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark mb-3">
                {t('profile.language')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      i18n.changeLanguage(lang.code);
                      localStorage.setItem('language', lang.code);
                    }}
                    className={`p-4 rounded-button border-2 transition-all ${i18n.language === lang.code
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-light dark:border-dark hover:border-primary-300 dark:hover:border-primary-700'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{lang.flag}</span>
                      <span className="font-medium text-textPrimary-light dark:text-textPrimary-dark">
                        {lang.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark mb-3">
                {t('profile.theme')}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['light', 'dark', 'auto'] as const).map((themeOption) => (
                  <button
                    key={themeOption}
                    onClick={() => setTheme(themeOption)}
                    className={`p-4 rounded-button border-2 transition-all ${theme === themeOption
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-light dark:border-dark hover:border-primary-300 dark:hover:border-primary-700'
                      }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {themeOption === 'light' && <Sun className="w-6 h-6" />}
                      {themeOption === 'dark' && <Moon className="w-6 h-6" />}
                      {themeOption === 'auto' && <Monitor className="w-6 h-6" />}
                      <span className="text-sm font-medium text-textPrimary-light dark:text-textPrimary-dark capitalize">
                        {t(`profile.${themeOption}`)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-light dark:border-dark">
              <label className="block text-sm font-bold text-textPrimary-light dark:text-textPrimary-dark mb-4 text-primary-500 uppercase tracking-wider">
                AI & Automation
              </label>
              <div className="flex items-center justify-between p-5 rounded-2xl border border-light dark:border-dark bg-gray-50 dark:bg-gray-900/50 shadow-sm">
                <div>
                  <h4 className="font-bold text-textPrimary-light dark:text-textPrimary-dark">SMS Auto-Import</h4>
                  <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark mt-1">
                    Automatically detect and suggest transactions from banking SMS.
                  </p>
                </div>
                <button
                  onClick={handleToggleAutoImport}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${autoImportEnabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-700'
                    }`}
                >
                  <span
                    className={`${autoImportEnabled ? 'translate-x-6' : 'translate-x-1'
                      } inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform`}
                  />
                </button>
              </div>
              {autoImportEnabled && (
                <div className="mt-4 p-4 rounded-xl bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800 flex gap-3">
                  <Monitor className="w-5 h-5 text-primary-500 flex-shrink-0" />
                  <p className="text-xs text-primary-700 dark:text-primary-300 leading-relaxed">
                    Detected transactions will appear in the <span className="font-bold">"Pending Approval"</span> section on your Dashboard. You must review and approve them manually.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="glass-card p-8">
          <h3 className="text-xl font-bold text-textPrimary-light dark:text-textPrimary-dark mb-6">
            {t('profile.dataManagement')}
          </h3>
          <div className="space-y-3">
            <button
              className="btn-outline w-full"
              onClick={() => setShowExportModal(true)}
            >
              {t('profile.exportData')}
            </button>
            <button
              onClick={() => signOut()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-button font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-textSecondary-light dark:text-textSecondary-dark">
          <p>{t('app.name')} v1.0.0</p>
        </div>
      </div>

      {showExportModal && (
        <ExportModal onClose={() => setShowExportModal(false)} />
      )}
    </div>
  );
}
