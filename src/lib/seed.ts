import type {
  AppNotification,
  AppSeed,
  BudgetCategory,
  FamilyMember,
  Goal,
  HistoryFilters,
  HouseholdInvite,
  LoanEntry,
  ProductEntry,
  ReceiptScan,
  ScheduleItem,
  Transaction,
  WalletAccount,
} from "./navigation";
import { buildScheduleEvery, formatISODate } from "./schedules";

export const defaultPermissions = {
  "Approve children's requests": true,
  "Edit budget limits": true,
  "Add or remove members": false,
  "View private wallets": false,
};

export const defaultHistoryFilters: HistoryFilters = {
  kind: "All",
  member: "Anyone",
  categories: [],
  sort: "Newest",
  minUsd: 0,
  maxUsd: 5000,
};

const demoTransactions: Transaction[] = [
  {
    id: "p1",
    name: "Salary - James",
    who: "Income · Nov 1",
    usd: 3380.2,
    category: "Salary",
    wallet: "James · Personal",
    date: "Nov 1",
  },
  {
    id: "p2",
    name: "Groceries - Whole Foods",
    who: "Emma · today",
    usd: -124.3,
    category: "Groceries",
    wallet: "James · Personal",
    date: "today",
  },
  {
    id: "p3",
    name: "Electric bill",
    who: "Auto · yesterday",
    usd: -182,
    category: "Housing",
    wallet: "James · Personal",
    date: "yesterday",
  },
  {
    id: "p4",
    name: "Rent payment",
    who: "Auto · Nov 1",
    usd: -983.7,
    category: "Rent",
    wallet: "James · Personal",
    date: "Nov 1",
  },
  {
    id: "f1",
    name: "Salary - James",
    who: "Income · Nov 1",
    usd: 4800,
    category: "Salary",
    wallet: "Joint Household",
    date: "Nov 1",
  },
  {
    id: "f2",
    name: "Groceries - Whole Foods",
    who: "Emma · today",
    usd: -124.3,
    category: "Groceries",
    wallet: "Joint Household",
    date: "today",
  },
  {
    id: "f3",
    name: "Electric bill",
    who: "Auto · yesterday",
    usd: -182,
    category: "Housing",
    wallet: "Joint Household",
    date: "yesterday",
  },
  {
    id: "f4",
    name: "Dining out",
    who: "James · 2 days ago",
    usd: -1253.7,
    category: "Dining",
    wallet: "Joint Household",
    date: "2 days ago",
  },
];

const demoWallets: WalletAccount[] = [
  {
    id: "joint",
    label: "Joint Household",
    sub: "Shared · 4 members",
    type: "shared",
    currency: "USD",
    members: ["james", "emma", "ava", "liam"],
    color: "oklch(0.55 0.24 265)",
    startingBalanceUsd: 0,
  },
  {
    id: "personal",
    label: "James · Personal",
    sub: "Private wallet",
    type: "private",
    currency: "USD",
    members: ["james"],
    color: "oklch(0.3 0.05 265)",
    startingBalanceUsd: 0,
  },
  {
    id: "allowance-ava",
    label: "Ava · Allowance",
    sub: "Teen · weekly",
    type: "shared",
    currency: "USD",
    members: ["ava", "james", "emma"],
    color: "oklch(0.65 0.22 320)",
    startingBalanceUsd: 120,
  },
];

const demoCategories: BudgetCategory[] = [
  {
    id: "rent",
    label: "Rent & Utilities",
    limitUsd: 1800,
    color: "oklch(0.55 0.24 265)",
    icon: "home",
  },
  {
    id: "groceries",
    label: "Groceries",
    limitUsd: 800,
    color: "oklch(0.65 0.22 200)",
    icon: "shopping",
  },
  { id: "transport", label: "Transport", limitUsd: 400, color: "oklch(0.7 0.18 150)", icon: "car" },
  { id: "dining", label: "Dining", limitUsd: 200, color: "oklch(0.65 0.22 30)", icon: "coffee" },
  { id: "health", label: "Health", limitUsd: 250, color: "oklch(0.65 0.22 0)", icon: "heart" },
  { id: "gifts", label: "Gifts", limitUsd: 150, color: "oklch(0.65 0.22 320)", icon: "gift" },
  {
    id: "utilities",
    label: "Bills & Utilities",
    limitUsd: 300,
    color: "oklch(0.75 0.15 80)",
    icon: "utilities",
  },
  {
    id: "entertainment",
    label: "Entertainment",
    limitUsd: 150,
    color: "oklch(0.6 0.2 300)",
    icon: "entertainment",
  },
  { id: "travel", label: "Travel", limitUsd: 250, color: "oklch(0.5 0.15 220)", icon: "travel" },
  {
    id: "education",
    label: "Education",
    limitUsd: 100,
    color: "oklch(0.7 0.1 100)",
    icon: "education",
  },
];

