import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import {
  clearPersistedAppSeed,
  defaultHistoryFilters,
  defaultPermissions,
  getEmptySeed,
  getInitialSeed,
  knownInvites,
  persistAppSeed,
} from "../lib/seed";
import { getAppDataServerFn } from "../fns/app-data";
import { checkEmailRegisteredServerFn, logoutServerFn } from "../fns/auth";
import { validateInviteCodeServerFn } from "../fns/invite";
import { scanReceiptServerFn } from "../fns/receipt-scan";
import { syncMutationServerFn } from "../fns/sync-mutation";
import { setCompactMoneyMode as setCompactMoneyFormatterMode } from "../lib/currency";
import { formatISODate, makeScheduleMeta, nextDateFromWeekday } from "../lib/schedules";

// Import types
import {
  ScreenName,
  BudgetMode,
  SalaryCalculationPeriod,
  ReportPeriod,
  CurrencyCode,
  WalletType,
  MemberRole,
  NotificationTone,
  TxnKind,
  LoanDirection,
  LoanStatus,
  Transaction,
  WalletAccount,
  BudgetCategory,
  ScheduleItem,
  LoanEntry,
  ProductEntry,
  FamilyMember,
  Household,
  HouseholdInvite,
  ReceiptScanItem,
  ReceiptScan,
  AppNotification,
  HistoryFilters,
  Profile,
  CurrencySettings,
  SalaryCalculatorSettings,
  Goal,
  LinkedBank,
  AppSeed,
} from "../types";

// Import helpers
import {
  makeId,
  makeInviteCode,
  initialsFor,
  permissionsForRole,
  categoryAliases,
  iconForCategoryLabel,
  plusDays,
  firstName,
  transactionDate,
  isCurrentMonthTransaction,
  asRecord,
  normalizeBudgetModeInput,
  normalizeReportPeriodInput,
  normalizeHistoryFiltersInput,
  canMemberSeeGoal,
} from "./helpers";

