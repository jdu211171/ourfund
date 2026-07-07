import type {
  AppNotification,
  BudgetCategory,
  BudgetMode,
  CurrencySettings,
  FamilyMember,
  Goal,
  HistoryFilters,
  Household,
  LinkedBank,
  LoanEntry,
  ProductEntry,
  Profile,
  ReceiptScan,
  ReportPeriod,
  SalaryCalculatorSettings,
  ScheduleItem,
  Transaction,
  WalletAccount
} from './index'

export interface AppSeed {
  budgetMode: BudgetMode
  salaryCalculatorSettings: SalaryCalculatorSettings
  reportPeriod: ReportPeriod
  profile: Profile
  household: Household | null
  currencies: CurrencySettings
  transactions: Transaction[]
  wallets: WalletAccount[]
  categories: BudgetCategory[]
  goals: Goal[]
  members: FamilyMember[]
  selectedGoalId: string | null
  selectedWalletId: string | null
  selectedMemberId: string | null
  selectedBankName: string
  linkedBanks: LinkedBank[]
  notifications: AppNotification[]
  notificationPrefs: Record<string, boolean>
  recurringIncome: ScheduleItem[]
  subscriptions: ScheduleItem[]
  loanEntries: LoanEntry[]
  trackedProducts: ProductEntry[]
  receiptScans: ReceiptScan[]
  historyFilters: HistoryFilters
  passcode: string
  faceIdEnabled: boolean
  compactMoneyMode: boolean
}
