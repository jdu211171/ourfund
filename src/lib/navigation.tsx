import { createContext, useContext, useMemo, useState, useCallback, ReactNode } from "react";
import { defaultHistoryFilters, defaultPermissions, getInitialSeed, knownInvites } from "./seed";
import { getAppDataServerFn, syncMutationServerFn } from "./server-fns";

export type ScreenName =
  | "onboarding"
  | "login"
  | "signup"
  | "join_family"
  | "join_family_error"
  | "confirm_invite"
  | "home"
  | "wallet"
  | "new_wallet"
  | "connect_bank"
  | "plaid_connecting"
  | "plaid_success"
  | "categories"
  | "new_category"
  | "subscriptions"
  | "recurring_income"
  | "new_goal"
  | "goal_detail"
  | "goal_withdraw"
  | "goal_achieved"
  | "reports_week"
  | "reports_month"
  | "reports_year"
  | "analytics"
  | "alerts"
  | "family"
  | "invite_member"
  | "permissions"
  | "allowance"
  | "settings"
  | "edit_profile"
  | "passcode"
  | "notif_prefs"
  | "currency"
  | "empty_history"
  | "remove_member"
  | "add_expense"
  | "add_income"
  | "transfer"
  | "expense_detail"
  | "income_detail"
  | "edit_expense"
  | "delete_confirm"
  | "filter_sort"
  | "receipt"
  | "history_search";

export type BudgetMode = "personal" | "family";
export type CurrencyCode =
  | "UZS"
  | "USD"
  | "EUR"
  | "GBP"
  | "AUD"
  | "JPY"
  | "CHF"
  | "SEK"
  | "NOK"
  | "DKK"
  | "MXN"
  | "BRL";
export type WalletType = "shared" | "private" | "connected";
export type MemberRole = "Admin" | "Adult" | "Teen" | "Kid";
export type NotificationTone = "success" | "danger" | "warn" | "primary";
export type TxnKind = "All" | "Expense" | "Income" | "Goals" | "Transfer";

export interface Transaction {
  id: string;
  name: string;
  who: string;
  usd: number;
  category: string;
  wallet: string;
  date: string;
}

export interface WalletAccount {
  id: string;
  label: string;
  sub: string;
  type: WalletType;
  currency: CurrencyCode;
  members: string[];
  color: string;
  startingBalanceUsd: number;
}

export interface BudgetCategory {
  id: string;
  label: string;
  limitUsd: number;
  color: string;
  icon: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  initials: string;
  admin?: boolean;
  age?: number;
  allowanceUsd?: number;
  allowanceDay?: string;
  allowanceOn?: boolean;
  permissions: Record<string, boolean>;
}

export interface Goal {
  id: string;
  title: string;
  targetUsd: number;
  savedUsd: number;
  targetDate: string;
  icon: string;
  color: string;
  contributors: string[];
  history: { id: string; who: string; initials: string; date: string; amountUsd: number }[];
}

export interface LinkedBank {
  id: string;
  name: string;
  connectedAt: string;
  accounts: { name: string; balanceUsd: number }[];
}

export interface ScheduleItem {
  id: string;
  label: string;
  every: string;
  amountUsd: number;
  color: string;
  type: "income" | "subscription";
}

export interface AppNotification {
  id: string;
  title: string;
  desc: string;
  time: string;
  group: string;
  tone: NotificationTone;
  read: boolean;
  screen: ScreenName;
}

export interface HistoryFilters {
  kind: TxnKind;
  member: string;
  categories: string[];
  sort: string;
  minUsd: number;
  maxUsd: number;
}

export interface Profile {
  name: string;
  email: string;
  phone: string;
  pronouns: string;
  initials: string;
}

export interface Household {
  id: string;
  name: string;
  inviteCode: string;
  role: MemberRole;
  createdAt: string;
}

export interface HouseholdInvite {
  code: string;
  householdName: string;
  memberCount: number;
  role: MemberRole;
  inviter: string;
  familyCurrency: CurrencyCode;
}

export interface CurrencySettings {
  personal: CurrencyCode;
  family: CurrencyCode;
}

export interface AppSeed {
  budgetMode: BudgetMode;
  profile: Profile;
  household: Household | null;
  currencies: CurrencySettings;
  transactions: Transaction[];
  wallets: WalletAccount[];
  categories: BudgetCategory[];
  goals: Goal[];
  members: FamilyMember[];
  selectedGoalId: string | null;
  selectedMemberId: string | null;
  selectedBankName: string;
  linkedBanks: LinkedBank[];
  notifications: AppNotification[];
  notificationPrefs: Record<string, boolean>;
  recurringIncome: ScheduleItem[];
  subscriptions: ScheduleItem[];
  historyFilters: HistoryFilters;
  passcode: string;
  faceIdEnabled: boolean;
}

