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
import LendTracker from './pages/LendTracker';
import StockPrediction from './pages/StockPrediction';
import BiddingArena from './pages/BiddingArena';
import SmeAdvisor from './pages/SmeAdvisor';
import Navigation from './components/Navigation';
import LoadingSpinner from './components/LoadingSpinner';
import SplashScreen from './components/SplashScreen';

<<<<<<< HEAD
export type Page = 'dashboard' | 'accounts' | 'transactions' | 'insights' | 'profile' | 'goals' | 'budgets' | 'apiTest' | 'market-insights' | 'lends' | 'stock-prediction' | 'bidding' | 'sme-advisor';
=======
export type Page = 'dashboard' | 'accounts' | 'transactions' | 'insights' | 'profile' | 'goals' | 'budgets' | 'apiTest' | 'lends' | 'stock-prediction' | 'bidding';
>>>>>>> f6bdc775c800de3d71cad57840add80a0c743ccc

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
        <main className="lg:ml-64" style={{ perspective: '1400px', perspectiveOrigin: '50% 20%' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 44, z: -120, rotateX: -7, scale: 0.96, filter: 'blur(8px)' }}
              animate={shouldReduceMotion
                ? { opacity: 1 }
                : { opacity: 1, y: 0, z: 0, rotateX: 0, scale: 1, filter: 'blur(0px)' }}
              exit={shouldReduceMotion
                ? { opacity: 0 }
                : {
                    opacity: 0, y: -24, z: 60, rotateX: 4, scale: 1.015, filter: 'blur(4px)',
                    transition: { duration: 0.26, ease: [0.4, 0, 1, 1] },
                  }}
              transition={shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
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