const demoMembers: FamilyMember[] = [
  {
    id: "james",
    name: "James Morgan",
    email: "james@morgan.family",
    role: "Admin",
    initials: "JM",
    admin: true,
    permissions: defaultPermissions,
  },
  {
    id: "emma",
    name: "Emma Morgan",
    email: "emma@morgan.family",
    role: "Admin",
    initials: "EM",
    admin: true,
    permissions: defaultPermissions,
  },
  {
    id: "ava",
    name: "Ava Morgan",
    email: "ava@morgan.family",
    role: "Teen",
    initials: "AV",
    age: 14,
    allowanceUsd: 25,
    allowanceDay: "Sun",
    allowanceOn: true,
    permissions: {
      ...defaultPermissions,
      "Add or remove members": false,
      "View private wallets": false,
    },
  },
  {
    id: "liam",
    name: "Liam Morgan",
    email: "liam@morgan.family",
    role: "Kid",
    initials: "LM",
    age: 9,
    allowanceUsd: 10,
    allowanceDay: "Sun",
    allowanceOn: true,
    permissions: {
      ...defaultPermissions,
      "Edit budget limits": false,
      "View private wallets": false,
    },
  },
];

const demoGoals: Goal[] = [
  {
    id: "vacation",
    title: "Family vacation",
    targetUsd: 5000,
    savedUsd: 1820,
    targetDate: "2026-08",
    icon: "plane",
    color: "oklch(0.55 0.24 265)",
    contributors: ["james", "emma", "ava"],
    history: [
      { id: "g1", who: "James", initials: "JM", date: "Nov 1", amountUsd: 200 },
      { id: "g2", who: "Emma", initials: "EM", date: "Nov 1", amountUsd: 200 },
      { id: "g3", who: "Ava", initials: "AV", date: "Nov 1", amountUsd: 25 },
      { id: "g4", who: "James", initials: "JM", date: "Oct 1", amountUsd: 200 },
      { id: "g5", who: "Emma", initials: "EM", date: "Oct 1", amountUsd: 200 },
    ],
  },
];

const demoNotifications: AppNotification[] = [
  {
    id: "n1",
    title: "Dining out at 88% of limit",
    desc: "176 of 200 used",
    time: "18:30",
    group: "Today",
    tone: "warn",
    read: false,
    screen: "categories",
  },
  {
    id: "n2",
    title: "Ava added an expense",
    desc: "Books expense",
    time: "14:02",
    group: "Today",
    tone: "primary",
    read: false,
    screen: "history_search",
  },
  {
    id: "n3",
    title: "Electric bill due in 2 days",
    desc: "Estimated bill amount",
    time: "09:10",
    group: "Yesterday",
    tone: "warn",
    read: true,
    screen: "subscriptions",
  },
  {
    id: "n4",
    title: "Vacation goal contribution",
    desc: "James contributed",
    time: "08:00",
    group: "Yesterday",
    tone: "success",
    read: true,
    screen: "goal_detail",
  },
];

const seedToday = new Date();
const addSeedDays = (base: Date, days: number) =>
  new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
const seedISO = (date: Date) => formatISODate(date);