interface NavigationContextType {
  currentScreen: ScreenName;
  history: ScreenName[];
  navigate: (screen: ScreenName) => void;
  goBack: () => void;
  budgetMode: BudgetMode;
  setBudgetMode: (mode: BudgetMode) => void;
  profile: Profile;
  updateProfile: (profile: Partial<Profile>) => void;
  household: Household | null;
  pendingInvite: HouseholdInvite | null;
  createHousehold: (input: { name: string; email: string; householdName: string }) => Household;
  validateInviteCode: (code: string) => Promise<HouseholdInvite | null>;
  acceptInvite: () => void;
  syncDataAfterLogin: () => Promise<void>;
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  currencies: CurrencySettings;
  currencyTarget: BudgetMode;
  setCurrencyTarget: (target: BudgetMode) => void;
  setCurrencyForMode: (mode: BudgetMode, currency: CurrencyCode) => void;
  transactions: Transaction[];
  activeTransactions: Transaction[];
  addTransaction: (txn: Omit<Transaction, "id">) => Transaction;
  updateTransaction: (id: string, txn: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  recordTransfer: (amountUsd: number, fromWallet: string, toWallet: string, note: string) => void;
  balanceUsd: number;
  incomeUsd: number;
  spentUsd: number;
  selectedTransactionId: string | null;
  setSelectedTransactionId: (id: string | null) => void;
  wallets: WalletAccount[];
  addWallet: (
    wallet: Omit<WalletAccount, "id" | "startingBalanceUsd"> & { startingBalanceUsd?: number },
  ) => WalletAccount;
  walletBalanceUsd: (walletLabel: string) => number;
  categories: BudgetCategory[];
  addCategory: (category: Omit<BudgetCategory, "id">) => BudgetCategory;
  updateCategoryLimit: (categoryId: string, limitUsd: number) => void;
  categorySpentUsd: (label: string) => number;
  goals: Goal[];
  selectedGoalId: string | null;
  setSelectedGoalId: (id: string | null) => void;
  addGoal: (goal: Omit<Goal, "id" | "savedUsd" | "history"> & { savedUsd?: number }) => Goal;
  contributeToGoal: (goalId: string, amountUsd: number, who?: string) => void;
  withdrawFromGoal: (goalId: string, amountUsd: number, wallet: string) => void;
  members: FamilyMember[];
  selectedMemberId: string | null;
  setSelectedMemberId: (id: string | null) => void;
  inviteMember: (role: MemberRole) => FamilyMember;
  updateMember: (id: string, updates: Partial<FamilyMember>) => void;
  updateMemberPermission: (memberId: string, permission: string, on: boolean) => void;
  removeMember: (id: string) => void;
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
  historyFilters: HistoryFilters;
  setHistoryFilters: (filters: Partial<HistoryFilters>) => void;
  resetHistoryFilters: () => void;
  passcode: string;
  setPasscode: (passcode: string) => void;
  faceIdEnabled: boolean;
  setFaceIdEnabled: (enabled: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function makeInviteCode() {
  return `NEST-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function initialsFor(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function firstName(name: string) {
  return name.trim().split(" ").filter(Boolean)[0] ?? "You";
}

function permissionsForRole(role: MemberRole) {
  return {
    ...defaultPermissions,
    "Add or remove members": role === "Admin",
    "Edit budget limits": role !== "Kid",
    "Connect bank accounts": role === "Admin" || role === "Adult",
    "View private wallets": role === "Admin" || role === "Adult",
  };
}

function categoryAliases(label: string) {
  const lower = label.toLowerCase();
  if (lower.includes("rent") || lower.includes("util")) return ["rent", "housing", "electric"];
  if (lower.includes("dining")) return ["dining", "coffee", "restaurant"];
  if (lower.includes("transport")) return ["transport", "gas", "car"];
  return [lower];
}

export function AppNavigationProvider({ children }: { children: ReactNode }) {
  const initialSeed = useMemo(() => getInitialSeed(), []);
  const [currentScreen, setCurrentScreen] = useState<ScreenName>("onboarding");
  const [history, setHistory] = useState<ScreenName[]>([]);
  const [budgetMode, setBudgetMode] = useState<BudgetMode>(initialSeed.budgetMode);
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
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(initialSeed.selectedGoalId);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(
    initialSeed.selectedMemberId,
  );
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
  const [historyFilters, setHistoryFilterState] = useState<HistoryFilters>(
    initialSeed.historyFilters,
  );
  const [passcode, setPasscodeState] = useState(initialSeed.passcode);
  const [faceIdEnabled, setFaceIdEnabledState] = useState(initialSeed.faceIdEnabled);

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

  const navigate = (screen: ScreenName) => {
    setHistory((prev) => (screen === currentScreen ? prev : [...prev, currentScreen]));
    setCurrentScreen(screen);
  };

  const goBack = () => {
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
  };

  const currency = currencies[budgetMode];

  const setCurrencyForMode = (mode: BudgetMode, nextCurrency: CurrencyCode) => {
    setCurrencies((prev) => ({ ...prev, [mode]: nextCurrency }));
  };

  const setCurrency = (nextCurrency: CurrencyCode) => {
    setCurrencyForMode(budgetMode, nextCurrency);
  };

  const activeWallets = useMemo(
    () =>
      wallets.filter((w) =>
        budgetMode === "personal" ? w.type === "private" : w.type !== "private",
      ),
    [budgetMode, wallets],
  );

  const activeTransactions = useMemo(() => {
    const activeWalletLabels = new Set(activeWallets.map((wallet) => wallet.label));
    return transactions.filter((transaction) => activeWalletLabels.has(transaction.wallet));
  }, [activeWallets, transactions]);

  const walletBalanceUsd = (walletLabel: string) => {
    const wallet = wallets.find((w) => w.label === walletLabel);
    const txTotal = transactions
      .filter((t) => t.wallet === walletLabel)
      .reduce((sum, t) => sum + t.usd, 0);
    return (wallet?.startingBalanceUsd ?? 0) + txTotal;
  };

  const incomeUsd = activeTransactions.filter((t) => t.usd > 0).reduce((sum, t) => sum + t.usd, 0);
  const spentUsd = Math.abs(
    activeTransactions.filter((t) => t.usd < 0).reduce((sum, t) => sum + t.usd, 0),
  );
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
    setSelectedTransactionId(null);
    setSelectedGoalId(null);
  };

  const createHousehold = (input: { name: string; email: string; householdName: string }) => {
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
    setBudgetMode("family");
    setCurrencyTarget("family");

    // Persist to DB (creates household, member, and wallets in DB)
    syncMutationServerFn({
      data: {
        type: "createHousehold",
        data: { name: cleanName, householdName: cleanHouseholdName, initials: initialsFor(cleanName) },
      },
    }).catch(console.error);

    return nextHousehold;
  };

  const validateInviteCode = async (code: string): Promise<HouseholdInvite | null> => {
    const normalized = code.trim().toUpperCase();

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
        const result = await syncMutationServerFn({
          data: { type: "validateInviteCode", data: { code: normalized } },
        });
        dbInvite = result as HouseholdInvite | null;
      } catch {
        // ignore lookup errors — treat as invalid code
      }
    }

    const invite = currentInvite ?? seededInvite ?? dbInvite;
    setPendingInvite(invite);
    return invite;
  };

  const acceptInvite = () => {
    if (!pendingInvite) return;

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
    setBudgetMode("family");
    setCurrencyTarget("family");

    // Persist to DB — joins the user to the household and creates a personal wallet
    syncMutationServerFn({
      data: {
        type: "acceptInvite",
        data: {
          code: pendingInvite.code,
          name: cleanName,
          role: pendingInvite.role,
          initials: initialsFor(cleanName),
        },
      },
    }).catch(console.error);
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
      syncMutationServerFn({ data: { type: "updateTransaction", data: { ...current, ...updatedFields } } }).catch(console.error);
    }
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    setSelectedTransactionId(null);
    // Persist to DB in background
    syncMutationServerFn({ data: { type: "deleteTransaction", data: { id } } }).catch(console.error);
  };

  const recordTransfer = (
    amountUsd: number,
    fromWallet: string,
    toWallet: string,
    note: string,
  ) => {
    if (amountUsd <= 0) return;
    const id = makeId("transfer");
    setTransactions((prev) => [
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
      ...prev,
    ]);
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

  const addCategory = (category: Omit<BudgetCategory, "id">) => {
    const newCategory = { ...category, id: makeId("category") };
    setCategories((prev) => [newCategory, ...prev]);
    // Persist to DB in background
    syncMutationServerFn({ data: { type: "addCategory", data: newCategory } }).catch(console.error);
    return newCategory;
  };

  const updateCategoryLimit = (categoryId: string, limitUsd: number) => {
    setCategories((prev) => prev.map((c) => (c.id === categoryId ? { ...c, limitUsd } : c)));
    // Persist to DB in background
    syncMutationServerFn({
      data: { type: "updateCategoryLimit", data: { id: categoryId, limitUsd } },
    }).catch(console.error);
  };

  const categorySpentUsd = (label: string) => {
    const aliases = categoryAliases(label);
    return Math.abs(
      activeTransactions
        .filter(
          (t) =>
            t.usd < 0 &&
            aliases.some((alias) => `${t.category} ${t.name}`.toLowerCase().includes(alias)),
        )
        .reduce((sum, t) => sum + t.usd, 0),
    );
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

  const contributeToGoal = (goalId: string, amountUsd: number, who = firstName(profile.name)) => {
    if (amountUsd <= 0) return;
    const contribution = {
      id: makeId("contrib"),
      who,
      initials: initialsFor(who),
      date: "today",
      amountUsd,
    };
    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === goalId
          ? {
              ...goal,
              savedUsd: Math.min(goal.targetUsd, goal.savedUsd + amountUsd),
              history: [contribution, ...goal.history],
            }
          : goal,
      ),
    );
    // Persist updated goal savings to DB in background
    const goalToUpdate = goals.find((g) => g.id === goalId);
    if (goalToUpdate) {
      const updatedSaved = Math.min(goalToUpdate.targetUsd, goalToUpdate.savedUsd + amountUsd);
      const updatedHistory = [contribution, ...goalToUpdate.history];
      syncMutationServerFn({ data: { type: "updateGoalSavings", data: { id: goalId, savedUsd: updatedSaved, history: updatedHistory } } }).catch(console.error);
    }
    addTransaction({
      name: `Goal contribution · ${goals.find((g) => g.id === goalId)?.title ?? "Goal"}`,
      who: `${who} · today`,
      usd: -amountUsd,
      category: "Goals",
      wallet: activeWallets[0]?.label ?? wallets[0]?.label ?? "Unassigned wallet",
      date: "today",
    });
  };

  const withdrawFromGoal = (goalId: string, amountUsd: number, wallet: string) => {
    if (amountUsd <= 0) return;
    const goal = goals.find((g) => g.id === goalId);
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? {
              ...g,
              savedUsd: Math.max(0, g.savedUsd - amountUsd),
              history: [
                {
                  id: makeId("withdraw"),
                  who: firstName(profile.name),
                  initials: profile.initials,
                  date: "today",
                  amountUsd: -amountUsd,
                },
                ...g.history,
              ],
            }
          : g,
      ),
    );
    addTransaction({
      name: `Goal withdrawal · ${goal?.title ?? "Goal"}`,
      who: `${firstName(profile.name)} · today`,
      usd: amountUsd,
      category: "Goals",
      wallet,
      date: "today",
    });
  };

  const inviteMember = (role: MemberRole) => {
    const newMember: FamilyMember = {
      id: makeId("member"),
      name: `Invited ${role}`,
      email: `${role.toLowerCase()}@pending.invite`,
      role,
      initials: role.slice(0, 2).toUpperCase(),
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
          data: { ...current, permissions: { ...current.permissions, [permission]: on }, id: memberId },
        },
      }).catch(console.error);
    }
  };

  const removeMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    if (selectedMemberId === id) setSelectedMemberId(null);
    // Persist to DB in background
    syncMutationServerFn({ data: { type: "removeMember", data: { id } } }).catch(console.error);
  };

  const scheduleAllowance = (memberId: string, amountUsd: number, day: string) => {
    const member = members.find((m) => m.id === memberId);
    if (!member || amountUsd <= 0) return;
    updateMember(memberId, { allowanceUsd: amountUsd, allowanceDay: day, allowanceOn: true });
    const newAllowance: ScheduleItem = {
      id: makeId("allowance"),
      label: `Allowance · ${member.name.split(" ")[0]}`,
      every: `Weekly · ${day}`,
      amountUsd,
      color: "oklch(0.65 0.22 320)",
      type: "income",
    };
    setRecurringIncome((prev) => [
      newAllowance,
      ...prev.filter((item) => item.label !== `Allowance · ${member.name.split(" ")[0]}`),
    ]);
    // Persist allowance schedule item to DB in background
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
      members: [members.find((member) => member.email === profile.email)?.id ?? "me"],
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
    syncMutationServerFn({ data: { type: "connectSelectedBank", data: bank } }).catch(console.error);
    syncMutationServerFn({ data: { type: "addWallet", data: connectedWallet } }).catch(console.error);
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    syncMutationServerFn({ data: { type: "markAllNotificationsRead", data: {} } }).catch(console.error);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    syncMutationServerFn({ data: { type: "markNotificationRead", data: { id } } }).catch(console.error);
  };

  const toggleNotificationPref = (key: string) => {
    setNotificationPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const addRecurringIncome = (item: Partial<ScheduleItem> = {}) => {
    const newItem: ScheduleItem = {
      id: makeId("income-schedule"),
      label: item.label ?? "New income schedule",
      every: item.every ?? "Monthly · 1st",
      amountUsd: item.amountUsd ?? 500,
      color: item.color ?? "oklch(0.7 0.18 150)",
      type: "income",
    };
    setRecurringIncome((prev) => [newItem, ...prev]);
    // Persist to DB in background
    syncMutationServerFn({ data: { type: "addScheduleItem", data: newItem } }).catch(console.error);
  };

  const addSubscription = (item: Partial<ScheduleItem> = {}) => {
    const newItem: ScheduleItem = {
      id: makeId("subscription"),
      label: item.label ?? "New subscription",
      every: item.every ?? "Monthly · 1st",
      amountUsd: item.amountUsd ?? 24.99,
      color: item.color ?? "oklch(0.65 0.22 30)",
      type: "subscription",
    };
    setSubscriptions((prev) => [newItem, ...prev]);
    // Persist to DB in background
    syncMutationServerFn({ data: { type: "addScheduleItem", data: newItem } }).catch(console.error);
  };

  const setHistoryFilters = (filters: Partial<HistoryFilters>) => {
    setHistoryFilterState((prev) => ({ ...prev, ...filters }));
  };

  const resetHistoryFilters = () => {
    setHistoryFilterState(defaultHistoryFilters);
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
      if (!data || !data.isAuthenticated) return;

      setProfile({
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone,
        pronouns: data.user.pronouns,
        initials: data.user.initials,
      });

      if (data.household) {
        setHousehold({
          id: data.household.id,
          name: data.household.name,
          inviteCode: data.household.inviteCode,
          role: data.household.role as MemberRole,
          createdAt: data.household.createdAt,
        });
      }

      if (data.members.length > 0) {
        setMembers(
          data.members.map((m) => ({
            ...m,
            role: m.role as MemberRole,
            admin: m.role === "Admin",
          }))
        );
      }

      if (data.wallets.length > 0) {
        setWallets(
          data.wallets.map((w) => ({
            ...w,
            type: w.type as WalletType,
            currency: w.currency as CurrencyCode,
          }))
        );
      }

      if (data.categories.length > 0) setCategories(data.categories);
      if (data.transactions.length > 0) setTransactions(data.transactions);
      if (data.goals.length > 0) setGoals(data.goals);
      if (data.linkedBanks.length > 0) setLinkedBanks(data.linkedBanks);
      if (data.recurringIncome.length > 0) setRecurringIncome(data.recurringIncome);
      if (data.subscriptions.length > 0) setSubscriptions(data.subscriptions);
      if (data.notifications.length > 0) setNotifications(data.notifications as AppNotification[]);

      if (data.household) setBudgetMode("family");
    } catch (err) {
      console.error("Failed to sync data after login:", err);
    }
  }, []);

  // Fire syncDataAfterLogin once on mount if already authenticated
  useMemo(() => {
    syncDataAfterLogin();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        currentScreen,
        history,
        navigate,
        goBack,
        budgetMode,
        setBudgetMode,
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
        addTransaction,
        updateTransaction,
        deleteTransaction,
        recordTransfer,
        balanceUsd,
        incomeUsd,
        spentUsd,
        selectedTransactionId,
        setSelectedTransactionId,
        wallets,
        addWallet,
        walletBalanceUsd,
        categories,
        addCategory,
        updateCategoryLimit,
        categorySpentUsd,
        goals,
        selectedGoalId,
        setSelectedGoalId,
        addGoal,
        contributeToGoal,
        withdrawFromGoal,
        members,
        selectedMemberId,
        setSelectedMemberId,
        inviteMember,
        updateMember,
        updateMemberPermission,
        removeMember,
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
        historyFilters,
        setHistoryFilters,
        resetHistoryFilters,
        passcode,
        setPasscode,
        faceIdEnabled,
        setFaceIdEnabled,
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
