import { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FinanceProvider } from './contexts/FinanceContext';
import { ToastProvider } from './contexts/ToastContext';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Transactions from './pages/Transactions';
import Insights from './pages/Insights';
import Profile from './pages/Profile';
import Goals from './pages/Goals';
import Budgets from './pages/Budgets';
import ApiTest from './pages/ApiTest';
import MarketInsights from './pages/MarketInsights';
import LendTracker from './pages/LendTracker';
import StockPrediction from './pages/StockPrediction';
import BiddingArena from './pages/BiddingArena';
import SmeAdvisor from './pages/SmeAdvisor';
import Navigation from './components/Navigation';
import LoadingSpinner from './components/LoadingSpinner';
import SplashScreen from './components/SplashScreen';

export type Page = 'dashboard' | 'accounts' | 'transactions' | 'insights' | 'profile' | 'goals' | 'budgets' | 'apiTest' | 'market-insights' | 'lends' | 'stock-prediction' | 'bidding' | 'sme-advisor';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [showSplash, setShowSplash] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  if (showSplash) {
    return <SplashScreen onDone={() => setShowSplash(false)} />;
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <AuthPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'accounts':
        return <Accounts />;
      case 'transactions':
        return <Transactions />;
      case 'insights':
        return <Insights />;
      case 'profile':
        return <Profile />;
      case 'goals':
        return <Goals />;
      case 'budgets':
        return <Budgets />;
      case 'apiTest':
        return <ApiTest />;
      case 'market-insights':
        return <MarketInsights onNavigate={setCurrentPage} />;
      case 'lends':
        return <LendTracker />;
      case 'stock-prediction':
        return <StockPrediction />;
      case 'bidding':
        return <BiddingArena />;
      case 'sme-advisor':
        return <SmeAdvisor />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <FinanceProvider>
      <div className="min-h-screen">
        <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
        <main className="lg:ml-64" style={{ perspective: '1200px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 32, scale: 0.97, filter: 'blur(4px)' }}
              animate={shouldReduceMotion
                ? { opacity: 1 }
                : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -16, scale: 0.98, filter: 'blur(2px)' }}
              transition={shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.38, ease: [0.34, 1.2, 0.64, 1] }}
              style={{ transformOrigin: 'center top', transformStyle: 'preserve-3d' }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </FinanceProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