const demoRecurringIncome: ScheduleItem[] = [
  {
    id: "ri1",
    label: "Salary · James",
    every: buildScheduleEvery("Monthly · 25th", {
      frequency: "monthly",
      nextDate: seedISO(addSeedDays(seedToday, 3)),
      category: "Salary",
    }),
    amountUsd: 4820,
    color: "oklch(0.55 0.24 265)",
    type: "income",
  },
  {
    id: "ri2",
    label: "Freelance · Emma",
    every: buildScheduleEvery("Weekly · Fri", {
      frequency: "weekly",
      nextDate: seedISO(addSeedDays(seedToday, 5)),
      category: "Freelance",
    }),
    amountUsd: 1200,
    color: "oklch(0.65 0.22 200)",
    type: "income",
  },
  {
    id: "ri3",
    label: "Allowance · Ava",
    every: buildScheduleEvery("Weekly · Sun", {
      frequency: "weekly",
      nextDate: seedISO(addSeedDays(seedToday, 6)),
      category: "Allowance",
    }),
    amountUsd: 25,
    color: "oklch(0.65 0.22 320)",
    type: "income",
  },
  {
    id: "ri4",
    label: "Pension · Grandma",
    every: buildScheduleEvery("Monthly · 1st", {
      frequency: "monthly",
      nextDate: seedISO(addSeedDays(seedToday, 12)),
      category: "Pension",
    }),
    amountUsd: 600,
    color: "oklch(0.7 0.18 150)",
    type: "income",
  },
];

const demoSubscriptions: ScheduleItem[] = [
  {
    id: "s1",
    label: "Rent",
    every: buildScheduleEvery("Monthly · 1st", {
      frequency: "monthly",
      nextDate: seedISO(addSeedDays(seedToday, 2)),
      category: "Rent & Utilities",
    }),
    amountUsd: 1420,
    color: "oklch(0.55 0.24 265)",
    type: "subscription",
  },
  {
    id: "s2",
    label: "Electricity",
    every: buildScheduleEvery("Monthly · 4th", {
      frequency: "monthly",
      nextDate: seedISO(addSeedDays(seedToday, 4)),
      category: "Bills & Utilities",
    }),
    amountUsd: 118.4,
    color: "oklch(0.65 0.22 60)",
    type: "subscription",
  },
  {
    id: "s3",
    label: "Internet",
    every: buildScheduleEvery("Monthly · 12th", {
      frequency: "monthly",
      nextDate: seedISO(addSeedDays(seedToday, 15)),
      category: "Bills & Utilities",
    }),
    amountUsd: 64,
    color: "oklch(0.65 0.22 200)",
    type: "subscription",
  },
  {
    id: "s4",
    label: "Netflix",
    every: buildScheduleEvery("Monthly · 18th", {
      frequency: "monthly",
      nextDate: seedISO(addSeedDays(seedToday, 18)),
      category: "Entertainment",
    }),
    amountUsd: 15.99,
    color: "oklch(0.65 0.22 30)",
    type: "subscription",
  },
  {
    id: "s5",
    label: "Spotify Family",
    every: buildScheduleEvery("Monthly · 22nd", {
      frequency: "monthly",
      nextDate: seedISO(addSeedDays(seedToday, 22)),
      category: "Entertainment",
    }),
    amountUsd: 16.99,
    color: "oklch(0.65 0.22 320)",
    type: "subscription",
  },
];

const demoLoanEntries: LoanEntry[] = [
  {
    id: "loan-aziz",
    counterpartyMemberId: null,
    counterpartyName: "Aziz",
    note: "Concert tickets",
    due: "Due Dec 12",
    amountUsd: 120,
    paidAmountUsd: 0,
    direction: "lent",
    status: "pending",
    createdAt: "Nov 29",
  },
  {
    id: "loan-madina",
    counterpartyMemberId: null,
    counterpartyName: "Madina",
    note: "Grocery split",
    due: "Due Dec 03",
    amountUsd: 38,
    paidAmountUsd: 0,
    direction: "lent",
    status: "overdue",
    createdAt: "Nov 24",
  },
  {
    id: "loan-sardor",
    counterpartyMemberId: null,
    counterpartyName: "Sardor",
    note: "Phone repair",
    due: "Due Dec 20",
    amountUsd: 65,
    paidAmountUsd: 0,
    direction: "borrowed",
    status: "pending",
    createdAt: "Nov 27",
  },
];

const demoTrackedProducts: ProductEntry[] = [
  {
    id: "product-olive-oil",
    name: "Olive oil 1L",
    store: "Korzinka",
    category: "Groceries",
    amountUsd: 6.4,
    quantity: 1,
    unitPriceUsd: 6.4,
    purchasedAt: "today",
    source: "receipt",
    createdAt: "today",
  },
  {
    id: "product-cable",
    name: "USB-C cable",
    store: "Malika",
    category: "Electronics",
    amountUsd: 4.2,
    quantity: 1,
    unitPriceUsd: 4.2,
    purchasedAt: "yesterday",
    source: "manual",
    createdAt: "yesterday",
  },
  {
    id: "product-latte",
    name: "Latte",
    store: "Bon!",
    category: "Dining",
    amountUsd: 2.8,
    quantity: 1,
    unitPriceUsd: 2.8,
    purchasedAt: "Nov 23",
    source: "receipt",
    createdAt: "Nov 23",
  },
];

