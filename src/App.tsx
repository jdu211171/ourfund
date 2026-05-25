import { useState, useEffect } from 'react'
import {
  Home as HomeIcon,
  Wallet as WalletIcon,
  Plus,
  Minus,
  Users,
  TrendingUp,
  TrendingDown,
  Share2,
  X,
  Sparkles,
  AlertCircle
} from 'lucide-react'

// Types
interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  walletId: string;
  paidBy: string;
  date: string;
  note: string;
  isPersonal: boolean;
}

interface Wallet {
  id: string;
  name: string;
  type: 'shared' | 'private';
  balance: number;
  membersCount?: number;
}

interface CategoryLimit {
  category: string;
  limit: number;
  spent: number;
  color: string;
}

interface FamilyMember {
  id: string;
  name: string;
  role: 'Admin' | 'Teen' | 'Kid';
  allowance: number;
  avatar: string;
}

function App() {
  // --- Persistent State ---
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('of_current_user');
    return saved ? JSON.parse(saved) : { name: 'James Morgan', role: 'Admin', hasFamilyAccess: true };
  });

  const [onboarded, setOnboarded] = useState(() => {
    return localStorage.getItem('of_onboarded') === 'true';
  });

  const [familyCode, setFamilyCode] = useState(() => {
    return localStorage.getItem('of_family_code') || 'NEST-2840';
  });

  const [viewMode, setViewMode] = useState<'personal' | 'family'>('family');
  const [activeTab, setActiveTab] = useState<'home' | 'wallets' | 'reports' | 'family'>('home');

  // Modals
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Wallets data
  const [wallets, setWallets] = useState<Wallet[]>(() => {
    const saved = localStorage.getItem('of_wallets');
    return saved ? JSON.parse(saved) : [
      { id: 'wallet-shared', name: 'Joint Household', type: 'shared', balance: 3240.00, membersCount: 4 },
      { id: 'wallet-private', name: 'Personal Wallet', type: 'private', balance: 840.20 }
    ];
  });

  // Category limits
  const [categoryLimits, setCategoryLimits] = useState<CategoryLimit[]>(() => {
    const saved = localStorage.getItem('of_category_limits');
    return saved ? JSON.parse(saved) : [
      { category: 'Rent & Utilities', limit: 1800.00, spent: 1420.00, color: 'bg-indigo-500' },
      { category: 'Groceries', limit: 950.00, spent: 612.40, color: 'bg-emerald-500' },
      { category: 'Transport', limit: 580.00, spent: 186.80, color: 'bg-amber-500' },
      { category: 'Dining out', limit: 108.00, spent: 94.20, color: 'bg-rose-500' }
    ];
  });

  // Transactions list
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('of_transactions');
    return saved ? JSON.parse(saved) : [
      {
        id: 't1',
        type: 'expense',
        amount: 124.30,
        category: 'Groceries',
        walletId: 'wallet-shared',
        paidBy: 'Emma Morgan',
        date: 'Today',
        note: 'Whole Foods groceries',
        isPersonal: false
      },
      {
        id: 't2',
        type: 'expense',
        amount: 182.00,
        category: 'Rent & Utilities',
        walletId: 'wallet-shared',
        paidBy: 'System Auto',
        date: 'Yesterday',
        note: 'Electric bill payment',
        isPersonal: false
      },
      {
        id: 't3',
        type: 'income',
        amount: 4800.00,
        category: 'Salary',
        walletId: 'wallet-shared',
        paidBy: 'James Morgan',
        date: 'Nov 1',
        note: 'Monthly salary credit',
        isPersonal: false
      },
      {
        id: 't4',
        type: 'expense',
        amount: 24.00,
        category: 'Transport',
        walletId: 'wallet-private',
        paidBy: 'James Morgan',
        date: 'Nov 3',
        note: 'Uber to office',
        isPersonal: true
      }
    ];
  });

  // Family Members
  const [members] = useState<FamilyMember[]>(() => {
    const saved = localStorage.getItem('of_members');
    return saved ? JSON.parse(saved) : [
      { id: 'm1', name: 'James Morgan', role: 'Admin', allowance: 0, avatar: '👨‍💼' },
      { id: 'm2', name: 'Emma Morgan', role: 'Admin', allowance: 0, avatar: '👩‍💼' },
      { id: 'm3', name: 'Ava Morgan', role: 'Teen', allowance: 80.00, avatar: '👧' },
      { id: 'm4', name: 'Liam Morgan', role: 'Kid', allowance: 0, avatar: '👦' }
    ];
  });

  // Onboarding Code input
  const [inputCode, setInputCode] = useState('');
  const [onboardingError, setOnboardingError] = useState('');

  // Form states
  const [amountInput, setAmountInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('Groceries');
  const [walletInput, setWalletInput] = useState('wallet-shared');
  const [noteInput, setNoteInput] = useState('');
  const [isPersonalTxInput, setIsPersonalTxInput] = useState(false);

  // New Wallet form
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletType, setNewWalletType] = useState<'shared' | 'private'>('shared');
  const [newWalletBalance, setNewWalletBalance] = useState('');

  // --- Synchronization Effects ---
  useEffect(() => {
    localStorage.setItem('of_current_user', JSON.stringify(currentUser));
    localStorage.setItem('of_onboarded', onboarded.toString());
    localStorage.setItem('of_family_code', familyCode);
    localStorage.setItem('of_wallets', JSON.stringify(wallets));
    localStorage.setItem('of_category_limits', JSON.stringify(categoryLimits));
    localStorage.setItem('of_transactions', JSON.stringify(transactions));
    localStorage.setItem('of_members', JSON.stringify(members));
  }, [currentUser, onboarded, familyCode, wallets, categoryLimits, transactions, members]);

  // Dynamic calculations based on Personal vs Family toggle
  const getFilteredTransactions = () => {
    if (viewMode === 'personal') {
      return transactions.filter(t => t.isPersonal || t.paidBy === currentUser.name);
    }
    return transactions; // Family shows all
  };

  const getBalances = () => {
    const filteredTxs = getFilteredTransactions();
    
    // Starting balances if transactions were empty
    let startingIncome = 0;
    let startingSpent = 0;
    
    filteredTxs.forEach(t => {
      if (t.type === 'income') {
        startingIncome += t.amount;
      } else {
        startingSpent += t.amount;
      }
    });

    const netBalance = startingIncome - startingSpent;

    return {
      balance: Math.max(0, netBalance),
      income: startingIncome,
      spent: startingSpent
    };
  };

  const { balance, income, spent } = getBalances();

  // Onboarding actions
  const handleJoinFamily = (code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setOnboardingError('Please enter an invitation code.');
      return;
    }

    // Role mapping based on invitation code postfix or prefix
    let assignedRole: 'Admin' | 'Teen' | 'Kid' = 'Admin';
    let userName = 'James Morgan';
    
    if (trimmed.includes('TEEN')) {
      assignedRole = 'Teen';
      userName = 'Ava Morgan';
    } else if (trimmed.includes('KID')) {
      assignedRole = 'Kid';
      userName = 'Liam Morgan';
    }

    setCurrentUser({
      name: userName,
      role: assignedRole,
      hasFamilyAccess: true
    });
    
    setFamilyCode(trimmed);
    setOnboarded(true);
    setOnboardingError('');
  };

  const handleCreateNewFamily = () => {
    setCurrentUser({
      name: 'James Morgan',
      role: 'Admin',
      hasFamilyAccess: true
    });
    setFamilyCode(`NEST-${Math.floor(1000 + Math.random() * 9000)}`);
    setOnboarded(true);
  };

  // Add Income Submit
  const handleAddIncome = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(amountInput);
    if (isNaN(amountVal) || amountVal <= 0) return;

    const selectedWallet = wallets.find(w => w.id === walletInput);
    const newTx: Transaction = {
      id: `t-${Date.now()}`,
      type: 'income',
      amount: amountVal,
      category: categoryInput,
      walletId: walletInput,
      paidBy: currentUser.name,
      date: 'Today',
      note: noteInput || 'Income deposit',
      isPersonal: selectedWallet ? selectedWallet.type === 'private' : isPersonalTxInput
    };

    // Update wallet balance
    setWallets(prev => prev.map(w => {
      if (w.id === walletInput) {
        return { ...w, balance: w.balance + amountVal };
      }
      return w;
    }));

    setTransactions([newTx, ...transactions]);
    setShowAddIncome(false);
    resetTxForm();
  };

  // Add Expense Submit
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(amountInput);
    if (isNaN(amountVal) || amountVal <= 0) return;

    const selectedWallet = wallets.find(w => w.id === walletInput);
    const newTx: Transaction = {
      id: `t-${Date.now()}`,
      type: 'expense',
      amount: amountVal,
      category: categoryInput,
      walletId: walletInput,
      paidBy: currentUser.name,
      date: 'Today',
      note: noteInput || 'Expense transaction',
      isPersonal: selectedWallet ? selectedWallet.type === 'private' : isPersonalTxInput
    };

    // Update wallet balance
    setWallets(prev => prev.map(w => {
      if (w.id === walletInput) {
        return { ...w, balance: Math.max(0, w.balance - amountVal) };
      }
      return w;
    }));

    // Update category spent limits
    setCategoryLimits(prev => prev.map(c => {
      if (c.category === categoryInput) {
        return { ...c, spent: c.spent + amountVal };
      }
      return c;
    }));

    setTransactions([newTx, ...transactions]);
    setShowAddExpense(false);
    resetTxForm();
  };

  // Create Wallet Submit
  const handleCreateWallet = (e: React.FormEvent) => {
    e.preventDefault();
    const balanceVal = parseFloat(newWalletBalance) || 0;
    if (!newWalletName.trim()) return;

    const newWallet: Wallet = {
      id: `wallet-${Date.now()}`,
      name: newWalletName,
      type: newWalletType,
      balance: balanceVal,
      membersCount: newWalletType === 'shared' ? 4 : undefined
    };

    setWallets([...wallets, newWallet]);
    setShowAddWallet(false);
    setNewWalletName('');
    setNewWalletBalance('');
  };

  const resetTxForm = () => {
    setAmountInput('');
    setNoteInput('');
    setIsPersonalTxInput(false);
  };

  const resetAllData = () => {
    localStorage.clear();
    window.location.reload();
  };

  // --- Onboarding Render ---
  if (!onboarded) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-800 rounded-3xl shadow-2xl border border-slate-700/50 p-8 text-center text-white relative overflow-hidden">
          {/* Decorative gradients */}
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-blue-600/30 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-indigo-600/30 rounded-full blur-2xl"></div>

          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 transform rotate-6 hover:rotate-12 transition-transform duration-300">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
            OurFund
          </h1>
          <p className="text-slate-400 text-sm mb-8 px-4">
            Budget together. Live easier. One shared place for the whole family.
          </p>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 text-left">
                Enter Invite Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. NEST-2840"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <button
                  onClick={() => handleJoinFamily(inputCode)}
                  className="bg-blue-600 hover:bg-blue-500 px-5 py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/10 active-press"
                >
                  Join
                </button>
              </div>
              <p className="text-slate-500 text-[10px] mt-2 text-left leading-relaxed">
                💡 Tip: Type <code className="text-blue-400 font-mono">NEST-2840-TEEN</code> to test joining as a Teenager.
              </p>
              {onboardingError && (
                <p className="text-rose-400 text-xs mt-2 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {onboardingError}
                </p>
              )}
            </div>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <span className="relative bg-slate-800 px-3 text-slate-500 text-xs">OR</span>
            </div>

            <button
              onClick={handleCreateNewFamily}
              className="w-full bg-slate-700/60 hover:bg-slate-700 border border-slate-600/50 py-3 rounded-xl font-semibold text-sm tracking-wide text-white transition-colors active-press"
            >
              Start New Family Group
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Main Application Render ---
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative max-w-md mx-auto border-x border-slate-100 pb-24">
          
          {/* Header */}
          <header className="bg-white border-b border-slate-100 px-5 py-4 flex justify-between items-center sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                OF
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 leading-none">OurFund</h2>
                <span className="text-[10px] text-slate-500 font-semibold">{currentUser.role} View</span>
              </div>
            </div>
            
            {/* Family vs Personal Switch */}
            {currentUser.hasFamilyAccess && (
              <div className="bg-slate-100 p-0.5 rounded-full flex relative select-none">
                <button
                  onClick={() => setViewMode('personal')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    viewMode === 'personal'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Personal
                </button>
                <button
                  onClick={() => setViewMode('family')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    viewMode === 'family'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Family
                </button>
              </div>
            )}
          </header>

          {/* --- TAB CONTENT RENDERING --- */}
          <main className="flex-1 p-5 space-y-5">
            
            {activeTab === 'home' && (
              <>
                {/* 1. Sleek Typography Balance */}
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Current balance
                  </span>
                  <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                    ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h1>
                </div>

                {/* 2. Dribbble Income / Spent Capsule Card */}
                <div className="bg-blue-600 text-white rounded-3xl p-5 shadow-xl shadow-blue-500/10 flex items-center justify-between relative overflow-hidden">
                  {/* Subtle graphics inside card */}
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/5 rounded-full blur-lg"></div>
                  
                  <div className="flex-1 text-center">
                    <span className="text-[10px] text-blue-200 uppercase tracking-widest font-semibold flex items-center justify-center gap-1 mb-1">
                      <TrendingUp className="w-3 h-3" /> Income
                    </span>
                    <span className="text-lg font-bold">
                      ${income.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="h-8 w-[1px] bg-blue-400/50"></div>

                  <div className="flex-1 text-center">
                    <span className="text-[10px] text-blue-200 uppercase tracking-widest font-semibold flex items-center justify-center gap-1 mb-1">
                      <TrendingDown className="w-3 h-3" /> Spent
                    </span>
                    <span className="text-lg font-bold">
                      ${spent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Quick actions for prototype */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowAddIncome(true)}
                    className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 py-3 px-4 rounded-2xl font-bold text-xs transition-colors active-press"
                  >
                    <Plus className="w-4 h-4" /> Add Income
                  </button>
                  <button
                    onClick={() => setShowAddExpense(true)}
                    className="flex items-center justify-center gap-2 bg-rose-50 text-rose-700 hover:bg-rose-100 py-3 px-4 rounded-2xl font-bold text-xs transition-colors active-press"
                  >
                    <Minus className="w-4 h-4" /> Add Expense
                  </button>
                </div>

                {/* 3. Category Limits Progress Bar */}
                <div className="bg-white rounded-3xl p-5 border border-slate-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-800">Category limits</h3>
                    <span className="text-xs font-semibold text-blue-600">Active</span>
                  </div>

                  <div className="space-y-3.5">
                    {categoryLimits.map((c, i) => {
                      const percentage = Math.min(100, Math.round((c.spent / c.limit) * 100));
                      return (
                        <div key={i} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-700">{c.category}</span>
                            <span className="text-slate-400">
                              {percentage}% of limit (${c.spent.toFixed(0)}/${c.limit.toFixed(0)})
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${c.color}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Recent Activity */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-800">Recent Activity</h3>
                    <button className="text-xs font-semibold text-blue-600 hover:underline">View All</button>
                  </div>

                  <div className="space-y-2">
                    {getFilteredTransactions().map((t) => (
                      <div
                        key={t.id}
                        className="bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                            t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'
                          }`}>
                            {t.type === 'income' ? '💰' : '🛒'}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 leading-tight">
                              {t.category} — {t.note}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">
                              {t.paidBy} · {t.date}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-bold ${
                            t.type === 'income' ? 'text-emerald-600' : 'text-slate-800'
                          }`}>
                            {t.type === 'income' ? '+' : '-'} ${t.amount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                    {getFilteredTransactions().length === 0 && (
                      <div className="text-center py-6 text-slate-400 text-xs">
                        No transactions recorded. Click Add Income/Expense to begin.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'wallets' && (
              <>
                <div className="flex justify-between items-center">
                  <h1 className="text-xl font-bold text-slate-900">Wallets</h1>
                  <button
                    onClick={() => setShowAddWallet(true)}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white py-1.5 px-3 rounded-xl font-bold text-xs transition-colors active-press"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add New
                  </button>
                </div>

                <div className="space-y-3">
                  {wallets.map((w) => (
                    <div
                      key={w.id}
                      className="bg-white rounded-3xl p-5 border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className={`text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full ${
                            w.type === 'shared' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {w.type === 'shared' ? 'Shared Wallet' : 'Private Wallet'}
                          </span>
                          <h3 className="text-sm font-bold text-slate-800 mt-1">{w.name}</h3>
                        </div>
                        {w.membersCount && (
                          <span className="text-[10px] font-semibold text-slate-400">
                            👤 {w.membersCount} members
                          </span>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-end">
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">Balance</span>
                          <p className="text-xl font-black text-slate-900 leading-tight">
                            ${w.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setWalletInput(w.id);
                            if (w.type === 'shared') {
                              setShowAddExpense(true);
                            } else {
                              setShowAddExpense(true);
                              setIsPersonalTxInput(true);
                            }
                          }}
                          className="bg-slate-50 hover:bg-slate-100 text-slate-700 py-1.5 px-3.5 rounded-xl font-bold text-xs transition-colors"
                        >
                          Use Wallet
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subscriptions Card */}
                <div className="bg-white rounded-3xl p-5 border border-slate-100">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-slate-800">Recurring Bills & Subscriptions</h3>
                    <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      2 Reminders
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs p-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">⚡</span>
                        <div>
                          <p className="font-bold text-slate-700">Electric Bill</p>
                          <span className="text-[10px] text-slate-400 font-semibold">Due in 2 days</span>
                        </div>
                      </div>
                      <span className="font-bold text-slate-700">$182.00/mo</span>
                    </div>
                    <div className="flex justify-between items-center text-xs p-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🎬</span>
                        <div>
                          <p className="font-bold text-slate-700">Netflix Premium</p>
                          <span className="text-[10px] text-slate-400 font-semibold">Auto-debit on Nov 15</span>
                        </div>
                      </div>
                      <span className="font-bold text-slate-700">$15.99/mo</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'reports' && (
              <>
                <h1 className="text-xl font-bold text-slate-900">Reports</h1>

                {/* Visual SVG Donut/Chart Chart */}
                <div className="bg-white rounded-3xl p-5 border border-slate-100 flex flex-col items-center">
                  <span className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">
                    Spent breakdown by category
                  </span>
                  
                  {/* SVG Donut Chart */}
                  <div className="relative w-44 h-44 flex items-center justify-center mb-4">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                      {/* Rent & Utilities - 61% */}
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#6366f1" strokeWidth="3" 
                        strokeDasharray="61 39" strokeDashoffset="0" />
                      {/* Groceries - 26% */}
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="3" 
                        strokeDasharray="26 74" strokeDashoffset="-61" />
                      {/* Transport - 8% */}
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="3" 
                        strokeDasharray="8 92" strokeDashoffset="-87" />
                      {/* Dining out - 5% */}
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f43f5e" strokeWidth="3" 
                        strokeDasharray="5 95" strokeDashoffset="-95" />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">Total Spent</span>
                      <span className="text-xl font-extrabold text-slate-900">${spent.toFixed(0)}</span>
                    </div>
                  </div>

                  {/* SVG Chart legend */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full text-xs font-semibold">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                      <span className="text-slate-600">Utilities (61%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      <span className="text-slate-600">Groceries (26%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <span className="text-slate-600">Transport (8%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                      <span className="text-slate-600">Dining Out (5%)</span>
                    </div>
                  </div>
                </div>

                {/* Spend Analysis */}
                <div className="bg-white rounded-3xl p-5 border border-slate-100 space-y-3">
                  <h3 className="text-sm font-bold text-slate-800">Monthly Spending Comparison</h3>
                  <div className="h-24 flex items-end justify-between px-4 pt-4 border-b border-slate-100">
                    <div className="flex flex-col items-center gap-1 flex-1">
                      <div className="w-8 bg-slate-200 rounded-t-md h-12"></div>
                      <span className="text-[9px] text-slate-400 font-semibold">Sept</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 flex-1">
                      <div className="w-8 bg-slate-200 rounded-t-md h-16"></div>
                      <span className="text-[9px] text-slate-400 font-semibold">Oct</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 flex-1">
                      <div className="w-8 bg-blue-600 rounded-t-md h-20"></div>
                      <span className="text-[9px] text-slate-800 font-bold">Nov (Current)</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed pt-2">
                    💡 Spend is up 12% compared to last month. Groceries represent your largest change since Nov 1st.
                  </p>
                </div>
              </>
            )}

            {activeTab === 'family' && (
              <>
                <h1 className="text-xl font-bold text-slate-900">Family Group</h1>

                {/* Invite Code card */}
                <div className="bg-white rounded-3xl p-5 border border-slate-100">
                  <span className="text-[9px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Invitation Details
                  </span>
                  <h3 className="text-sm font-bold text-slate-800 mt-2">The Morgans Household</h3>
                  <p className="text-xs text-slate-400 mb-4 mt-0.5 font-semibold">Invite new members using this code:</p>
                  
                  <div className="flex gap-2">
                    <div className="flex-1 bg-slate-50 rounded-xl py-3 border border-slate-100 flex items-center justify-center font-mono font-bold tracking-widest text-slate-700">
                      {familyCode}
                    </div>
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="bg-blue-600 text-white px-4 rounded-xl flex items-center justify-center active-press"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Family Members list */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-800">Members ({members.length})</h3>
                  </div>

                  <div className="space-y-2">
                    {members.map((m) => (
                      <div
                        key={m.id}
                        className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-lg">
                            {m.avatar}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 leading-tight">{m.name}</h4>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">{m.role}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          {m.allowance > 0 ? (
                            <span className="text-xs font-bold text-slate-600">
                              ${m.allowance.toFixed(2)}/mo allowance
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold">No limit</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Settings & Debugging */}
                <div className="bg-white rounded-3xl p-5 border border-slate-100 space-y-4">
                  <h3 className="text-sm font-bold text-slate-800">Application Settings</h3>
                  <button
                    onClick={resetAllData}
                    className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 py-3 rounded-xl text-xs font-bold transition-all active-press"
                  >
                    Reset Application Data
                  </button>
                </div>
              </>
            )}

          </main>

        {/* --- BOTTOM NAVIGATION BAR --- */}
        <nav className="absolute bottom-0 inset-x-0 bg-white border-t border-slate-200/80 px-6 py-2 flex justify-between items-center z-15 backdrop-blur-md bg-white/95">
          {/* Home */}
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 ${
              activeTab === 'home' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            } transition-colors`}
          >
            <HomeIcon className="w-5 h-5" />
            <span className="text-[10px] font-bold">Home</span>
          </button>

          {/* Wallets */}
          <button
            onClick={() => setActiveTab('wallets')}
            className={`flex flex-col items-center gap-1 ${
              activeTab === 'wallets' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            } transition-colors`}
          >
            <WalletIcon className="w-5 h-5" />
            <span className="text-[10px] font-bold">Wallets</span>
          </button>

          {/* Add Income (Plus) */}
          <button
            onClick={() => {
              setWalletInput(wallets[0]?.id || 'wallet-shared');
              setShowAddIncome(true);
            }}
            className="flex flex-col items-center justify-center bg-emerald-50 text-emerald-600 hover:bg-emerald-100 w-11 h-11 rounded-full shadow-sm hover:shadow active-press"
          >
            <Plus className="w-6 h-6 stroke-[3px]" />
          </button>

          {/* Add Expense (Minus) */}
          <button
            onClick={() => {
              setWalletInput(wallets[0]?.id || 'wallet-shared');
              setShowAddExpense(true);
            }}
            className="flex flex-col items-center justify-center bg-rose-50 text-rose-600 hover:bg-rose-100 w-11 h-11 rounded-full shadow-sm hover:shadow active-press"
          >
            <Minus className="w-6 h-6 stroke-[3px]" />
          </button>

          {/* Family / Settings */}
          <button
            onClick={() => setActiveTab('family')}
            className={`flex flex-col items-center gap-1 ${
              activeTab === 'family' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            } transition-colors`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-bold">Family</span>
          </button>
        </nav>

        {/* --- INTERACTIVE SHEET MODALS (SLIDE UP) --- */}

        {/* 1. Add Income Modal */}
        {showAddIncome && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex flex-col justify-end">
            <div className="bg-white rounded-t-[32px] p-6 space-y-6 max-h-[90%] overflow-y-auto shadow-2xl transition-all duration-300">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600"><Plus className="w-5 h-5" /></div>
                  <h3 className="text-base font-black text-slate-800">Add Income</h3>
                </div>
                <button
                  onClick={() => setShowAddIncome(false)}
                  className="w-8 h-8 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddIncome} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Source/Category
                  </label>
                  <select
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    <option value="Salary">Salary</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Gift">Gift</option>
                    <option value="Investment">Investment</option>
                    <option value="Refund">Refund</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Deposit to Wallet
                  </label>
                  <select
                    value={walletInput}
                    onChange={(e) => setWalletInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    {wallets.map(w => (
                      <option key={w.id} value={w.id}>{w.name} (${w.balance.toFixed(2)})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Note (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. November paycheck"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold text-sm transition-colors shadow-lg shadow-blue-500/10 active-press"
                >
                  Add Income
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 2. Add Expense Modal */}
        {showAddExpense && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex flex-col justify-end">
            <div className="bg-white rounded-t-[32px] p-6 space-y-6 max-h-[90%] overflow-y-auto shadow-2xl transition-all duration-300">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600"><Minus className="w-5 h-5" /></div>
                  <h3 className="text-base font-black text-slate-800">Add Expense</h3>
                </div>
                <button
                  onClick={() => setShowAddExpense(false)}
                  className="w-8 h-8 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Category
                  </label>
                  <select
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    {categoryLimits.map(c => (
                      <option key={c.category} value={c.category}>{c.category}</option>
                    ))}
                    <option value="Entertainment">Entertainment</option>
                    <option value="Health">Health</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Pay from Wallet
                  </label>
                  <select
                    value={walletInput}
                    onChange={(e) => setWalletInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    {wallets.map(w => (
                      <option key={w.id} value={w.id}>{w.name} (${w.balance.toFixed(2)})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Note (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Weekly family groceries"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold text-sm transition-colors shadow-lg shadow-blue-500/10 active-press"
                >
                  Add Expense
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 3. Create Wallet Modal */}
        {showAddWallet && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex flex-col justify-end">
            <div className="bg-white rounded-t-[32px] p-6 space-y-6 max-h-[90%] overflow-y-auto shadow-2xl transition-all duration-300">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-black text-slate-800">Add Wallet</h3>
                <button
                  onClick={() => setShowAddWallet(false)}
                  className="w-8 h-8 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateWallet} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Wallet Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Travel Savings, Kid Wallet"
                    value={newWalletName}
                    onChange={(e) => setNewWalletName(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Wallet Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewWalletType('shared')}
                      className={`py-3 rounded-2xl font-bold text-xs border transition-all active-press ${
                        newWalletType === 'shared'
                          ? 'bg-blue-50 border-blue-200 text-blue-600'
                          : 'bg-slate-50 border-slate-100 text-slate-500'
                      }`}
                    >
                      Shared (Family)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewWalletType('private')}
                      className={`py-3 rounded-2xl font-bold text-xs border transition-all active-press ${
                        newWalletType === 'private'
                          ? 'bg-blue-50 border-blue-200 text-blue-600'
                          : 'bg-slate-50 border-slate-100 text-slate-500'
                      }`}
                    >
                      Private (Personal)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Initial Balance ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newWalletBalance}
                    onChange={(e) => setNewWalletBalance(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold text-sm transition-colors shadow-lg active-press"
                >
                  Create Wallet
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 4. Share Invite Modal */}
        {showInviteModal && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl p-6 space-y-6 w-full max-w-sm shadow-2xl relative">
              <button
                onClick={() => setShowInviteModal(false)}
                className="absolute top-4 right-4 w-8 h-8 bg-slate-50 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto">
                  <Share2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-slate-800">Invite Sent!</h3>
                <p className="text-xs text-slate-400">
                  Code copied to clipboard. Share it with family members to let them join this wallet!
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
                <p className="font-semibold text-slate-700 text-center">Copy code for different roles:</p>
                <div className="space-y-1 font-mono text-[10px] text-slate-500">
                  <div className="flex justify-between">
                    <span>Admin:</span>
                    <span className="font-bold text-blue-600">{familyCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Teenager:</span>
                    <span className="font-bold text-blue-600">{familyCode}-TEEN</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kid:</span>
                    <span className="font-bold text-blue-600">{familyCode}-KID</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowInviteModal(false)}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold text-xs transition-colors active-press"
              >
                Done
              </button>
            </div>
          </div>
        )}

    </div>
  )
}

export default App
