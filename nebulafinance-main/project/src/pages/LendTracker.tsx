import { useState, useEffect } from 'react';
import { 
  Plus, X, Calendar, Wallet, Send, Trash2, 
  CheckCircle, MessageSquare, Clock, ArrowUpRight, 
  Check, FileText, Smartphone, Search, AlertTriangle, ShieldCheck, Banknote
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../contexts/ToastContext';

// --- Type Definitions ---
export type ReminderType = 'DAILY' | 'WEEKLY' | 'EXACT_DATE' | 'CUSTOM';

export interface ReminderConfig {
  type: ReminderType;
  startDate: string;
  exactDate?: string;
  intervalDays?: number;
  isActive: boolean;
}

export interface ReminderLog {
  sentAt: string;
  type: 'manual' | 'auto';
  note?: string;
}

export interface LendEntry {
  id: string;
  contactName: string;
  contactPhone: string;
  amountLent: number;
  lendDate: string;
  repaidDate?: string;
  isRepaid: boolean;
  notes?: string;
  reminder: ReminderConfig;
  reminderHistory: ReminderLog[];
}

export interface TrustScore {
  contactPhone: string;
  contactName: string;
  totalLends: number;
  repaidOnTime: number;
  repaidLate: number;
  neverRepaid: number;
  scorePercent: number;
  scoreLabel: string;
  scoreColor: string;
}

// --- Mock SMS Templates to simulate payment parsing ---
const MOCK_SMS_LOGS = [
  { id: 'sms-1', sender: 'GPAY-HDFC', text: 'Sent Rs. 1,500 to Amit Sharma on 20-06-2026. Ref UPI: 384029482', parsedAmount: 1500, contactHint: 'Amit Sharma' },
  { id: 'sms-2', sender: 'PAYTM-ICICI', text: 'Paid ₹2,500 to Priya Nair at UPI ID priya@okaxis', parsedAmount: 2500, contactHint: 'Priya Nair' },
  { id: 'sms-3', sender: 'AXIS-BANK', text: 'Your account has been debited with ₹500 for transfer to John Doe.', parsedAmount: 500, contactHint: 'John Doe' },
  { id: 'sms-4', sender: 'SBI-UPI', text: 'Transaction successful: Transferred INR 4,000 to Suresh Kumar.', parsedAmount: 4000, contactHint: 'Suresh Kumar' }
];

export default function LendTracker() {
  const { t } = useTranslation();
  const { showToast } = useToast();

  // --- States ---
  const [entries, setEntries] = useState<LendEntry[]>(() => {
    const saved = localStorage.getItem('nebula_lend_entries');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'repaid' | 'overdue'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal / Detail States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSmsPanel, setShowSmsPanel] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LendEntry | null>(null);
  const [showNudgeModal, setShowNudgeModal] = useState<LendEntry | null>(null);

  // New Form Fields
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [amountLent, setAmountLent] = useState('');
  const [lendDate, setLendDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  
  // New Form Reminder Config
  const [reminderType, setReminderType] = useState<ReminderType>('DAILY');
  const [reminderStartDate, setReminderStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [reminderExactDate, setReminderExactDate] = useState('');
  const [reminderIntervalDays, setReminderIntervalDays] = useState('7');
  const [reminderIsActive, setReminderIsActive] = useState(true);

  // Manual SMS pasting parse simulator
  const [customSmsInput, setCustomSmsInput] = useState('');
  const [parseStatus, setParseStatus] = useState<'idle' | 'success' | 'fail'>('idle');

  // Persistence
  useEffect(() => {
    localStorage.setItem('nebula_lend_entries', JSON.stringify(entries));
  }, [entries]);

  // --- Computed Stats ---
  const totalLent = entries.reduce((sum, e) => sum + e.amountLent, 0);
  const totalRecovered = entries.filter(e => e.isRepaid).reduce((sum, e) => sum + e.amountLent, 0);
  const totalPending = entries.filter(e => !e.isRepaid).reduce((sum, e) => sum + e.amountLent, 0);
  const activeLendCount = entries.filter(e => !e.isRepaid).length;

  // --- Trust Score Engine ---
  const getTrustScore = (phone: string, name: string): TrustScore => {
    const contactEntries = entries.filter(e => e.contactPhone === phone);
    const totalLends = contactEntries.length;
    let repaidOnTime = 0;
    let repaidLate = 0;
    let neverRepaid = 0;

    contactEntries.forEach(entry => {
      if (!entry.isRepaid) {
        neverRepaid++;
      } else if (entry.repaidDate) {
        const daysToRepay = Math.floor((new Date(entry.repaidDate).getTime() - new Date(entry.lendDate).getTime()) / (1000 * 3600 * 24));
        if (daysToRepay <= 30) {
          repaidOnTime++;
        } else {
          repaidLate++;
        }
      }
    });

    const scorePercent = totalLends > 0 
      ? Math.round(((repaidOnTime * 100 + repaidLate * 50) / (totalLends * 100)) * 100) 
      : 100;

    let scoreLabel = 'New Contact';
    let scoreColor = '#6b7280'; // Slate grey

    if (totalLends > 0) {
      if (scorePercent >= 90) {
        scoreLabel = 'Highly Reliable';
        scoreColor = '#10B981'; // Emerald
      } else if (scorePercent >= 70) {
        scoreLabel = 'Usually Pays';
        scoreColor = '#6366F1'; // Indigo
      } else if (scorePercent >= 50) {
        scoreLabel = 'Often Delays';
        scoreColor = '#F59E0B'; // Amber
      } else {
        scoreLabel = 'Avoid Lending';
        scoreColor = '#EF4444'; // Red
      }
    }

    return {
      contactPhone: phone,
      contactName: name,
      totalLends,
      repaidOnTime,
      repaidLate,
      neverRepaid,
      scorePercent,
      scoreLabel,
      scoreColor
    };
  };

  const getTrustBadgeStyles = (label: string) => {
    switch (label) {
      case 'Highly Reliable':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      case 'Usually Pays':
        return 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20';
      case 'Often Delays':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      case 'Avoid Lending':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20';
    }
  };

  // --- Functions ---
  const handleParseSmsText = (text: string) => {
    const amountRegex = /(?:₹|Rs\.?|INR)\s*([0-9,]+)/i;
    const match = text.match(amountRegex);
    if (match) {
      const amt = parseFloat(match[1].replace(/,/g, ''));
      setAmountLent(amt.toString());
      
      const toMatch = /to\s+([A-Za-z\s]+?)(?:\s+on|\s+via|\s+ref|\.|$)/i;
      const contactMatch = text.match(toMatch);
      if (contactMatch) {
        setContactName(contactMatch[1].trim());
      }
      setParseStatus('success');
    } else {
      setParseStatus('fail');
    }
  };

  const handleCreateLend = () => {
    if (!contactName || !contactPhone || !amountLent || isNaN(Number(amountLent))) {
      alert('Please fill in Contact Name, Phone, and a valid Amount.');
      return;
    }

    const entryId = `lend_${Date.now()}`;
    const newLend: LendEntry = {
      id: entryId,
      contactName,
      contactPhone,
      amountLent: parseFloat(amountLent),
      lendDate,
      isRepaid: false,
      notes,
      reminder: {
        type: reminderType,
        startDate: reminderStartDate,
        exactDate: reminderType === 'EXACT_DATE' ? reminderExactDate : undefined,
        intervalDays: reminderType === 'CUSTOM' ? parseInt(reminderIntervalDays) : undefined,
        isActive: reminderIsActive
      },
      reminderHistory: []
    };

    setEntries(prev => [newLend, ...prev]);
    resetForm();
    setShowAddModal(false);
    showToast('Lend record saved successfully!');
  };

  const resetForm = () => {
    setContactName('');
    setContactPhone('');
    setAmountLent('');
    setLendDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setReminderType('DAILY');
    setReminderStartDate(new Date().toISOString().split('T')[0]);
    setReminderExactDate('');
    setReminderIntervalDays('7');
    setReminderIsActive(true);
    setCustomSmsInput('');
    setParseStatus('idle');
  };

  const handleMarkAsRepaid = (id: string) => {
    setEntries(prev => prev.map(e => {
      if (e.id === id) {
        const updated = {
          ...e,
          isRepaid: true,
          repaidDate: new Date().toISOString().split('T')[0],
          reminder: { ...e.reminder, isActive: false }
        };
        if (selectedEntry && selectedEntry.id === id) {
          setSelectedEntry(updated);
        }
        return updated;
      }
      return e;
    }));
  };

  const handleDeleteLend = (id: string) => {
    if (confirm('Are you sure you want to delete this lend record?')) {
      setEntries(prev => prev.filter(e => e.id !== id));
      setSelectedEntry(null);
    }
  };

  const handleToggleReminderActive = (id: string, active: boolean) => {
    setEntries(prev => prev.map(e => {
      if (e.id === id) {
        const updated = {
          ...e,
          reminder: { ...e.reminder, isActive: active }
        };
        if (selectedEntry && selectedEntry.id === id) {
          setSelectedEntry(updated);
        }
        return updated;
      }
      return e;
    }));
  };

  const logReminderSent = (entry: LendEntry, templateIndex: number) => {
    const log: ReminderLog = {
      sentAt: new Date().toLocaleString(),
      type: 'manual',
      note: `Nudge Template ${templateIndex + 1} sent`
    };

    setEntries(prev => prev.map(e => {
      if (e.id === entry.id) {
        const updated = {
          ...e,
          reminderHistory: [...e.reminderHistory, log]
        };
        if (selectedEntry && selectedEntry.id === entry.id) {
          setSelectedEntry(updated);
        }
        return updated;
      }
      return e;
    }));
  };

  const filteredEntries = entries.filter(e => {
    const matchesSearch = e.contactName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.contactPhone.includes(searchQuery);
    
    if (!matchesSearch) return false;

    const daysElapsed = Math.floor((Date.now() - new Date(e.lendDate).getTime()) / (1000 * 3600 * 24));
    const isOverdue = !e.isRepaid && daysElapsed > 30;

    if (activeFilter === 'active') return !e.isRepaid;
    if (activeFilter === 'repaid') return e.isRepaid;
    if (activeFilter === 'overdue') return isOverdue;
    return true;
  });

  return (
    <div className="page-wrapper transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto">
        
        {/* --- Header Panel --- */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 stagger-item">
          <div>
            <h1 className="text-display font-extrabold text-textPrimary-light dark:text-textPrimary-dark flex items-center gap-2.5">
              <Banknote className="w-8 h-8 text-primary-500 dark:text-primary-400" />
              {t('nav.lends', 'Credit Ledger')}
            </h1>
            <p className="text-fluid-lg text-textSecondary-light dark:text-textSecondary-dark mt-1.5">
              Informal lending manager & trust scorer for Nebula Wallet
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="btn-primary flex items-center gap-2 whitespace-nowrap shadow-glow font-semibold transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            New Lend Record
          </button>
        </div>

        {/* --- Overview Summary Bar --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 lg:mb-12 stagger-item">
          {/* Card 1: Total Lent */}
          <motion.div
            whileHover={{ y: -2 }}
            className="glass-card p-6 border-l-4 border-l-primary-500 flex items-center justify-between transition-all duration-300"
          >
            <div>
              <span className="label-text">Total Lent</span>
              <h3 className="text-2xl font-bold text-textPrimary-light dark:text-textPrimary-dark font-mono mt-1">
                ₹{totalLent.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400 border border-primary-500/10">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </motion.div>

          {/* Card 2: Total Recovered */}
          <motion.div
            whileHover={{ y: -2 }}
            className="glass-card p-6 border-l-4 border-l-secondary-500 flex items-center justify-between transition-all duration-300"
          >
            <div>
              <span className="label-text">Total Recovered</span>
              <h3 className="text-2xl font-bold text-secondary-600 dark:text-secondary-400 font-mono mt-1">
                ₹{totalRecovered.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-secondary-50 dark:bg-secondary-900/20 flex items-center justify-center text-secondary-600 dark:text-secondary-400 border border-secondary-500/10">
              <CheckCircle className="w-6 h-6" />
            </div>
          </motion.div>

          {/* Card 3: Pending Balance */}
          <motion.div
            whileHover={{ y: -2 }}
            className="glass-card p-6 border-l-4 border-l-accent-500 flex items-center justify-between transition-all duration-300"
          >
            <div>
              <span className="label-text">Pending Balance</span>
              <h3 className="text-2xl font-bold text-accent-600 dark:text-accent-400 font-mono mt-1">
                ₹{totalPending.toLocaleString('en-IN')}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-accent-50 dark:bg-accent-900/20 flex items-center justify-center text-accent-600 dark:text-accent-400 border border-accent-500/10">
              <Clock className="w-6 h-6" />
            </div>
          </motion.div>

          {/* Card 4: Active Debts */}
          <motion.div
            whileHover={{ y: -2 }}
            className="glass-card p-6 border-l-4 border-l-indigo-500 flex items-center justify-between transition-all duration-300"
          >
            <div>
              <span className="label-text">Active Debts</span>
              <h3 className="text-2xl font-bold text-textPrimary-light dark:text-textPrimary-dark font-mono mt-1">
                {activeLendCount} Active
              </h3>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-500/10">
              <Wallet className="w-6 h-6" />
            </div>
          </motion.div>
        </div>

        {/* --- Filters & Search --- */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6 stagger-item">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {(['all', 'active', 'repaid', 'overdue'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-4 py-2 rounded-button text-sm font-semibold capitalize border transition-all duration-200 ${
                  activeFilter === tab 
                    ? 'bg-primary-600 text-white border-primary-600 shadow-level-1' 
                    : 'bg-surface-light dark:bg-surface-dark text-textSecondary-light dark:text-textSecondary-dark border-light dark:border-dark hover:bg-surfaceHover-light dark:hover:bg-surfaceHover-dark hover:text-textPrimary-light dark:hover:text-textPrimary-dark'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-textTertiary-light dark:text-textTertiary-dark" />
            <input
              type="text"
              placeholder="Search contact name or number..."
              className="input-field !pl-11 pr-4 py-2.5 transition-all duration-200"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* --- Main Content Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Entries List */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredEntries.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-surface-light dark:bg-surface-dark border border-dashed border-light dark:border-dark p-12 text-center rounded-card-lg flex flex-col items-center justify-center"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                    <FileText className="w-6 h-6 text-textSecondary-light dark:text-textSecondary-dark opacity-70" />
                  </div>
                  <h4 className="text-lg font-bold text-textPrimary-light dark:text-textPrimary-dark">No Lend Records Found</h4>
                  <p className="text-textSecondary-light dark:text-textSecondary-dark mt-2 max-w-sm mx-auto text-sm leading-relaxed">
                    Try clearing your filters or create a new entry using the SMS-assisted onboarder.
                  </p>
                </motion.div>
              ) : (
                filteredEntries.map(entry => {
                  const ts = getTrustScore(entry.contactPhone, entry.contactName);
                  const daysElapsed = Math.floor((Date.now() - new Date(entry.lendDate).getTime()) / (1000 * 3600 * 24));
                  const isOverdue = !entry.isRepaid && daysElapsed > 30;

                  return (
                    <motion.div
                      layout
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => setSelectedEntry(entry)}
                      className={`glass-card hover:shadow-level-2 hover-lift stagger-item p-5 rounded-card cursor-pointer transition-all duration-300 flex items-center justify-between gap-4 relative overflow-hidden group ${
                        entry.isRepaid ? 'border-l-4 border-l-secondary-500' : 
                        isOverdue ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-accent-500'
                      } ${selectedEntry?.id === entry.id ? 'ring-2 ring-primary-500 border-transparent dark:bg-surfaceHover-dark bg-slate-100' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500/20 to-primary-600/10 dark:from-primary-500/10 dark:to-primary-600/5 flex items-center justify-center text-primary-600 dark:text-primary-400 text-base font-extrabold uppercase border border-primary-500/10">
                          {entry.contactName.substring(0, 2)}
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-textPrimary-light dark:text-textPrimary-dark text-base group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                              {entry.contactName}
                            </h4>
                            <span 
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getTrustBadgeStyles(ts.scoreLabel)}`}
                            >
                              {ts.scoreLabel}
                            </span>
                          </div>
                          <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark mt-1 font-medium">{entry.contactPhone}</p>
                          
                          <div className="flex items-center gap-4 mt-2 text-xs text-textTertiary-light dark:text-textTertiary-dark">
                            <span className="flex items-center gap-1.5 font-medium">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(entry.lendDate).toLocaleDateString()}
                            </span>
                            {!entry.isRepaid && (
                              <span className={`font-semibold flex items-center gap-1 ${isOverdue ? 'text-red-500 dark:text-red-400' : 'text-accent-500 dark:text-accent-400'}`}>
                                <Clock className="w-3 h-3" />
                                {daysElapsed} days elapsed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end gap-2.5">
                        <span className={`text-lg font-bold font-mono ${entry.isRepaid ? 'text-textTertiary-light dark:text-textTertiary-dark line-through' : 'text-textPrimary-light dark:text-textPrimary-dark'}`}>
                          ₹{entry.amountLent.toLocaleString('en-IN')}
                        </span>

                        <div className="flex items-center gap-2">
                          {entry.reminder.isActive && (
                            <span className="p-1 rounded bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20" title="Automated reminder active">
                              <Clock className="w-3.5 h-3.5" />
                            </span>
                          )}
                          {!entry.isRepaid ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRepaid(entry.id);
                              }}
                              className="p-1.5 rounded-button bg-secondary-500/10 text-secondary-600 dark:text-secondary-400 border border-secondary-500/20 hover:bg-secondary-600 hover:text-white dark:hover:bg-secondary-500 dark:hover:text-black transition-colors"
                              title="Mark as Repaid"
                            >
                              <Check className="w-4 h-4 stroke-[3]" />
                            </button>
                          ) : (
                            <span className="text-secondary-600 dark:text-secondary-400 text-xs font-bold flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" /> Repaid
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Interactive Inspector / Detail View */}
          <div className="lg:col-span-1">
            <AnimatePresence mode="wait">
              {selectedEntry ? (
                <motion.div
                  key={selectedEntry.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-card p-6 space-y-6 sticky top-24 border border-light dark:border-dark"
                >
                  <div className="flex items-center justify-between border-b border-light dark:border-dark pb-4">
                    <h3 className="font-bold text-lg text-textPrimary-light dark:text-textPrimary-dark">Entry Details</h3>
                    <button 
                      onClick={() => setSelectedEntry(null)}
                      className="p-1 text-textSecondary-light dark:text-textSecondary-dark hover:text-textPrimary-light dark:hover:text-textPrimary-dark rounded-button hover:bg-surfaceHover-light dark:hover:bg-surfaceHover-dark transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500/20 to-primary-600/15 dark:from-primary-500/10 dark:to-primary-600/5 flex items-center justify-center text-primary-600 dark:text-primary-400 text-xl font-bold uppercase border border-primary-500/10">
                      {selectedEntry.contactName.substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-bold text-textPrimary-light dark:text-textPrimary-dark text-lg leading-snug">{selectedEntry.contactName}</h4>
                      <a 
                        href={`tel:${selectedEntry.contactPhone}`} 
                        className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-semibold mt-1 inline-block"
                      >
                        {selectedEntry.contactPhone}
                      </a>
                    </div>
                  </div>

                  <div className="bg-background-light dark:bg-background-dark/50 p-4 rounded-card border border-light dark:border-dark flex items-center justify-between">
                    <div>
                      <span className="text-xs text-textSecondary-light dark:text-textSecondary-dark font-medium">Amount Lent</span>
                      <h5 className="text-xl font-bold text-textPrimary-light dark:text-textPrimary-dark font-mono mt-0.5">₹{selectedEntry.amountLent.toLocaleString('en-IN')}</h5>
                    </div>
                    <div>
                      {selectedEntry.isRepaid ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-secondary-500/10 text-secondary-600 dark:text-secondary-400 border border-secondary-500/20">
                          Settled
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-accent-500/10 text-accent-600 dark:text-accent-400 border border-accent-500/20">
                          Active
                        </span>
                      )}
                    </div>
                  </div>

                  {(() => {
                    const ts = getTrustScore(selectedEntry.contactPhone, selectedEntry.contactName);
                    return (
                      <div className="bg-background-light dark:bg-background-dark/50 p-4 rounded-card border border-light dark:border-dark">
                        <span className="text-xs font-bold text-textSecondary-light dark:text-textSecondary-dark block mb-3 uppercase tracking-wider">Contact Trust Profile</span>
                        <div className="flex items-center gap-4">
                          <div className="relative w-16 h-16 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle cx="32" cy="32" r="28" className="stroke-light dark:stroke-dark" strokeWidth="4" fill="transparent" />
                              <circle 
                                cx="32" 
                                cy="32" 
                                r="28" 
                                stroke={ts.scoreColor} 
                                strokeWidth="4" 
                                fill="transparent" 
                                strokeDasharray="175"
                                strokeDashoffset={175 - (175 * ts.scorePercent) / 100}
                                strokeLinecap="round"
                              />
                            </svg>
                            <span className="absolute text-xs font-bold text-textPrimary-light dark:text-textPrimary-dark font-mono">{ts.scorePercent}%</span>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-textPrimary-light dark:text-textPrimary-dark flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ts.scoreColor }} />
                              {ts.scoreLabel}
                            </div>
                            <p className="text-[10px] text-textSecondary-light dark:text-textSecondary-dark mt-1 font-medium leading-normal">
                              {ts.totalLends} Lends • {ts.repaidOnTime} On-Time • {ts.repaidLate} Late • {ts.neverRepaid} Unpaid
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-textSecondary-light dark:text-textSecondary-dark font-bold uppercase tracking-wider">Reminder Scheduling</span>
                      <button
                        onClick={() => handleToggleReminderActive(selectedEntry.id, !selectedEntry.reminder.isActive)}
                        className={`text-xs px-2.5 py-1 rounded-button font-bold border transition-colors ${
                          selectedEntry.reminder.isActive 
                            ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-500/20' 
                            : 'bg-slate-200 dark:bg-slate-800 text-textSecondary-light dark:text-textSecondary-dark border-light dark:border-dark'
                        }`}
                      >
                        {selectedEntry.reminder.isActive ? 'Active' : 'Paused'}
                      </button>
                    </div>
                    <div className="bg-background-light dark:bg-background-dark/50 p-4 rounded-card border border-light dark:border-dark text-xs space-y-2.5">
                      <div className="flex justify-between">
                        <span className="text-textSecondary-light dark:text-textSecondary-dark font-medium">Type:</span>
                        <span className="text-textPrimary-light dark:text-textPrimary-dark font-bold">{selectedEntry.reminder.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-textSecondary-light dark:text-textSecondary-dark font-medium">Starts:</span>
                        <span className="text-textPrimary-light dark:text-textPrimary-dark font-mono">{selectedEntry.reminder.startDate}</span>
                      </div>
                      {selectedEntry.reminder.type === 'CUSTOM' && (
                        <div className="flex justify-between">
                          <span className="text-textSecondary-light dark:text-textSecondary-dark font-medium">Interval:</span>
                          <span className="text-textPrimary-light dark:text-textPrimary-dark font-semibold">Every {selectedEntry.reminder.intervalDays} days</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => setShowNudgeModal(selectedEntry)}
                      className="btn-ghost border border-light dark:border-dark flex items-center justify-center gap-2 py-3 rounded-button font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4 text-primary-500 dark:text-primary-400" />
                      Send Reminder
                    </button>

                    <button
                      onClick={() => handleDeleteLend(selectedEntry.id)}
                      className="btn border border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/10 flex items-center justify-center gap-2 py-3 rounded-button font-semibold text-sm transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Record
                    </button>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-light dark:border-dark">
                    <span className="text-xs text-textSecondary-light dark:text-textSecondary-dark font-bold uppercase tracking-wider block">Reminder History Logs</span>
                    {selectedEntry.reminderHistory.length === 0 ? (
                      <p className="text-xs text-textTertiary-light dark:text-textTertiary-dark italic">No manual reminders logged yet.</p>
                    ) : (
                      <div className="space-y-4 pl-3 border-l-2 border-light dark:border-dark">
                        {selectedEntry.reminderHistory.map((log, idx) => (
                          <div key={idx} className="relative text-xs">
                            <div className="w-2.5 h-2.5 rounded-full bg-primary-500 absolute -left-[17.5px] top-0.5 ring-4 ring-white dark:ring-surface-dark" />
                            <div className="font-bold text-textPrimary-light dark:text-textPrimary-dark">{log.sentAt}</div>
                            <div className="text-textSecondary-light dark:text-textSecondary-dark mt-1 font-medium">{log.note}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-card p-8 text-center h-80 flex flex-col items-center justify-center sticky top-24 border border-light dark:border-dark"
                >
                  <ShieldCheck className="w-12 h-12 text-primary-500 dark:text-primary-400 mb-3 opacity-80" />
                  <h4 className="text-base font-bold text-textPrimary-light dark:text-textPrimary-dark">Interactive Inspector</h4>
                  <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark max-w-[200px] mt-2 mx-auto leading-relaxed">
                    Select any lend transaction card to view details, configure reminders, and send template nudges.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* --- ADD NEW LEND MODAL (with SMS Onboarding simulator) --- */}
        <AnimatePresence>
          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: "spring", duration: 0.4 }}
                className="bg-surface-light dark:bg-surface-dark border border-light dark:border-dark w-full max-w-2xl rounded-card-lg shadow-level-3 overflow-hidden flex flex-col max-h-[90vh]"
              >
                
                <div className="p-6 border-b border-light dark:border-dark flex justify-between items-center bg-surface-light dark:bg-surface-dark">
                  <div>
                    <h2 className="text-xl font-bold text-textPrimary-light dark:text-textPrimary-dark flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-primary-500 dark:text-primary-400" />
                      Record New Lend
                    </h2>
                    <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark mt-1 font-medium">Configure manually or import from simulated SMS logs</p>
                  </div>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="p-1.5 hover:bg-surfaceHover-light dark:hover:bg-surfaceHover-dark text-textSecondary-light dark:text-textSecondary-dark hover:text-textPrimary-light dark:hover:text-textPrimary-dark rounded-button transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  <div className="bg-background-light dark:bg-background-dark/50 border border-light dark:border-dark rounded-card p-4">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <span className="text-xs font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1.5 uppercase tracking-wider">
                        <Smartphone className="w-4 h-4" />
                        SMS-Assisted Parser
                      </span>
                      <button
                        onClick={() => setShowSmsPanel(!showSmsPanel)}
                        className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-semibold"
                      >
                        {showSmsPanel ? 'Hide Logs' : 'Show Simulated SMS Inbox'}
                      </button>
                    </div>

                    <AnimatePresence>
                      {showSmsPanel && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-1"
                        >
                          {MOCK_SMS_LOGS.map(sms => (
                            <div 
                              key={sms.id}
                              onClick={() => {
                                setContactName(sms.contactHint);
                                setAmountLent(sms.parsedAmount.toString());
                                setParseStatus('success');
                              }}
                              className="bg-surface-light dark:bg-surface-dark hover:bg-slate-50 dark:hover:bg-slate-800 p-3 rounded-card-sm border border-light dark:border-dark cursor-pointer transition-all text-xs"
                            >
                              <div className="flex justify-between font-bold text-textPrimary-light dark:text-textPrimary-dark">
                                <span>{sms.sender}</span>
                                <span className="text-primary-600 dark:text-primary-400 font-mono">₹{sms.parsedAmount}</span>
                              </div>
                              <p className="text-textSecondary-light dark:text-textSecondary-dark mt-1.5 italic">"{sms.text}"</p>
                              <span className="text-[10px] text-textTertiary-light dark:text-textTertiary-dark mt-2 block font-semibold">Tap to auto-fill form</span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-2">
                      <span className="text-xs text-textSecondary-light dark:text-textSecondary-dark font-semibold">Or paste SMS content to parse:</span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Paid Rs. 1500 to Suresh"
                          className="flex-1 input-field text-xs transition-all duration-200"
                          value={customSmsInput}
                          onChange={e => setCustomSmsInput(e.target.value)}
                        />
                        <button
                          onClick={() => handleParseSmsText(customSmsInput)}
                          className="btn-ghost border border-light dark:border-dark px-4 py-2 text-xs font-bold rounded-button transition-colors"
                        >
                          Parse Amount
                        </button>
                      </div>
                      {parseStatus === 'success' && (
                        <p className="text-xs text-secondary-600 dark:text-secondary-400 flex items-center gap-1.5 font-semibold mt-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Amount successfully parsed and filled!
                        </p>
                      )}
                      {parseStatus === 'fail' && (
                        <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1.5 font-semibold mt-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> No amount found. Use manual configuration below.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-textSecondary-light dark:text-textSecondary-dark uppercase tracking-wider">Manual Configuration</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-textSecondary-light dark:text-textSecondary-dark mb-1.5">Contact Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Amit Sharma"
                          className="input-field text-sm transition-all duration-200"
                          value={contactName}
                          onChange={e => setContactName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-textSecondary-light dark:text-textSecondary-dark mb-1.5">Contact Phone</label>
                        <input
                          type="text"
                          placeholder="e.g. +91 9876543210"
                          className="input-field text-sm transition-all duration-200"
                          value={contactPhone}
                          onChange={e => setContactPhone(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-textSecondary-light dark:text-textSecondary-dark mb-1.5">Amount Lent (₹)</label>
                        <input
                          type="number"
                          placeholder="0"
                          className="input-field text-sm transition-all duration-200 font-mono"
                          value={amountLent}
                          onChange={e => setAmountLent(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-textSecondary-light dark:text-textSecondary-dark mb-1.5">Lend Date</label>
                        <input
                          type="date"
                          className="input-field text-sm transition-all duration-200 font-mono"
                          value={lendDate}
                          onChange={e => setLendDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-textSecondary-light dark:text-textSecondary-dark mb-1.5">Notes (Optional)</label>
                      <textarea
                        placeholder="Add any specific context or agreement details..."
                        className="w-full input-field text-sm transition-all duration-200 h-20 resize-none"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-light dark:border-dark">
                    <h4 className="text-xs font-bold text-textSecondary-light dark:text-textSecondary-dark uppercase tracking-wider">Smart Reminder Settings</h4>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {(['DAILY', 'WEEKLY', 'EXACT_DATE', 'CUSTOM'] as ReminderType[]).map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setReminderType(type)}
                          className={`px-3 py-2.5 rounded-button text-xs font-bold border transition-colors ${
                            reminderType === type 
                              ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-500' 
                              : 'bg-surface-light dark:bg-surface-dark text-textSecondary-light dark:text-textSecondary-dark border-light dark:border-dark'
                          }`}
                        >
                          {type.replace('_', ' ')}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {reminderType === 'EXACT_DATE' && (
                        <div>
                          <label className="block text-xs font-semibold text-textSecondary-light dark:text-textSecondary-dark mb-1.5">Exact Reminder Date</label>
                          <input
                            type="date"
                            className="input-field text-sm font-mono transition-all duration-200"
                            value={reminderExactDate}
                            onChange={e => setReminderExactDate(e.target.value)}
                          />
                        </div>
                      )}

                      {reminderType === 'CUSTOM' && (
                        <div>
                          <label className="block text-xs font-semibold text-textSecondary-light dark:text-textSecondary-dark mb-1.5">Repeat Interval (Days)</label>
                          <input
                            type="number"
                            placeholder="e.g. 15"
                            className="input-field text-sm font-mono transition-all duration-200"
                            value={reminderIntervalDays}
                            onChange={e => setReminderIntervalDays(e.target.value)}
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-textSecondary-light dark:text-textSecondary-dark mb-1.5">Reminder Starts On</label>
                        <input
                          type="date"
                          className="input-field text-sm font-mono transition-all duration-200"
                          value={reminderStartDate}
                          onChange={e => setReminderStartDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-1.5">
                      <input
                        type="checkbox"
                        id="reminderActive"
                        className="w-4 h-4 accent-primary-600 rounded bg-slate-100 border-slate-300 cursor-pointer"
                        checked={reminderIsActive}
                        onChange={e => setReminderIsActive(e.target.checked)}
                      />
                      <label htmlFor="reminderActive" className="text-xs font-semibold text-textSecondary-light dark:text-textSecondary-dark cursor-pointer">
                        Enable automated background notifications
                      </label>
                    </div>
                  </div>

                </div>

                <div className="p-6 border-t border-light dark:border-dark bg-slate-50 dark:bg-slate-900/30 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn-ghost px-5 py-2.5 rounded-button text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateLend}
                    className="btn-primary px-6 py-2.5 rounded-button text-sm font-semibold transition-all duration-300"
                  >
                    Save Entry
                  </button>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* --- FRIENDLY NUDGES MODAL --- */}
        <AnimatePresence>
          {showNudgeModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: "spring", duration: 0.4 }}
                className="bg-surface-light dark:bg-surface-dark border border-light dark:border-dark w-full max-w-lg rounded-card-lg shadow-level-3 overflow-hidden"
              >
                
                <div className="p-6 border-b border-light dark:border-dark flex justify-between items-center bg-surface-light dark:bg-surface-dark">
                  <h3 className="font-bold text-lg text-textPrimary-light dark:text-textPrimary-dark">Friendly Reminder Templates</h3>
                  <button 
                    onClick={() => setShowNudgeModal(null)}
                    className="p-1.5 text-textSecondary-light dark:text-textSecondary-dark hover:text-textPrimary-light dark:hover:text-textPrimary-dark rounded-button hover:bg-surfaceHover-light dark:hover:bg-surfaceHover-dark transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                  {[
                    {
                      title: 'Friendly Nudge (Template 1)',
                      text: `Hey ${showNudgeModal.contactName}! 😊 Just a friendly reminder about the ₹${showNudgeModal.amountLent} I lent you on ${showNudgeModal.lendDate}. No rush, just checking in!`
                    },
                    {
                      title: 'Standard Reminder (Template 2)',
                      text: `Hi ${showNudgeModal.contactName}, wanted to remind you about ₹${showNudgeModal.amountLent} from ${showNudgeModal.lendDate}. Would appreciate it if you could settle this soon. Thanks!`
                    },
                    {
                      title: 'Firm Notice (Template 3)',
                      text: `${showNudgeModal.contactName}, this is a reminder that ₹${showNudgeModal.amountLent} lent on ${showNudgeModal.lendDate} is still pending. Please arrange repayment at the earliest.`
                    }
                  ].map((tmpl, idx) => (
                    <div key={idx} className="bg-background-light dark:bg-background-dark/50 border border-light dark:border-dark p-4 rounded-card space-y-3">
                      <div className="font-bold text-xs text-primary-600 dark:text-primary-400 uppercase tracking-wider">{tmpl.title}</div>
                      <p className="text-xs text-textSecondary-light dark:text-textSecondary-dark italic leading-relaxed">"{tmpl.text}"</p>
                      
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(tmpl.text);
                            logReminderSent(showNudgeModal, idx);
                            alert('Message copied to clipboard! Logged in history.');
                          }}
                          className="px-3.5 py-2 rounded-button bg-slate-200 dark:bg-slate-800 text-textPrimary-light dark:text-textPrimary-dark font-bold text-[10px] hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                        >
                          Copy Msg
                        </button>

                        <a
                          href={`sms:${showNudgeModal.contactPhone}?body=${encodeURIComponent(tmpl.text)}`}
                          onClick={() => logReminderSent(showNudgeModal, idx)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-button bg-primary-600 hover:bg-primary-700 text-white font-bold text-[10px] transition-colors"
                        >
                          <Send className="w-3 h-3" />
                          Send SMS
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