const demoReceiptScans: ReceiptScan[] = [];

const notificationPrefs = {
  "Category at 80%": true,
  "Category over budget": true,
  "Large transaction": false,
  "New member expense": true,
  "Transfer requests": true,
  "Goal contributions": false,
  "Daily digest": true,
  "Weekly report": true,
  "Bill reminders": true,
};

const STORAGE_KEY = "ourfund.appSeed.v1";

const emptySeed: AppSeed = {
  budgetMode: "personal",
  reportPeriod: "Month",
  profile: { name: "", email: "", phone: "", pronouns: "", initials: "" },
  household: null,
  currencies: { personal: "USD", family: "UZS" },
  transactions: [],
  wallets: [],
  categories: [],
  goals: [],
  members: [],
  selectedGoalId: null,
  selectedMemberId: null,
  selectedBankName: "Chase",
  linkedBanks: [],
  notifications: [],
  notificationPrefs,
  recurringIncome: [],
  subscriptions: [],
  loanEntries: [],
  trackedProducts: [],
  receiptScans: [],
  historyFilters: defaultHistoryFilters,
  passcode: "",
  faceIdEnabled: true,
};

const demoSeed: AppSeed = {
  budgetMode: "personal",
  reportPeriod: "Month",
  profile: {
    name: "James Morgan",
    email: "james@morgan.family",
    phone: "+1 415 555 0117",
    pronouns: "he / him",
    initials: "JM",
  },
  household: {
    id: "morgan-household",
    name: "The Morgans",
    inviteCode: "NEST-2840",
    role: "Admin",
    createdAt: "Nov 1",
  },
  currencies: { personal: "USD", family: "UZS" },
  transactions: demoTransactions,
  wallets: demoWallets,
  categories: demoCategories,
  goals: demoGoals,
  members: demoMembers,
  selectedGoalId: "vacation",
  selectedMemberId: "james",
  selectedBankName: "Chase",
  linkedBanks: [],
  notifications: demoNotifications,
  notificationPrefs,
  recurringIncome: demoRecurringIncome,
  subscriptions: demoSubscriptions,
  loanEntries: demoLoanEntries,
  trackedProducts: demoTrackedProducts,
  receiptScans: demoReceiptScans,
  historyFilters: defaultHistoryFilters,
  passcode: "",
  faceIdEnabled: true,
};

export const knownInvites: HouseholdInvite[] = import.meta.env.DEV
  ? [
      {
        code: "NEST-2840",
        householdName: "The Morgans",
        memberCount: 4,
        role: "Teen",
        inviter: "Emma Morgan",
        familyCurrency: "UZS",
      },
    ]
  : [];

function cloneSeed(seed: AppSeed): AppSeed {
  return structuredClone(seed);
}

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function normalizeSeed(seed: Partial<AppSeed>): AppSeed {
  return {
    ...cloneSeed(emptySeed),
    ...seed,
    reportPeriod: seed.reportPeriod ?? emptySeed.reportPeriod,
    profile: { ...emptySeed.profile, ...seed.profile },
    currencies: { ...emptySeed.currencies, ...seed.currencies },
    notificationPrefs: { ...emptySeed.notificationPrefs, ...seed.notificationPrefs },
    historyFilters: { ...emptySeed.historyFilters, ...seed.historyFilters },
  };
}

export function getEmptySeed(): AppSeed {
  return cloneSeed(emptySeed);
}

export function persistAppSeed(seed: AppSeed) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
}

export function clearPersistedAppSeed() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function getInitialSeed(): AppSeed {
  if (canUseStorage()) {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return normalizeSeed(JSON.parse(stored) as Partial<AppSeed>);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  }

  const forceEmpty = import.meta.env.VITE_EMPTY_DATA === "true";
  return cloneSeed(!forceEmpty && import.meta.env.DEV ? demoSeed : emptySeed);
}