export interface NavigationContextType {
  currentScreen: ScreenName;
  history: ScreenName[];
  navigate: (screen: ScreenName) => void;
  goBack: () => void;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  signupHouseholdMode: "new" | "join";
  setSignupHouseholdMode: (mode: "new" | "join") => void;
  logout: () => Promise<void>;
  budgetMode: BudgetMode;
  setBudgetMode: (mode: BudgetMode) => void;
  salaryCalculatorSettings: SalaryCalculatorSettings;
  setSalaryCalculatorSettings: (updates: Partial<SalaryCalculatorSettings>) => void;
  reportPeriod: ReportPeriod;
  setReportPeriod: (period: ReportPeriod) => void;
  profile: Profile;
  updateProfile: (profile: Partial<Profile>) => void;
  household: Household | null;
  pendingInvite: HouseholdInvite | null;
  resetToken: string | null;
  setResetToken: (token: string | null) => void;
  createHousehold: (input: {
    name: string;
    email: string;
    householdName: string;
  }) => Promise<Household>;
  validateInviteCode: (code: string, invitedEmail?: string) => Promise<HouseholdInvite | null>;
  acceptInvite: () => Promise<void>;
  syncDataAfterLogin: () => Promise<boolean>;
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  currencies: CurrencySettings;
  currencyTarget: BudgetMode;
  setCurrencyTarget: (target: BudgetMode) => void;
  setCurrencyForMode: (mode: BudgetMode, currency: CurrencyCode) => void;
  transactions: Transaction[];
  activeTransactions: Transaction[];
  currentMonthTransactions: Transaction[];
  addTransaction: (txn: Omit<Transaction, "id">) => Transaction;
  updateTransaction: (id: string, txn: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  deleteContributionFromGoal: (goalId: string, contributionId: string) => void;
  deleteContributionsFromGoal: (goalId: string, contributionIds: string[]) => void;
  recordTransfer: (amountUsd: number, fromWallet: string, toWallet: string, note: string) => void;
  balanceUsd: number;
  incomeUsd: number;
  spentUsd: number;
  selectedTransactionId: string | null;
  setSelectedTransactionId: (id: string | null) => void;
  selectedMonthHistory: { year: number; month: number } | null;
  setSelectedMonthHistory: (val: { year: number; month: number } | null) => void;
  wallets: WalletAccount[];
  activeWallets: WalletAccount[];
  addWallet: (
    wallet: Omit<WalletAccount, "id" | "startingBalanceUsd"> & { startingBalanceUsd?: number },
  ) => WalletAccount;
  updateWallet: (walletId: string, updates: Partial<Omit<WalletAccount, "id">>) => void;
  deleteWallet: (walletId: string) => void;
  selectedWalletId: string | null;
  setSelectedWalletId: (id: string | null) => void;
  selectedDetailWalletId: string | null;
  setSelectedDetailWalletId: (id: string | null) => void;
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
  language: "en" | "ja";
  setLanguage: (lang: "en" | "ja") => void;
  walletBalanceUsd: (walletLabel: string) => number;
  categories: BudgetCategory[];
  addCategory: (category: Omit<BudgetCategory, "id">) => BudgetCategory;
  updateCategory: (categoryId: string, updates: Partial<Omit<BudgetCategory, "id">>) => void;
  updateCategoryLimit: (categoryId: string, limitUsd: number) => void;
  deleteCategory: (categoryId: string) => void;
  categorySpentUsd: (label: string) => number;
  goals: Goal[];
  selectedGoalId: string | null;
  setSelectedGoalId: (id: string | null) => void;
  addGoal: (goal: Omit<Goal, "id" | "savedUsd" | "history"> & { savedUsd?: number }) => Goal;
  updateGoal: (goalId: string, updates: Partial<Omit<Goal, "id" | "history" | "savedUsd">>) => void;
  deleteGoal: (goalId: string) => void;
  contributeToGoal: (goalId: string, amountUsd: number, who?: string, walletId?: string) => void;
  withdrawFromGoal: (goalId: string, amountUsd: number, wallet: string) => void;
  members: FamilyMember[];
  currentMemberId: string | null;
  selectedMemberId: string | null;
  setSelectedMemberId: (id: string | null) => void;
  selectedMemberIds: string[];
  setSelectedMemberIds: (ids: string[]) => void;
  inviteMember: (role: MemberRole, email?: string) => FamilyMember;
  updateMember: (id: string, updates: Partial<FamilyMember>) => void;
  updateMemberPermission: (memberId: string, permission: string, on: boolean) => void;
  removeMember: (id: string) => void;
  removeMembers: (ids: string[]) => void;
  scheduleAllowance: (memberId: string, amountUsd: number, day: string) => void;
  linkedBanks: LinkedBank[];
  selectedBankName: string;
  setSelectedBankName: (bank: string) => void;
  connectSelectedBank: () => void;
  notifications: AppNotification[];
  markAllNotificationsRead: () => void;
  markNotificationRead: (id: string) => void;
  notificationPrefs: Record<string, boolean>;
  toggleNotificationPref: (key: string) => void;
  recurringIncome: ScheduleItem[];
  addRecurringIncome: (item?: Partial<ScheduleItem>) => void;
  subscriptions: ScheduleItem[];
  addSubscription: (item?: Partial<ScheduleItem>) => void;
  updateScheduleItem: (id: string, updates: Partial<Omit<ScheduleItem, "id">>) => void;
  deleteScheduleItem: (id: string) => void;
  deleteScheduleItems: (ids: string[]) => void;
  loanEntries: LoanEntry[];
  addLoanEntry: (
    entry: Omit<LoanEntry, "id" | "createdAt" | "paidAmountUsd"> & { paidAmountUsd?: number },
  ) => LoanEntry;
  updateLoanEntry: (id: string, updates: Partial<Omit<LoanEntry, "id" | "createdAt">>) => void;
  deleteLoanEntries: (ids: string[]) => void;
  trackedProducts: ProductEntry[];
  addTrackedProduct: (product: Omit<ProductEntry, "id" | "createdAt">) => ProductEntry;
  receiptScans: ReceiptScan[];
  scanReceiptImage: (imageDataUrl: string) => Promise<ReceiptScan>;
  saveReceiptScan: (scan: ReceiptScan) => void;
  historyFilters: HistoryFilters;
  setHistoryFilters: (filters: Partial<HistoryFilters>) => void;
  resetHistoryFilters: () => void;
  passcode: string;
  setPasscode: (passcode: string) => void;
  faceIdEnabled: boolean;
  setFaceIdEnabled: (enabled: boolean) => void;
  compactMoneyMode: boolean;
  setCompactMoneyMode: (enabled: boolean) => void;
}

export const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function AppNavigationProvider({ children }: { children: ReactNode }) {
  const routerNavigate = useNavigate();
  const location = useLocation();
  const isWebMode = location.pathname.startsWith("/app");

  const initialSeed = useMemo(() => getInitialSeed(), []);
  const [currentScreen, setCurrentScreen] = useState<ScreenName>("onboarding");
  const [salaryCalculatorSettings, setSalaryCalculatorSettingsState] = useState<SalaryCalculatorSettings>(initialSeed.salaryCalculatorSettings);
  const [history, setHistory] = useState<ScreenName[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [signupHouseholdMode, setSignupHouseholdMode] = useState<"new" | "join">("new");
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [budgetMode, setBudgetModeState] = useState<BudgetMode>(initialSeed.budgetMode);
  const [reportPeriod, setReportPeriodState] = useState<ReportPeriod>(initialSeed.reportPeriod);
  const [profile, setProfile] = useState<Profile>(initialSeed.profile);
  const [household, setHousehold] = useState<Household | null>(initialSeed.household);
  const [pendingInvite, setPendingInvite] = useState<HouseholdInvite | null>(null);
  const [currencies, setCurrencies] = useState<CurrencySettings>(initialSeed.currencies);
  const [currencyTarget, setCurrencyTarget] = useState<BudgetMode>(initialSeed.budgetMode);
  const [transactions, setTransactions] = useState<Transaction[]>(initialSeed.transactions);
  const [wallets, setWallets] = useState<WalletAccount[]>(initialSeed.wallets);
  const [categories, setCategories] = useState<BudgetCategory[]>(initialSeed.categories);
  const [goals, setGoals] = useState<Goal[]>(initialSeed.goals);
  const [members, setMembers] = useState<FamilyMember[]>(initialSeed.members);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [selectedMonthHistory, setSelectedMonthHistory] = useState<{ year: number; month: number } | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(initialSeed.selectedGoalId);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [selectedDetailWalletId, setSelectedDetailWalletId] = useState<string | null>(null);
  const [theme, setThemeState] = useState<"light" | "dark" | "system">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as "light" | "dark" | "system") || "system";
    }
    return "system";
  });
  const [language, setLanguageState] = useState<"en" | "ja">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("language") as "en" | "ja") || "en";
    }
    return "en";
  });
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(
    initialSeed.selectedMemberId,
  );
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [selectedBankName, setSelectedBankName] = useState(initialSeed.selectedBankName);
  const [linkedBanks, setLinkedBanks] = useState<LinkedBank[]>(initialSeed.linkedBanks);
  const [notifications, setNotifications] = useState<AppNotification[]>(initialSeed.notifications);
  const [notificationPrefs, setNotificationPrefs] = useState<Record<string, boolean>>(
    initialSeed.notificationPrefs,
  );
  const [recurringIncome, setRecurringIncome] = useState<ScheduleItem[]>(
    initialSeed.recurringIncome,
  );
  const [subscriptions, setSubscriptions] = useState<ScheduleItem[]>(initialSeed.subscriptions);
  const [loanEntries, setLoanEntries] = useState<LoanEntry[]>(initialSeed.loanEntries);
  const [trackedProducts, setTrackedProducts] = useState<ProductEntry[]>(
    initialSeed.trackedProducts,
  );
  const [receiptScans, setReceiptScans] = useState<ReceiptScan[]>(initialSeed.receiptScans);
  const [historyFilters, setHistoryFilterState] = useState<HistoryFilters>(
    initialSeed.historyFilters,
  );
  const [passcode, setPasscodeState] = useState(initialSeed.passcode);
  const [faceIdEnabled, setFaceIdEnabledState] = useState(initialSeed.faceIdEnabled);
  const [compactMoneyMode, setCompactMoneyModeState] = useState(initialSeed.compactMoneyMode);
  const didMountRef = useRef(false);
  const handledQueryRef = useRef<string | null>(null);

  const applySeed = useCallback((seed: AppSeed) => {
    setBudgetModeState(seed.budgetMode);
    setSalaryCalculatorSettingsState(seed.salaryCalculatorSettings);
    setReportPeriodState(seed.reportPeriod);
    setProfile(seed.profile);
    setHousehold(seed.household);
    setCurrencies(seed.currencies);
    setCurrencyTarget(seed.budgetMode);
    setTransactions(seed.transactions);
    setWallets(seed.wallets);
    setCategories(seed.categories);
    setGoals(seed.goals);
    setMembers(seed.members);
    setSelectedTransactionId(null);
    setSelectedGoalId(seed.selectedGoalId);
    setSelectedMemberId(seed.selectedMemberId);
    setSelectedMemberIds([]);
    setSelectedBankName(seed.selectedBankName);
    setLinkedBanks(seed.linkedBanks);
    setNotifications(seed.notifications);
    setNotificationPrefs(seed.notificationPrefs);
    setRecurringIncome(seed.recurringIncome);
    setSubscriptions(seed.subscriptions);
    setLoanEntries(seed.loanEntries);
    setTrackedProducts(seed.trackedProducts);
    setReceiptScans(seed.receiptScans);
    setHistoryFilterState(seed.historyFilters);
    setPasscodeState(seed.passcode);
    setFaceIdEnabledState(seed.faceIdEnabled);
    setCompactMoneyModeState(seed.compactMoneyMode);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutServerFn();
    } catch {
      // Local-only sessions can still be cleared client-side.
    }
    clearPersistedAppSeed();
    applySeed(getEmptySeed());
    setIsAuthenticated(false);
    setIsAuthReady(true);
    setPendingInvite(null);
    setSignupHouseholdMode("new");
    setHistory([]);
    if (isWebMode) {
      routerNavigate({ to: "/app/$screen", params: { screen: "onboarding" } }).catch(console.error);
    } else {
      setCurrentScreen("onboarding");
    }
  }, [applySeed, isWebMode, routerNavigate]);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    persistAppSeed({
      budgetMode,
      salaryCalculatorSettings,
      reportPeriod,
      profile,
      household,
      currencies,
      transactions,
      wallets,
      categories,
      goals,
      members,
      selectedGoalId,
      selectedMemberId,
      selectedBankName,
      linkedBanks,
      notifications,
      notificationPrefs,
      recurringIncome,
      subscriptions,
      loanEntries,
      trackedProducts,
      receiptScans,
      historyFilters,
      passcode,
      faceIdEnabled,
      compactMoneyMode,
    });
  }, [
    budgetMode,
    salaryCalculatorSettings,
    reportPeriod,
    profile,
    household,
    currencies,
    transactions,
    wallets,
    categories,
    goals,
    members,
    selectedGoalId,
    selectedMemberId,
    selectedBankName,
    linkedBanks,
    notifications,
    notificationPrefs,
    recurringIncome,
    subscriptions,
    loanEntries,
    trackedProducts,
    receiptScans,
    historyFilters,
    passcode,
    faceIdEnabled,
    compactMoneyMode,
  ]);

  const setSalaryCalculatorSettings = useCallback((updates: Partial<SalaryCalculatorSettings>) => {
    setSalaryCalculatorSettingsState((prev) => {
      const nextAmount = 
        updates.amount === undefined 
          ? prev.amount
            : updates.amount === null
              ? null
              : typeof updates.amount === "number" && Number.isFinite(updates.amount)
                ? Math.max(0, updates.amount)
                : prev.amount;
              
    return {
      ...prev,
      ...updates,
      country:
        typeof updates.country === "string" && updates.country.trim()
          ? updates.country
          : prev.country,
      period: updates.period ?? prev.period,
      amount: nextAmount,
      insurance: updates.insurance ? { ...updates.insurance } : prev.insurance,
    }
  });
}, []);

  const setBudgetMode = useCallback((mode: BudgetMode) => {
    setBudgetModeState(mode);
    syncMutationServerFn({ data: { type: "setBudgetMode", data: { budgetMode: mode } } }).catch(
      console.error,
    );
  }, []);

  const setReportPeriod = useCallback((period: ReportPeriod) => {
    setReportPeriodState(period);
    syncMutationServerFn({
      data: { type: "setReportPeriod", data: { reportPeriod: period } },
    }).catch(console.error);
  }, []);

  const setPasscode = (newPasscode: string) => {
    setPasscodeState(newPasscode);
    // Persist to DB in background
    syncMutationServerFn({
      data: { type: "setPasscode", data: { passcode: newPasscode, faceIdEnabled } },
    }).catch(console.error);
  };

  const setFaceIdEnabled = (enabled: boolean) => {
    setFaceIdEnabledState(enabled);
    // Persist to DB in background
    syncMutationServerFn({
      data: { type: "setPasscode", data: { passcode, faceIdEnabled: enabled } },
    }).catch(console.error);
  };

  const setCompactMoneyMode = (enabled: boolean) => {
    setCompactMoneyModeState(enabled);
    syncMutationServerFn({
      data: { type: "setCompactMoneyMode", data: { compactMoneyMode: enabled } },
    }).catch(console.error);
  };

  const navigate = (screen: ScreenName) => {
    if (isWebMode) {
      routerNavigate({ to: "/app/$screen", params: { screen } }).catch(console.error);
    } else {
      setHistory((prev) => (screen === currentScreen ? prev : [...prev, currentScreen]));
      setCurrentScreen(screen);
    }
  };

  const goBack = () => {
    if (isWebMode) {
      window.history.back();
    } else {
      setHistory((prev) => {
        if (prev.length === 0) {
          setCurrentScreen("home");
          return prev;
        }
        const nextHistory = [...prev];
        const previous = nextHistory.pop();
        setCurrentScreen(previous ?? "home");
        return nextHistory;
      });
    }
  };

  const currentMemberId = useMemo(() => {
    const profileEmail = profile.email.trim().toLowerCase();
    return (
      members.find((member) => member.email?.trim().toLowerCase() === profileEmail)?.id ??
      members.find((member) => member.name === profile.name)?.id ??
      members[0]?.id ??
      null
    );
  }, [members, profile.email, profile.name]);

  useEffect(() => {
    if (!currentMemberId) return;
    if (!selectedMemberId || !members.some((member) => member.id === selectedMemberId)) {
      setSelectedMemberId(currentMemberId);
    }
  }, [currentMemberId, members, selectedMemberId]);

  const viewedMemberId = selectedMemberId ?? currentMemberId;

  const currency = currencies[budgetMode];

  const setCurrencyForMode = (mode: BudgetMode, nextCurrency: CurrencyCode) => {
    setCurrencies((prev) => ({ ...prev, [mode]: nextCurrency }));
    setWallets((prev) =>
      prev.map((wallet) => {
        if (mode === "family" && wallet.type !== "private") {
          return { ...wallet, currency: nextCurrency };
        }

        if (mode === "personal" && wallet.type === "private") {
          const ownsWallet =
            viewedMemberId === null ||
            wallet.members.length === 0 ||
            wallet.members.includes(viewedMemberId);
          return ownsWallet ? { ...wallet, currency: nextCurrency } : wallet;
        }

        return wallet;
      }),
    );
    syncMutationServerFn({
      data: { type: "setCurrencyForMode", data: { mode, currency: nextCurrency } },
    }).catch(console.error);
  };

  const setCurrency = (nextCurrency: CurrencyCode) => {
    setCurrencyForMode(budgetMode, nextCurrency);
  };

  const activeWallets = useMemo(
    () =>
      wallets.filter((wallet) => {
        if (budgetMode === "family") return wallet.type !== "private";
        if (wallet.type !== "private") return false;
        return (
          !viewedMemberId || wallet.members.length === 0 || wallet.members.includes(viewedMemberId)
        );
      }),
    [budgetMode, viewedMemberId, wallets],
  );

  const activeTransactions = useMemo(() => {
    const activeWalletLabels = new Set(activeWallets.map((wallet) => wallet.label));
    return transactions.filter((transaction) => activeWalletLabels.has(transaction.wallet));
  }, [activeWallets, transactions]);
  const currentMonthTransactions = useMemo(() => {
    const now = new Date();
    return activeTransactions.filter((transaction) => isCurrentMonthTransaction(transaction, now));
  }, [activeTransactions]);

  const visibleGoals = useMemo(
    () => goals.filter((goal) => canMemberSeeGoal(goal, viewedMemberId)),
    [goals, viewedMemberId],
  );

  const walletBalanceUsd = (walletLabel: string) => {
    const wallet = wallets.find((w) => w.label === walletLabel);
    const txTotal = transactions
      .filter((t) => t.wallet === walletLabel)
      .reduce((sum, t) => sum + t.usd, 0);
    return (wallet?.startingBalanceUsd ?? 0) + txTotal;
  };

  const isGoalLedgerTransaction = (transaction: Pick<Transaction, "category" | "name">) => 
    `${transaction.category} ${transaction.name}`.toLowerCase().includes("goal");

  const incomeUsd = currentMonthTransactions
    .filter((t) => t.usd > 0 && !isGoalLedgerTransaction(t))
    .reduce((sum, t) => sum + t.usd, 0);

  const nonGoalSpentUsd = Math.abs(
    currentMonthTransactions
      .filter((t) => t.usd < 0 && !isGoalLedgerTransaction(t))
      .reduce((sum, t) => sum + t.usd, 0),
  );

  const goalSpentUsd = Math.max(
    0,
    -currentMonthTransactions
      .filter(isGoalLedgerTransaction)
      .reduce((sum, t) => sum + t.usd, 0),
  );

  const spentUsd = nonGoalSpentUsd + goalSpentUsd;

  const balanceUsd = activeWallets.reduce((sum, wallet) => sum + walletBalanceUsd(wallet.label), 0);

  const createBaseWallets = (
    memberId: string,
    memberName: string,
    householdName: string,
    familyCurrency: CurrencyCode,
  ): WalletAccount[] => [
    {
      id: makeId("wallet"),
      label: `${firstName(memberName)} · Personal`,
      sub: "Private wallet",
      type: "private",
      currency: currencies.personal,
      members: [memberId],
      color: "oklch(0.3 0.05 265)",
      startingBalanceUsd: 0,
    },
    {
      id: makeId("wallet"),
      label: `${householdName} Shared`,
      sub: "Shared · 0 balance",
      type: "shared",
      currency: familyCurrency,
      members: [memberId],
      color: "oklch(0.55 0.24 265)",
      startingBalanceUsd: 0,
    },
  ];

  const clearHouseholdLedger = () => {
    setTransactions([]);
    setCategories([]);
    setGoals([]);
    setLinkedBanks([]);
    setNotifications([]);
    setRecurringIncome([]);
    setSubscriptions([]);
    setLoanEntries([]);
    setTrackedProducts([]);
    setReceiptScans([]);
    setSelectedTransactionId(null);
    setSelectedGoalId(null);
  };

  const createHousehold = async (input: { name: string; email: string; householdName: string }) => {
    const cleanName = input.name.trim() || "You";
    const cleanEmail = input.email.trim();
    const cleanHouseholdName = input.householdName.trim() || `${firstName(cleanName)}'s Household`;
    const memberId = makeId("member");
    const nextHousehold: Household = {
      id: makeId("household"),
      name: cleanHouseholdName,
      inviteCode: makeInviteCode(),
      role: "Admin",
      createdAt: "today",
    };
    const member: FamilyMember = {
      id: memberId,
      name: cleanName,
      email: cleanEmail,
      role: "Admin",
      initials: initialsFor(cleanName),
      admin: true,
      permissions: permissionsForRole("Admin"),
    };

    setProfile((prev) => ({
      ...prev,
      name: cleanName,
      email: cleanEmail,
      initials: initialsFor(cleanName),
    }));
    setHousehold(nextHousehold);
    setPendingInvite(null);
    setMembers([member]);
    setSelectedMemberId(memberId);
    setWallets(createBaseWallets(memberId, cleanName, cleanHouseholdName, currencies.family));
    clearHouseholdLedger();
    setBudgetModeState("family");
    setCurrencyTarget("family");

    try {
      await syncMutationServerFn({
        data: {
          type: "createHousehold",
          data: {
            name: cleanName,
            householdName: cleanHouseholdName,
            initials: initialsFor(cleanName),
            personalCurrency: currencies.personal,
            familyCurrency: currencies.family,
          },
        },
      });
      await syncDataAfterLogin();
    } catch (err) {
      console.info("Household saved locally until sign-in is available:", err);
    }

    return nextHousehold;
  };

  const validateInviteCode = useCallback(async (code: string, invitedEmail?: string): Promise<HouseholdInvite | null> => {
    const normalized = code.trim().toUpperCase();
    const cleanInvitedEmail = invitedEmail?.trim().toLowerCase();

    // 1. Check if it matches the current user's own household
    const currentInvite: HouseholdInvite | null =
      household?.inviteCode.toUpperCase() === normalized
        ? {
            code: household.inviteCode,
            householdName: household.name,
            memberCount: members.length,
            role: "Adult",
            inviter: profile.name || "Family admin",
            familyCurrency: currencies.family,
          }
        : null;

    // 2. Check against seeded (demo) invite codes
    const seededInvite = knownInvites.find((invite) => invite.code === normalized) ?? null;

    // 3. Fall back to a live DB lookup
    let dbInvite: HouseholdInvite | null = null;
    if (!currentInvite && !seededInvite) {
      try {
        const result = await validateInviteCodeServerFn({ data: { code: normalized } });
        dbInvite = result as HouseholdInvite | null;
      } catch {
        // ignore lookup errors — treat as invalid code
      }
    }

    const foundInvite = currentInvite ?? seededInvite ?? dbInvite;
    const invite = foundInvite && cleanInvitedEmail
      ? { ...foundInvite, invitedEmail: cleanInvitedEmail }
      : foundInvite;
    setPendingInvite(invite);
    return invite;
  }, [currencies.family, household, members.length, profile.name]);

  // Parse email deep links for password resets and household invites.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reset = params.get("reset");
    const invite = params.get("invite");
    const invitedEmail = params.get("email")?.trim().toLowerCase() || undefined;
    const queryKey = reset || invite
      ? `reset:${reset ?? ""}:invite:${invite ?? ""}:${invitedEmail ?? ""}`
      : null;
    if (!queryKey || handledQueryRef.current === queryKey) return;
    if (invite && !isAuthReady) return;

    handledQueryRef.current = queryKey;
    if (reset) setResetToken(reset);

    const routeTo = (screen: ScreenName) => {
      if (isWebMode) {
        routerNavigate({ to: "/app/$screen", params: { screen } }).catch(console.error);
      } else {
        setCurrentScreen(screen);
      }
    };

    if (!invite) {
      if (reset) routeTo("reset_password");
      return;
    }

    validateInviteCode(invite, invitedEmail)
      .then(async (found) => {
        if (reset) {
          routeTo("reset_password");
          return;
        }

        let screen: ScreenName = found ? "confirm_invite" : "join_family_error";
        if (found && !isAuthenticated && found.invitedEmail) {
          setSignupHouseholdMode("join");
          try {
            const result = await checkEmailRegisteredServerFn({
              data: { email: found.invitedEmail },
            });
            screen = result.registered && result.hasPassword ? "login" : "signup";
          } catch {
            screen = "signup";
          }
        }
        routeTo(screen);
      })
      .catch(() => {
        if (reset) {
          routeTo("reset_password");
        } else {
          routeTo("join_family_error");
        }
      });
  }, [isAuthReady, isAuthenticated, isWebMode, routerNavigate, validateInviteCode]);
  const acceptInvite = async () => {
    if (!pendingInvite) return;

    if (isAuthenticated) {
      const invite = pendingInvite;
      const cleanName = profile.name.trim() || "You";
      await syncMutationServerFn({
        data: {
          type: "acceptInvite",
          data: {
            code: invite.code,
            name: cleanName,
            role: invite.role,
            initials: initialsFor(cleanName),
            personalCurrency: currencies.personal,
          },
        },
      });
      await syncDataAfterLogin();
      setPendingInvite(null);
      return;
    }

    const cleanName = profile.name.trim() || "You";
    const memberId = makeId("member");
    const inviterId = makeId("member");
    const nextHousehold: Household = {
      id: makeId("household"),
      name: pendingInvite.householdName,
      inviteCode: pendingInvite.code,
      role: pendingInvite.role,
      createdAt: "joined today",
    };
    const inviter: FamilyMember = {
      id: inviterId,
      name: pendingInvite.inviter,
      email: `${pendingInvite.inviter.toLowerCase().replace(/[^a-z0-9]+/g, ".")}@family.local`,
      role: "Admin",
      initials: initialsFor(pendingInvite.inviter),
      admin: true,
      permissions: permissionsForRole("Admin"),
    };
    const member: FamilyMember = {
      id: memberId,
      name: cleanName,
      email: profile.email,
      role: pendingInvite.role,
      initials: initialsFor(cleanName),
      admin: pendingInvite.role === "Admin",
      permissions: permissionsForRole(pendingInvite.role),
    };

    setHousehold(nextHousehold);
    setMembers([inviter, member]);
    setSelectedMemberId(memberId);
    setCurrencies((prev) => ({ ...prev, family: pendingInvite.familyCurrency }));
    setWallets(
      createBaseWallets(
        memberId,
        cleanName,
        pendingInvite.householdName,
        pendingInvite.familyCurrency,
      ),
    );
    clearHouseholdLedger();
    setPendingInvite(null);
    setBudgetModeState("family");
    setCurrencyTarget("family");

    try {
      await syncMutationServerFn({
        data: {
          type: "acceptInvite",
          data: {
            code: pendingInvite.code,
            name: cleanName,
            role: pendingInvite.role,
            initials: initialsFor(cleanName),
            personalCurrency: currencies.personal,
          },
        },
      });
      await syncDataAfterLogin();
    } catch (err) {
      console.info("Invite accepted locally until sign-in is available:", err);
    }
  };

  const addTransaction = (txn: Omit<Transaction, "id">) => {
    const newTxn = { ...txn, id: makeId("txn") };
    setTransactions((prev) => [newTxn, ...prev]);
    // Persist to DB in background
    syncMutationServerFn({ data: { type: "addTransaction", data: newTxn } }).catch(console.error);
    return newTxn;
  };

  const updateTransaction = (id: string, updatedFields: Partial<Transaction>) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...updatedFields } : t)));
    // Persist to DB in background
    const current = transactions.find((t) => t.id === id);
    if (current) {
      syncMutationServerFn({
        data: { type: "updateTransaction", data: { ...current, ...updatedFields } },
      }).catch(console.error);
    }
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    setSelectedTransactionId(null);
    setGoals((prevGoals) =>
      prevGoals.map((goal) => {
        const matches = goal.history.filter((entry) => entry.transactionId === id);
        if (matches.length === 0) return goal;
        const amountUsd = matches.reduce((sum, entry) => sum + entry.amountUsd, 0);
        return {
          ...goal,
          savedUsd: Math.max(0, goal.savedUsd - amountUsd),
          history: goal.history.filter((entry) => entry.transactionId !== id),
        };
      }),
    );
    syncMutationServerFn({ data: { type: "deleteTransaction", data: { id } } }).catch(
      console.error,
    );
  };

  const deleteContributionsFromGoal = (goalId: string, contributionIds: string[]) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    const transactionIds: string[] = [];
    let removedUsd = 0;

    contributionIds.forEach((id) => {
      const contribution = goal.history.find((h) => h.id === id);
      if (contribution) {
        removedUsd += contribution.amountUsd;
        if (contribution.transactionId) {
          transactionIds.push(contribution.transactionId);
        }
      }
    });

    if (transactionIds.length > 0) {
      setTransactions((prev) => prev.filter((t) => !transactionIds.includes(t.id)));
    }

    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        return {
          ...g,
          savedUsd: Math.max(0, g.savedUsd - removedUsd),
          history: g.history.filter(
            (h) =>
              !contributionIds.includes(h.id) &&
              (!h.transactionId || !transactionIds.includes(h.transactionId)),
          ),
        };
      }),
    );

    syncMutationServerFn({
      data: {
        type: "deleteContributions",
        data: {
          goalId,
          contributionIds,
          transactionIds,
        },
      },
    }).catch(console.error);
  };

  const deleteContributionFromGoal = (goalId: string, contributionId: string) => {
    deleteContributionsFromGoal(goalId, [contributionId]);
  };

  const recordTransfer = (
    amountUsd: number,
    fromWallet: string,
    toWallet: string,
    note: string,
  ) => {
    if (amountUsd <= 0) return;
    const id = makeId("transfer");
    const transferTransactions: Transaction[] = [
      {
        id: `${id}-out`,
        name: note || `Transfer to ${toWallet}`,
        who: `${firstName(profile.name)} · today`,
        usd: -amountUsd,
        category: "Transfer",
        wallet: fromWallet,
        date: "today",
      },
      {
        id: `${id}-in`,
        name: note || `Transfer from ${fromWallet}`,
        who: `${firstName(profile.name)} · today`,
        usd: amountUsd,
        category: "Transfer",
        wallet: toWallet,
        date: "today",
      },
    ];
    setTransactions((prev) => [...transferTransactions, ...prev]);
    syncMutationServerFn({
      data: { type: "recordTransfer", data: { transactions: transferTransactions } },
    }).catch(console.error);
  };

  const addWallet = (
    wallet: Omit<WalletAccount, "id" | "startingBalanceUsd"> & { startingBalanceUsd?: number },
  ) => {
    const newWallet = {
      ...wallet,
      id: makeId("wallet"),
      startingBalanceUsd: wallet.startingBalanceUsd ?? 0,
    };
    setWallets((prev) => [newWallet, ...prev]);
    // Persist to DB in background
    syncMutationServerFn({ data: { type: "addWallet", data: newWallet } }).catch(console.error);
    return newWallet;
  };

  const updateWallet = (
    walletId: string,
    updates: Partial<Omit<WalletAccount, "id">>
  ) => {
    const existingWallet = wallets.find((w) => w.id === walletId);
    setWallets((prev) =>
      prev.map((w) => (w.id === walletId ? { ...w, ...updates } : w))
    );
    if (existingWallet && updates.label && existingWallet.label !== updates.label) {
      setTransactions((prev) =>
        prev.map((t) =>
          t.wallet === existingWallet.label ? { ...t, wallet: updates.label! } : t
        )
      );
    }
    syncMutationServerFn({
      data: { type: "updateWallet", data: { id: walletId, ...updates } },
    }).catch(console.error);
  };

  const deleteWallet = (walletId: string) => {
    const existingWallet = wallets.find((w) => w.id === walletId);
    setWallets((prev) => prev.filter((w) => w.id !== walletId));
    if (existingWallet) {
      setTransactions((prev) =>
        prev.filter((t) => t.wallet !== existingWallet.label)
      );
    }
    syncMutationServerFn({
      data: { type: "deleteWallet", data: { id: walletId } },
    }).catch(console.error);
    if (selectedWalletId === walletId) {
      setSelectedWalletId(null);
    }
  };

  const setTheme = (nextTheme: "light" | "dark" | "system") => {
    setThemeState(nextTheme);
    localStorage.setItem("theme", nextTheme);
  };

  const setLanguage = (nextLang: "en" | "ja") => {
    setLanguageState(nextLang);
    localStorage.setItem("language", nextLang);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const isDark =
        theme === "dark" ||
        (theme === "system" && mediaQuery.matches);

      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    applyTheme();

    if (theme === "system") {
      mediaQuery.addEventListener("change", applyTheme);
      return () => mediaQuery.removeEventListener("change", applyTheme);
    }
  }, [theme]);

  const addCategory = (category: Omit<BudgetCategory, "id">) => {
    const newCategory = { ...category, id: makeId("category") };
    setCategories((prev) => [newCategory, ...prev]);
    // Persist to DB in background
    syncMutationServerFn({ data: { type: "addCategory", data: newCategory } }).catch(console.error);
    return newCategory;
  };

  const updateCategory = (categoryId: string, updates: Partial<Omit<BudgetCategory, "id">>) => {
    setCategories((prev) =>
      prev.map((category) => (category.id === categoryId ? { ...category, ...updates } : category)),
    );
    syncMutationServerFn({
      data: { type: "updateCategory", data: { id: categoryId, ...updates } },
    }).catch(console.error);
  };

  const updateCategoryLimit = (categoryId: string, limitUsd: number) => {
    updateCategory(categoryId, { limitUsd });
  };

  const deleteCategory = (categoryId: string) => {
    setCategories((prev) => prev.filter((category) => category.id !== categoryId));
    syncMutationServerFn({
      data: { type: "deleteCategory", data: { id: categoryId } },
    }).catch(console.error);
  };

  const categorySpentUsd = (label: string) => {
    const aliases = categoryAliases(label);
    const matchingTransactions = currentMonthTransactions.filter((transaction) =>
      aliases.some((alias) => `${transaction.category} ${transaction.name}`.toLowerCase().includes(alias)),
    );  
    const netSpentUsd = matchingTransactions.reduce((sum, transaction) => {
      if (transaction.usd < 0) return sum + transaction.usd;
      return isGoalLedgerTransaction(transaction) ? sum + transaction.usd : sum;
    }, 0);
    return Math.max(0, -netSpentUsd);
  };

  const addGoal = (goal: Omit<Goal, "id" | "savedUsd" | "history"> & { savedUsd?: number }) => {
    const newGoal: Goal = {
      ...goal,
      id: makeId("goal"),
      savedUsd: goal.savedUsd ?? 0,
      history: [],
    };
    setGoals((prev) => [newGoal, ...prev]);
    setSelectedGoalId(newGoal.id);
    // Persist to DB in background
    syncMutationServerFn({ data: { type: "addGoal", data: newGoal } }).catch(console.error);
    return newGoal;
  };

  const updateGoal = (
    goalId: string,
    updates: Partial<Omit<Goal, "id" | "history" | "savedUsd">>,
  ) => {
    setGoals((prev) => prev.map((goal) => (goal.id === goalId ? { ...goal, ...updates } : goal)));
    syncMutationServerFn({
      data: { type: "updateGoal", data: { id: goalId, ...updates } },
    }).catch(console.error);
  };

  const deleteGoal = (goalId: string) => {
    setGoals((prev) => prev.filter((goal) => goal.id !== goalId));
    setSelectedGoalId(null);
    syncMutationServerFn({
      data: { type: "deleteGoal", data: { id: goalId } },
    }).catch(console.error);
  };

  const contributeToGoal = (
    goalId: string,
    amountUsd: number,
    who = firstName(profile.name),
    walletId?: string,
  ) => {
    if (amountUsd <= 0) return;
    const contributorName = who || profile.name || "You";
    const goalToUpdate = goals.find((g) => g.id === goalId);
    if (!goalToUpdate) return;
    const contributionUsd = Math.min(
      amountUsd,
      Math.max(0, goalToUpdate.targetUsd - goalToUpdate.savedUsd),
    );
    if (contributionUsd <= 0) return;

    const selectedWallet = walletId
      ? activeWallets.find((w) => w.id === walletId)
      : activeWallets[0];
    const walletLabel = selectedWallet?.label || "Private Wallet";

    const transaction = addTransaction({
      name: `Goal Contribution: ${goalToUpdate.title}`,
      who: contributorName,
      usd: -contributionUsd,
      category: "Goals",
      wallet: walletLabel,
      date: formatISODate(new Date()),
    });
    const contribution = {
      id: transaction.id,
      who: contributorName,
      initials: initialsFor(contributorName),
      date: "Just now",
      amountUsd: contributionUsd,
      transactionId: transaction.id,
      memberId: currentMemberId ?? undefined,
      walletId: selectedWallet?.id,
    };
    const updatedSaved = Math.min(goalToUpdate.targetUsd, goalToUpdate.savedUsd + contributionUsd);
    const updatedHistory = [contribution, ...goalToUpdate.history];
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        return {
          ...g,
          savedUsd: updatedSaved,
          history: updatedHistory,
        };
      }),
    );
    syncMutationServerFn({
      data: {
        type: "updateGoalSavings",
        data: { id: goalId, savedUsd: updatedSaved, history: updatedHistory },
      },
    }).catch(console.error);
  };

  const withdrawFromGoal = (goalId: string, amountUsd: number, wallet: string) => {
    if (amountUsd <= 0) return;
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    const withdrawalUsd = Math.min(amountUsd, goal.savedUsd);
    if (withdrawalUsd <= 0) return;
    const withdrawerName = firstName(profile.name);
    const selectedWallet = activeWallets.find((w) => w.label === wallet);
    const transaction = addTransaction({
      name: `Goal Withdrawal: ${goal.title}`,
      who: withdrawerName,
      usd: withdrawalUsd,
      category: "Goals",
      wallet,
      date: formatISODate(new Date()),
    });
    const withdrawal = {
      id: transaction.id,
      who: withdrawerName,
      initials: profile.initials || initialsFor(withdrawerName),
      date: "Just now",
      amountUsd: -withdrawalUsd,
      transactionId: transaction.id,
      memberId: currentMemberId ?? undefined,
      walletId: selectedWallet?.id,
    };
    const updatedSaved = Math.max(0, goal.savedUsd - withdrawalUsd);
    const updatedHistory = [withdrawal, ...goal.history];
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? {
              ...g,
              savedUsd: updatedSaved,
              history: updatedHistory,
            }
          : g,
      ),
    );
    syncMutationServerFn({
      data: {
        type: "updateGoalSavings",
        data: {
          id: goalId,
          savedUsd: updatedSaved,
          history: updatedHistory,
        },
      },
    }).catch(console.error);
  };

  const inviteMember = (role: MemberRole, email?: string) => {
    const cleanEmail = email?.trim().toLowerCase();
    const emailName = cleanEmail?.split("@")[0] ?? "";
    const formattedName = emailName
      ? emailName.replace(/[._-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
      : `Invited ${role}`;
    const newMember: FamilyMember = {
      id: makeId("member"),
      name: formattedName,
      email: cleanEmail ?? `${role.toLowerCase()}@pending.invite`,
      role,
      initials: initialsFor(formattedName),
      permissions: permissionsForRole(role),
    };
    setMembers((prev) => [...prev, newMember]);
    setSelectedMemberId(newMember.id);
    setNotifications((prev) => [
      {
        id: makeId("notice"),
        title: `${role} invite created`,
        desc: household
          ? `Invite code ${household.inviteCode} is ready to share`
          : "Create a household to generate an invite code",
        time: "now",
        group: "Today",
        tone: "primary",
        read: false,
        screen: "family",
      },
      ...prev,
    ]);
    // Persist to DB in background
    syncMutationServerFn({ data: { type: "inviteMember", data: newMember } }).catch(console.error);
    return newMember;
  };

  const updateMember = (id: string, updates: Partial<FamilyMember>) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
    // Persist to DB in background — merge updates with current member
    const current = members.find((m) => m.id === id);
    if (current) {
      syncMutationServerFn({
        data: { type: "updateMember", data: { ...current, ...updates, id } },
      }).catch(console.error);
    }
  };

  const updateMemberPermission = (memberId: string, permission: string, on: boolean) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId ? { ...m, permissions: { ...m.permissions, [permission]: on } } : m,
      ),
    );
    // Persist updated permissions to DB in background
    const current = members.find((m) => m.id === memberId);
    if (current) {
      syncMutationServerFn({
        data: {
          type: "updateMember",
          data: {
            ...current,
            permissions: { ...current.permissions, [permission]: on },
            id: memberId,
          },
        },
      }).catch(console.error);
    }
  };

  const removeMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    if (selectedMemberId === id) setSelectedMemberId(null);
    setSelectedMemberIds((prev) => prev.filter((memberId) => memberId !== id));
    // Persist to DB in background
    syncMutationServerFn({ data: { type: "removeMember", data: { id } } }).catch(console.error);
  };

  const removeMembers = (ids: string[]) => {
    const uniqueIds = Array.from(new Set(ids));
    if (uniqueIds.length === 0) return;
    setMembers((prev) => prev.filter((member) => !uniqueIds.includes(member.id)));
    if (selectedMemberId && uniqueIds.includes(selectedMemberId)) setSelectedMemberId(null);
    setSelectedMemberIds([]);
    uniqueIds.forEach((id) => {
      syncMutationServerFn({ data: { type: "removeMember", data: { id } } }).catch(console.error);
    });
  };

  const scheduleAllowance = (memberId: string, amountUsd: number, day: string) => {
    const member = members.find((m) => m.id === memberId);
    if (!member || amountUsd <= 0) return;
    updateMember(memberId, { allowanceUsd: amountUsd, allowanceDay: day, allowanceOn: true });
    const label = `Allowance · ${member.name.split(" ")[0]}`;
    const existingAllowance = recurringIncome.find((item) => item.label === label);
    const nextDate = nextDateFromWeekday(day);
    const meta = makeScheduleMeta({ frequency: "weekly", nextDate, category: "Allowance" });
    const newAllowance: ScheduleItem = {
      id: existingAllowance?.id ?? makeId("allowance"),
      label,
      every: meta.every,
      amountUsd,
      color: "oklch(0.65 0.22 320)",
      type: "income",
    };
    setRecurringIncome((prev) => [
      newAllowance,
      ...prev.filter((item) => item.id !== newAllowance.id && item.label !== label),
    ]);
    syncMutationServerFn({
      data: { type: "addScheduleItem", data: newAllowance },
    }).catch(console.error);
  };

  const connectSelectedBank = () => {
    if (linkedBanks.some((bank) => bank.name === selectedBankName)) return;
    const bank: LinkedBank = {
      id: makeId("bank"),
      name: selectedBankName,
      connectedAt: "just now",
      accounts: [{ name: `${selectedBankName} Checking`, balanceUsd: 0 }],
    };
    setLinkedBanks((prev) => [bank, ...prev]);
    const connectedWallet: WalletAccount = {
      id: makeId("wallet"),
      label: `${selectedBankName} Checking`,
      sub: "Connected bank",
      type: "connected",
      currency: currencies.personal,
      members: [
        currentMemberId ?? members.find((member) => member.email === profile.email)?.id ?? "me",
      ],
      color: "oklch(0.45 0.18 250)",
      startingBalanceUsd: 0,
    };
    setWallets((prev) =>
      prev.some((wallet) => wallet.label === `${selectedBankName} Checking`)
        ? prev
        : [connectedWallet, ...prev],
    );
    setNotifications((prev) => [
      {
        id: makeId("notice"),
        title: `${selectedBankName} synced`,
        desc: "Connected wallet is ready in Wallets",
        time: "now",
        group: "Today",
        tone: "success",
        read: false,
        screen: "wallet",
      },
      ...prev,
    ]);
    // Persist bank connection and wallet to DB in background
    syncMutationServerFn({ data: { type: "connectSelectedBank", data: bank } }).catch(
      console.error,
    );
    syncMutationServerFn({ data: { type: "addWallet", data: connectedWallet } }).catch(
      console.error,
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    syncMutationServerFn({ data: { type: "markAllNotificationsRead", data: {} } }).catch(
      console.error,
    );
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    syncMutationServerFn({ data: { type: "markNotificationRead", data: { id } } }).catch(
      console.error,
    );
  };

  const toggleNotificationPref = (key: string) => {
    setNotificationPrefs((prev) => {
      const next: Record<string, boolean> = { ...prev, [key]: !prev[key] };
      syncMutationServerFn({
        data: { type: "setNotificationPrefs", data: { notificationPrefs: next } },
      }).catch(console.error);
      return next;
    });
  };

  const addRecurringIncome = (item: Partial<ScheduleItem> = {}) => {
    const defaultNextDate = formatISODate(plusDays(new Date(), 7));
    const fallbackMeta = makeScheduleMeta({
      frequency: "monthly",
      nextDate: defaultNextDate,
      category: "Income",
    });
    const newItem: ScheduleItem = {
      id: makeId("income-schedule"),
      label: item.label ?? "New income schedule",
      every: item.every ?? fallbackMeta.every,
      amountUsd: item.amountUsd ?? 500,
      color: item.color ?? "oklch(0.7 0.18 150)",
      type: "income",
    };
    setRecurringIncome((prev) => [newItem, ...prev]);
    // Persist to DB in background
    syncMutationServerFn({ data: { type: "addScheduleItem", data: newItem } }).catch(console.error);
  };

  const addSubscription = (item: Partial<ScheduleItem> = {}) => {
    const defaultNextDate = formatISODate(plusDays(new Date(), 7));
    const fallbackMeta = makeScheduleMeta({
      frequency: "monthly",
      nextDate: defaultNextDate,
      category: "Expense",
    });
    const newItem: ScheduleItem = {
      id: makeId("subscription"),
      label: item.label ?? "New subscription",
      every: item.every ?? fallbackMeta.every,
      amountUsd: item.amountUsd ?? 24.99,
      color: item.color ?? "oklch(0.65 0.22 30)",
      type: "subscription",
    };
    setSubscriptions((prev) => [newItem, ...prev]);
    // Persist to DB in background
    syncMutationServerFn({ data: { type: "addScheduleItem", data: newItem } }).catch(console.error);
  };

  const updateScheduleItem = (id: string, updates: Partial<Omit<ScheduleItem, "id">>) => {
    const current =
      recurringIncome.find((item) => item.id === id) ??
      subscriptions.find((item) => item.id === id);
    if (!current) return;

    const nextItem: ScheduleItem = {
      ...current,
      ...updates,
      id,
      type: updates.type ?? current.type,
    };

    setRecurringIncome((prev) => {
      const withoutItem = prev.filter((item) => item.id !== id);
      if (nextItem.type !== "income") return withoutItem;
      return prev.some((item) => item.id === id)
        ? prev.map((item) => (item.id === id ? nextItem : item))
        : [nextItem, ...withoutItem];
    });
    setSubscriptions((prev) => {
      const withoutItem = prev.filter((item) => item.id !== id);
      if (nextItem.type !== "subscription") return withoutItem;
      return prev.some((item) => item.id === id)
        ? prev.map((item) => (item.id === id ? nextItem : item))
        : [nextItem, ...withoutItem];
    });

    syncMutationServerFn({ data: { type: "updateScheduleItem", data: nextItem } }).catch(
      console.error,
    );
  };

  const deleteScheduleItems = (ids: string[]) => {
    setRecurringIncome((prev) => prev.filter((item) => !ids.includes(item.id)));
    setSubscriptions((prev) => prev.filter((item) => !ids.includes(item.id)));
    syncMutationServerFn({ data: { type: "removeScheduleItems", data: { ids } } }).catch(
      console.error,
    );
  };

  const deleteScheduleItem = (id: string) => {
    deleteScheduleItems([id]);
  };

  const addLoanEntry = (
    entry: Omit<LoanEntry, "id" | "createdAt" | "paidAmountUsd"> & { paidAmountUsd?: number },
  ) => {
    const newEntry: LoanEntry = {
      ...entry,
      paidAmountUsd: entry.paidAmountUsd ?? 0,
      id: makeId("loan"),
      createdAt: "today",
    };
    setLoanEntries((prev) => [newEntry, ...prev]);
    syncMutationServerFn({ data: { type: "addLoanEntry", data: newEntry } }).catch(console.error);
    return newEntry;
  };

  const updateLoanEntry = (id: string, updates: Partial<Omit<LoanEntry, "id" | "createdAt">>) => {
    setLoanEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry)),
    );
    const current = loanEntries.find((entry) => entry.id === id);
    if (current) {
      syncMutationServerFn({
        data: { type: "updateLoanEntry", data: { ...current, ...updates, id } },
      }).catch(console.error);
    }
  };

  const deleteLoanEntries = (ids: string[]) => {
    setLoanEntries((prev) => prev.filter((entry) => !ids.includes(entry.id)));
    ids.forEach((id) =>
      syncMutationServerFn({ data: { type: "deleteLoanEntry", data: { id } } }).catch(
        console.error,
      ),
    );
  };

  const addTrackedProduct = (product: Omit<ProductEntry, "id" | "createdAt">) => {
    const newProduct: ProductEntry = {
      ...product,
      id: makeId("product"),
      createdAt: "today",
    };
    setTrackedProducts((prev) => [newProduct, ...prev]);
    syncMutationServerFn({ data: { type: "addTrackedProduct", data: newProduct } }).catch(
      console.error,
    );
    return newProduct;
  };

  const scanReceiptImage = async (imageDataUrl: string) => {
    const existingCategories = categories.map((c) => c.label);
    const result = (await scanReceiptServerFn({
      data: { imageDataUrl, currency, categories: existingCategories },
    })) as ReceiptScan;
    return {
      ...result,
      currency: (result.currency || currency) as CurrencyCode,
      createdAt: result.createdAt || "today",
      items: Array.isArray(result.items) ? result.items : [],
    };
  };

  const saveReceiptScan = (scan: ReceiptScan) => {
    const normalizedScan: ReceiptScan = {
      ...scan,
      id: scan.id || makeId("receipt"),
      createdAt: scan.createdAt || "today",
      items: Array.isArray(scan.items) ? scan.items : [],
    };

    // Auto-create category if it does not exist
    const existingLabels = new Set(categories.map((c) => c.label));
    const categoriesToCreate = new Set<string>();
    normalizedScan.items.forEach((item) => {
      const catName = item.category || "Groceries";
      if (!existingLabels.has(catName)) {
        categoriesToCreate.add(catName);
      }
    });

    const colors = [
      "oklch(0.65 0.25 140)", // Green
      "oklch(0.60 0.20 20)", // Coral/Red
      "oklch(0.55 0.24 265)", // Purple
      "oklch(0.70 0.15 80)", // Orange
      "oklch(0.60 0.15 200)", // Blue
      "oklch(0.65 0.20 300)", // Magenta
    ];
    let colorIdx = 0;

    categoriesToCreate.forEach((catName) => {
      addCategory({
        label: catName,
        limitUsd: 100,
        color: colors[colorIdx % colors.length],
        icon: iconForCategoryLabel(catName),
      });
      colorIdx++;
    });

    const products: ProductEntry[] = normalizedScan.items.map((item) => ({
      id: makeId("product"),
      name: item.name,
      store: normalizedScan.storeName,
      category: item.category || "Groceries",
      amountUsd: item.totalUsd,
      quantity: item.quantity || 1,
      unitPriceUsd: item.unitPriceUsd,
      purchasedAt: normalizedScan.purchasedAt,
      source: "receipt",
      createdAt: "today",
    }));
    const walletLabel = activeWallets[0]?.label ?? wallets[0]?.label;
    const transaction: Transaction | null =
      walletLabel && normalizedScan.totalUsd > 0
        ? {
            id: makeId("txn"),
            name: normalizedScan.storeName || "Receipt purchase",
            who: `${firstName(profile.name)} · today`,
            usd: -normalizedScan.totalUsd,
            category: products[0]?.category ?? "Groceries",
            wallet: walletLabel,
            date: normalizedScan.purchasedAt || "today",
          }
        : null;

    setReceiptScans((prev) => [
      normalizedScan,
      ...prev.filter((receipt) => receipt.id !== normalizedScan.id),
    ]);
    setTrackedProducts((prev) => [...products, ...prev]);
    if (transaction) setTransactions((prev) => [transaction, ...prev]);
    syncMutationServerFn({
      data: {
        type: "saveReceiptScan",
        data: { receipt: normalizedScan, products, transaction },
      },
    }).catch(console.error);
  };

  const setHistoryFilters = (filters: Partial<HistoryFilters>) => {
    setHistoryFilterState((prev) => {
      const next = { ...prev, ...filters };
      syncMutationServerFn({
        data: { type: "setHistoryFilters", data: { historyFilters: next } },
      }).catch(console.error);
      return next;
    });
  };

  const resetHistoryFilters = () => {
    setHistoryFilterState(defaultHistoryFilters);
    syncMutationServerFn({
      data: { type: "setHistoryFilters", data: { historyFilters: defaultHistoryFilters } },
    }).catch(console.error);
  };

  const updateProfile = (updates: Partial<Profile>) => {
    setProfile((prev) => {
      const next = {
        ...prev,
        ...updates,
        initials: updates.name ? initialsFor(updates.name) : prev.initials,
      };
      // Persist to DB in background
      syncMutationServerFn({ data: { type: "updateProfile", data: next } }).catch(console.error);
      return next;
    });
  };

  // Fetch data from the database and populate local state after authentication
  const syncDataAfterLogin = useCallback(async () => {
    try {
      const data = await getAppDataServerFn();
      if (!data || !data.isAuthenticated) {
        setIsAuthenticated(false);
        return false;
      }

      setIsAuthenticated(true);
      const restoredPendingInvite = data.pendingInvite as HouseholdInvite | null | undefined;
      if (restoredPendingInvite) {
        setPendingInvite(restoredPendingInvite);
        setSignupHouseholdMode("join");
      } else if (data.household) {
        setPendingInvite(null);
      }

      if (isWebMode) {
        const currentSlug = window.location.pathname.split("/").pop() ?? "home";
        if (
          currentSlug === "login" ||
          currentSlug === "signup" ||
          currentSlug === "onboarding" ||
          currentSlug === "reset_password"
        ) {
          routerNavigate({
            to: "/app/$screen",
            params: { screen: restoredPendingInvite ? "confirm_invite" : "home" },
          }).catch(console.error);
        }
      } else {
        setCurrentScreen((screen) =>
          screen === "onboarding" || screen === "login" || screen === "signup" || screen === "reset_password"
            ? restoredPendingInvite
              ? "confirm_invite"
              : "home"
            : screen,
        );
      }

      setProfile({
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone,
        pronouns: data.user.pronouns,
        initials: data.user.initials,
      });

      setCurrencies({
        personal: (data.currencies?.personal ?? "USD") as CurrencyCode,
        family: (data.currencies?.family ?? "UZS") as CurrencyCode,
      });
      setReportPeriodState(normalizeReportPeriodInput(data.user.reportPeriod));
      setNotificationPrefs((prev) => ({
        ...prev,
        ...asRecord(data.user.notificationPrefs),
      } as Record<string, boolean>));
      setHistoryFilterState(normalizeHistoryFiltersInput(data.user.historyFilters));
      setPasscodeState(data.user.passcode ?? "");
      setFaceIdEnabledState(data.user.faceIdEnabled);
      setCompactMoneyModeState(Boolean(data.user.compactMoneyMode));

      if (data.household) {
        setBudgetModeState(normalizeBudgetModeInput(data.user.budgetMode));
        setHousehold({
          id: data.household.id,
          name: data.household.name,
          inviteCode: data.household.inviteCode,
          role: data.household.role as MemberRole,
          createdAt: data.household.createdAt,
        });
        setCurrencyTarget("family");
      } else {
        setHousehold(null);
        setBudgetModeState("personal");
        setCurrencyTarget("personal");
      }

      const nextMembers = data.members.map((m) => ({
        ...m,
        role: m.role as MemberRole,
        admin: m.role === "Admin",
      }));
      setMembers(nextMembers);
      const currentMember =
        nextMembers.find(
          (member) => member.email?.trim().toLowerCase() === data.user.email.trim().toLowerCase(),
        ) ?? nextMembers[0];
      setSelectedMemberId(currentMember?.id ?? null);
      setSelectedMemberIds([]);

      setWallets(
        data.wallets.map((w) => ({
          ...w,
          type: w.type as WalletType,
          currency: w.currency as CurrencyCode,
        })),
      );

      setCategories(data.categories);
      setTransactions(data.transactions);
      setGoals(data.goals);
      setSelectedGoalId(data.goals[0]?.id ?? null);
      setLinkedBanks(data.linkedBanks);
      setRecurringIncome(data.recurringIncome);
      setSubscriptions(data.subscriptions);
      setLoanEntries(
        (data.loanEntries ?? []).map((entry) => ({
          ...entry,
          ownerMemberId: entry.ownerMemberId,
          paidAmountUsd: entry.paidAmountUsd ?? 0,
          direction: entry.direction as LoanDirection,
          status: entry.status as LoanStatus,
        })),
      );
      setTrackedProducts(
        (data.trackedProducts ?? []).map((product) => ({
          ...product,
          source: product.source === "receipt" ? "receipt" : "manual",
        })),
      );
      setReceiptScans(
        (data.receiptScans ?? []).map((receipt) => ({
          ...receipt,
          currency: receipt.currency as CurrencyCode,
          items: Array.isArray(receipt.items) ? receipt.items : [],
        })),
      );
      setNotifications(data.notifications as AppNotification[]);
      return true;
    } catch (err) {
      console.error("Failed to sync data after login:", err);
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsAuthReady(true);
    }
  }, []);

  setCompactMoneyFormatterMode(compactMoneyMode);

  // Fire syncDataAfterLogin once on mount if already authenticated
  useEffect(() => {
    syncDataAfterLogin();
  }, [syncDataAfterLogin]);

  return (
    <NavigationContext.Provider
      value={{
        currentScreen,
        history,
        navigate,
        goBack,
        isAuthenticated,
        isAuthReady,
        signupHouseholdMode,
        setSignupHouseholdMode,
        logout,
        budgetMode,
        salaryCalculatorSettings,
        setSalaryCalculatorSettings,
        setBudgetMode,
        reportPeriod,
        setReportPeriod,
        profile,
        updateProfile,
        household,
        pendingInvite,
        createHousehold,
        validateInviteCode,
        acceptInvite,
        syncDataAfterLogin,
        currency,
        setCurrency,
        currencies,
        currencyTarget,
        setCurrencyTarget,
        setCurrencyForMode,
        transactions,
        activeTransactions,
        currentMonthTransactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        deleteContributionFromGoal,
        deleteContributionsFromGoal,
        recordTransfer,
        balanceUsd,
        incomeUsd,
        spentUsd,
        selectedTransactionId,
        setSelectedTransactionId,
        selectedMonthHistory,
        setSelectedMonthHistory,
        wallets,
        activeWallets,
        addWallet,
        updateWallet,
        deleteWallet,
        selectedWalletId,
        setSelectedWalletId,
        selectedDetailWalletId,
        setSelectedDetailWalletId,
        theme,
        setTheme,
        language,
        setLanguage,
        walletBalanceUsd,
        categories,
        addCategory,
        updateCategory,
        updateCategoryLimit,
        deleteCategory,
        categorySpentUsd,
        goals: visibleGoals,
        selectedGoalId,
        setSelectedGoalId,
        addGoal,
        updateGoal,
        deleteGoal,
        contributeToGoal,
        withdrawFromGoal,
        members,
        currentMemberId,
        selectedMemberId,
        setSelectedMemberId,
        selectedMemberIds,
        setSelectedMemberIds,
        inviteMember,
        updateMember,
        updateMemberPermission,
        removeMember,
        removeMembers,
        scheduleAllowance,
        linkedBanks,
        selectedBankName,
        setSelectedBankName,
        connectSelectedBank,
        notifications,
        markAllNotificationsRead,
        markNotificationRead,
        notificationPrefs,
        toggleNotificationPref,
        recurringIncome,
        addRecurringIncome,
        subscriptions,
        addSubscription,
        updateScheduleItem,
        deleteScheduleItem,
        deleteScheduleItems,
        loanEntries,
        addLoanEntry,
        updateLoanEntry,
        deleteLoanEntries,
        trackedProducts,
        addTrackedProduct,
        receiptScans,
        scanReceiptImage,
        saveReceiptScan,
        historyFilters,
        setHistoryFilters,
        resetHistoryFilters,
        passcode,
        setPasscode,
        faceIdEnabled,
        setFaceIdEnabled,
        compactMoneyMode,
        setCompactMoneyMode,
        resetToken,
        setResetToken,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useOptionalAppNavigation() {
  return useContext(NavigationContext);
}

export function useAppNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useAppNavigation must be used within an AppNavigationProvider");
  }
  return context;
}
