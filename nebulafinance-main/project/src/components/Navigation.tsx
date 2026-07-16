import { useTranslation } from 'react-i18next';
import { Home, Wallet, List, Lightbulb, User, Sun, Moon, Monitor, LogOut, Globe, Target, TrendingUp, Banknote, Sparkles, BarChart2, Swords, Building2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import type { Page } from '../App';

interface NavigationProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
  { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'മലയാളം', flag: '🇮🇳' },
];

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { signOut } = useAuth();
  const [showLangMenu, setShowLangMenu] = useState(false);

  const menuItems = [
    { id: 'dashboard' as Page, icon: Home, label: t('nav.dashboard') },
    { id: 'sme-advisor' as Page, icon: Building2, label: 'SME Advisor', beta: true },
    { id: 'market-insights' as Page, icon: TrendingUp, label: t('market.title'), beta: true },
    { id: 'stock-prediction' as Page, icon: BarChart2, label: 'Stock Prediction', beta: true },
    { id: 'bidding' as Page, icon: Swords, label: 'Bidding Arena', beta: true },
    { id: 'lends' as Page, icon: Banknote, label: t('nav.lends', 'Lend Tracker') },
    { id: 'accounts' as Page, icon: Wallet, label: t('nav.accounts') },
    { id: 'transactions' as Page, icon: List, label: t('nav.transactions') },
    { id: 'insights' as Page, icon: Lightbulb, label: t('nav.insights') },
    { id: 'goals' as Page, icon: Target, label: t('nav.goals') },
    { id: 'profile' as Page, icon: User, label: t('nav.profile') },
  ];

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'auto'> = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(theme);
    setTheme(themes[(currentIndex + 1) % themes.length]);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return <Sun className="w-4 h-4" />;
      case 'dark': return <Moon className="w-4 h-4" />;
      case 'auto': return <Monitor className="w-4 h-4" />;
    }
  };

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <nav className="hidden lg:flex fixed top-0 left-0 h-screen w-64 flex-col z-30 nav-glass">

        {/* Logo */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3">
            {/* Animated logo orb */}
            <div className="relative w-10 h-10 flex-shrink-0">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 opacity-90" />
              <div className="absolute inset-0 rounded-xl animate-pulse-glow opacity-40 bg-gradient-to-br from-indigo-400 to-violet-500" />
              <div className="relative w-full h-full rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-textPrimary-light dark:text-textPrimary-dark tracking-tight">
                {t('app.name')}
              </h1>
              <p className="text-[10px] font-medium uppercase tracking-widest text-primary-500 dark:text-primary-400 opacity-80">
                {t('app.tagline')}
              </p>
            </div>
          </div>

          {/* Stitch divider */}
          <div className="mt-5 h-px" style={{
            background: 'repeating-linear-gradient(90deg, rgba(99,102,241,0.2) 0px, rgba(99,102,241,0.2) 6px, transparent 6px, transparent 10px)'
          }} />
        </div>

        {/* Nav items */}
        <div className="flex-1 px-3 pb-2 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-button transition-all duration-200 group relative overflow-hidden ${
                  isActive
                    ? 'text-white'
                    : 'text-textSecondary-light dark:text-textSecondary-dark hover:text-textPrimary-light dark:hover:text-textPrimary-dark'
                }`}
                style={isActive ? {
                  background: 'linear-gradient(135deg, #6366F1 0%, #7C3AED 100%)',
                  boxShadow: '0 4px 16px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.15)',
                } : {
                  background: 'transparent',
                }}
              >
                {/* Active stitch border */}
                {isActive && (
                  <span
                    className="absolute inset-[3px] rounded-[9px] pointer-events-none"
                    style={{ border: '1.5px dashed rgba(255,255,255,0.25)', borderRadius: '9px' }}
                  />
                )}

                {/* Hover background */}
                {!isActive && (
                  <span className="absolute inset-0 rounded-button bg-primary-500/0 group-hover:bg-primary-500/6 dark:group-hover:bg-primary-400/8 transition-colors duration-200" />
                )}

                <Icon className={`w-4.5 h-4.5 flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} style={{ width: '1.1rem', height: '1.1rem' }} />
                <span className="font-medium text-sm">{item.label}</span>

                {item.beta && (
                  <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
                    style={{
                      background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(99,102,241,0.1)',
                      color: isActive ? 'white' : '#6366F1',
                      border: isActive ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(99,102,241,0.2)',
                    }}
                  >
                    Beta
                  </span>
                )}

                {/* Active indicator dot */}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom controls */}
        <div className="p-3 space-y-0.5">
          {/* Stitch divider */}
          <div className="mb-3 h-px" style={{
            background: 'repeating-linear-gradient(90deg, rgba(99,102,241,0.15) 0px, rgba(99,102,241,0.15) 6px, transparent 6px, transparent 10px)'
          }} />

          {/* Language */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-button text-textSecondary-light dark:text-textSecondary-dark hover:text-textPrimary-light dark:hover:text-textPrimary-dark hover:bg-primary-500/6 dark:hover:bg-primary-400/8 transition-all text-sm"
            >
              <Globe className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium flex-1 text-left">{currentLang.flag} {currentLang.name}</span>
            </button>
            {showLangMenu && (
              <div
                className="absolute bottom-full left-0 right-0 mb-2 rounded-card overflow-hidden z-50"
                style={{
                  background: 'rgba(255,255,255,0.92)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(99,102,241,0.15)',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
                }}
              >
                <div
                  className="dark:hidden"
                  style={{ background: 'rgba(255,255,255,0.95)' }}
                />
                <div className="hidden dark:block absolute inset-0 rounded-card"
                  style={{
                    background: 'rgba(6,6,9,0.92)',
                    border: '1px solid rgba(129,140,248,0.12)',
                  }}
                />
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      i18n.changeLanguage(lang.code);
                      localStorage.setItem('language', lang.code);
                      setShowLangMenu(false);
                    }}
                    className={`relative z-10 w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                      i18n.language === lang.code
                        ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 font-semibold'
                        : 'text-textSecondary-light dark:text-textSecondary-dark hover:bg-primary-500/6'
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                    {i18n.language === lang.code && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme */}
          <button
            onClick={cycleTheme}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-button text-textSecondary-light dark:text-textSecondary-dark hover:text-textPrimary-light dark:hover:text-textPrimary-dark hover:bg-primary-500/6 dark:hover:bg-primary-400/8 transition-all text-sm"
          >
            {getThemeIcon()}
            <span className="font-medium capitalize">{theme} mode</span>
          </button>

          {/* Sign out */}
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-button text-rose-500 dark:text-rose-400 hover:bg-rose-500/8 transition-all text-sm"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </nav>

      {/* ── MOBILE TOP BAR ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30"
        style={{
          background: 'rgba(240,242,255,0.88)',
          backdropFilter: 'blur(24px) saturate(180%)',
          borderBottom: '1px solid rgba(99,102,241,0.12)',
          boxShadow: '0 2px 16px rgba(99,102,241,0.08)',
        }}
      >
        <div className="dark:hidden absolute inset-0" style={{ background: 'rgba(240,242,255,0.88)' }} />
        <div className="hidden dark:block absolute inset-0"
          style={{ background: 'rgba(6,6,9,0.9)', borderBottom: '1px solid rgba(129,140,248,0.1)' }}
        />
        <div className="relative flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366F1 0%, #7C3AED 100%)' }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-base font-bold text-textPrimary-light dark:text-textPrimary-dark">
              {t('app.name')}
            </h1>
          </div>
          <button
            onClick={cycleTheme}
            className="p-2 rounded-button text-textSecondary-light dark:text-textSecondary-dark hover:bg-primary-500/8 transition-all"
          >
            {getThemeIcon()}
          </button>
        </div>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 safe-bottom"
        style={{
          background: 'rgba(240,242,255,0.9)',
          backdropFilter: 'blur(24px) saturate(180%)',
          borderTop: '1px solid rgba(99,102,241,0.12)',
          boxShadow: '0 -4px 20px rgba(99,102,241,0.08)',
        }}
      >
        <div className="hidden dark:block absolute inset-0"
          style={{ background: 'rgba(6,6,9,0.92)', borderTop: '1px solid rgba(129,140,248,0.1)' }}
        />
        <div className="relative flex items-center justify-around px-1 py-2">
          {menuItems.slice(0, 6).map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-button transition-all duration-200 ${
                  isActive
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-textSecondary-light dark:text-textSecondary-dark'
                }`}
              >
                <div className={`relative p-1.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary-500/10 dark:bg-primary-400/10'
                    : ''
                }`}>
                  <Icon className="w-5 h-5" />
                  {isActive && (
                    <span className="absolute inset-[2px] rounded-md pointer-events-none"
                      style={{ border: '1px dashed rgba(99,102,241,0.3)' }}
                    />
                  )}
                </div>
                <span className={`text-[10px] font-semibold ${isActive ? 'text-primary-600 dark:text-primary-400' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
