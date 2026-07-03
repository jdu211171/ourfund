import type { ReactNode } from 'react'
import { ActivitiesScreen } from '@/components/knit/ActivitiesScreen'
import { AddCategoryScreen } from '@/components/knit/AddCategoryScreen'
import { AddIncomeScreen } from '@/components/knit/AddIncomeScreen'
import { AllowanceScreen } from '@/components/knit/AllowanceScreen'
import { AnalyticsScreen } from '@/components/knit/AnalyticsScreen'
import { BankConnectScreen } from '@/components/knit/BankConnectScreen'
import { BuyListScreen } from '@/components/knit/BuyListScreen'
import { CategoryEditorScreen } from '@/components/knit/CategoryEditorScreen'
import { ConfirmDeleteGoalScreen } from '@/components/knit/ConfirmDeleteGoalScreen'
import { ConfirmDeleteScreen } from '@/components/knit/ConfirmDeleteScreen'
import { ConfirmInviteScreen } from '@/components/knit/ConfirmInviteScreen'
import { CreateWalletScreen } from '@/components/knit/CreateWalletScreen'
import { CurrencyPickerScreen } from '@/components/knit/CurrencyPickerScreen'
import { EditGoalScreen } from '@/components/knit/EditGoalScreen'
import { EditProfileScreen } from '@/components/knit/EditProfileScreen'
import { EditTransactionScreen } from '@/components/knit/EditTransactionScreen'
import { EmptyHistoryScreen } from '@/components/knit/EmptyHistoryScreen'
import { FilterSortScreen } from '@/components/knit/FilterSortScreen'
import { GoalAchievedScreen } from '@/components/knit/GoalAchievedScreen'
import { GoalDetailScreen } from '@/components/knit/GoalDetailScreen'
import { GoalWithdrawScreen } from '@/components/knit/GoalWithdrawScreen'
import { HomeScreen } from '@/components/knit/HomeScreen'
import { IncomeDetailScreen } from '@/components/knit/IncomeDetailScreen'
import { InviteMemberScreen } from '@/components/knit/InviteMemberScreen'
import { JoinFamilyErrorScreen } from '@/components/knit/JoinFamilyErrorScreen'
import { JoinFamilyScreen } from '@/components/knit/JoinFamilyScreen'
import { LendBorrowScreen } from '@/components/knit/LendBorrowScreen'
import { LoginScreen } from '@/components/knit/LoginScreen'
import { MemberPermissionsScreen } from '@/components/knit/MemberPermissionsScreen'
import { MonthlyHistoryScreen } from '@/components/knit/MonthlyHistoryScreen'
import { MoreScreen } from '@/components/knit/MoreScreen'
import { NotificationPreferencesScreen } from '@/components/knit/NotificationPreferencesScreen'
import { NotificationsScreen } from '@/components/knit/NotificationsScreen'
import { OnboardingScreen } from '@/components/knit/OnboardingScreen'
import { PasscodeScreen } from '@/components/knit/PasscodeScreen'
import { PlaidConnectingScreen } from '@/components/knit/PlaidConnectingScreen'
import { PlaidSuccessScreen } from '@/components/knit/PlaidSuccessScreen'
import { PriceHistoryScreen } from '@/components/knit/PriceHistoryScreen'
import { ProductTrackerScreen } from '@/components/knit/ProductTrackerScreen'
import { ProfileScreen } from '@/components/knit/ProfileScreen'
import { ReceiptScreen } from '@/components/knit/ReceiptScreen'
import { RecurringIncomeScreen } from '@/components/knit/RecurringIncomeScreen'
import { RemoveMemberScreen } from '@/components/knit/RemoveMemberScreen'
import { RequestMoneyScreen } from '@/components/knit/RequestMoneyScreen'
import { ResetPasswordScreen } from '@/components/knit/ResetPasswordScreen'
import { SalaryCalculatorScreen } from '@/components/knit/SalaryCalculatorScreen'
import { SavedListsScreen } from '@/components/knit/SavedListsScreen'
import { ScanReceiptScreen } from '@/components/knit/ScanReceiptScreen'
import { SendMoneyScreen } from '@/components/knit/SendMoneyScreen'
import { SettingsScreen } from '@/components/knit/SettingsScreen'
import { SignUpScreen } from '@/components/knit/SignUpScreen'
import { SubscriptionsScreen } from '@/components/knit/SubscriptionsScreen'
import { TransactionDetailScreen } from '@/components/knit/TransactionDetailScreen'
import { TransactionHistoryScreen } from '@/components/knit/TransactionHistoryScreen'
import { TransferFundsScreen } from '@/components/knit/TransferFundsScreen'
import { WalletDetailScreen } from '@/components/knit/WalletDetailScreen'
import { WalletScreen } from '@/components/knit/WalletScreen'
import { WalletSwitcherScreen } from '@/components/knit/WalletSwitcherScreen'

export type ScreenEntry = { slug: string; label: string; group: string; render: () => ReactNode }

export const SCREENS: ScreenEntry[] = [
  // Account & onboarding
  { slug: 'onboarding', label: 'Onboarding', group: 'Account', render: () => <OnboardingScreen /> },
  { slug: 'login', label: 'Sign In', group: 'Account', render: () => <LoginScreen /> },
  { slug: 'signup', label: 'Sign Up', group: 'Account', render: () => <SignUpScreen /> },
  {
    slug: 'join_family',
    label: 'Join Household',
    group: 'Account',
    render: () => <JoinFamilyScreen />
  },
  {
    slug: 'confirm_invite',
    label: 'Confirm Invite',
    group: 'Account',
    render: () => <ConfirmInviteScreen />
  },
  {
    slug: 'reset_password',
    label: 'Reset Password',
    group: 'Account',
    render: () => <ResetPasswordScreen />
  },

  // Daily Flow
  { slug: 'home', label: 'Home', group: 'Daily', render: () => <HomeScreen /> },
  { slug: 'add_expense', label: 'Add Expense', group: 'Daily', render: () => <SendMoneyScreen /> },
  { slug: 'add_income', label: 'Add Income', group: 'Daily', render: () => <AddIncomeScreen /> },
  { slug: 'transfer', label: 'Transfer', group: 'Daily', render: () => <TransferFundsScreen /> },
  {
    slug: 'expense_detail',
    label: 'Expense Detail',
    group: 'Daily',
    render: () => <TransactionDetailScreen />
  },
  {
    slug: 'income_detail',
    label: 'Income Detail',
    group: 'Daily',
    render: () => <IncomeDetailScreen />
  },
  {
    slug: 'edit_expense',
    label: 'Edit Expense',
    group: 'Daily',
    render: () => <EditTransactionScreen />
  },
  {
    slug: 'delete_confirm',
    label: 'Delete Confirm',
    group: 'Daily',
    render: () => <ConfirmDeleteScreen />
  },
  { slug: 'receipt', label: 'Receipt', group: 'Daily', render: () => <ReceiptScreen /> },
  {
    slug: 'history_search',
    label: 'History & Search',
    group: 'Daily',
    render: () => <TransactionHistoryScreen />
  },
  {
    slug: 'monthly_history',
    label: 'Monthly History',
    group: 'Daily',
    render: () => <MonthlyHistoryScreen />
  },
  {
    slug: 'filter_sort',
    label: 'Filter & Sort',
    group: 'Daily',
    render: () => <FilterSortScreen />
  },
  {
    slug: 'lend_borrow',
    label: 'Lend & Borrow',
    group: 'Daily',
    render: () => <LendBorrowScreen />
  },
  {
    slug: 'calc_salary',
    label: 'Salary Calculator',
    group: 'Daily',
    render: () => <SalaryCalculatorScreen />
  },
  {
    slug: 'product_tracker',
    label: 'Product Tracker',
    group: 'Daily',
    render: () => <ProductTrackerScreen />
  },
  {
    slug: 'scan_receipt',
    label: 'Scan Receipt',
    group: 'Daily',
    render: () => <ScanReceiptScreen />
  },
  { slug: 'buy_list', label: 'Buy List', group: 'Daily', render: () => <BuyListScreen /> },
  { slug: 'saved_lists', label: 'Saved Lists', group: 'Daily', render: () => <SavedListsScreen /> },
  {
    slug: 'price_history',
    label: 'Price History',
    group: 'Daily',
    render: () => <PriceHistoryScreen />
  },

  // Wallets, categories & goals
  { slug: 'wallet', label: 'Wallets', group: 'Wallets', render: () => <WalletScreen /> },
  {
    slug: 'new_wallet',
    label: 'New Wallet',
    group: 'Wallets',
    render: () => <CreateWalletScreen />
  },
  {
    slug: 'wallet_switcher',
    label: 'Switch Wallet',
    group: 'Wallets',
    render: () => <WalletSwitcherScreen />
  },
  {
    slug: 'wallet_detail',
    label: 'Wallet Detail',
    group: 'Wallets',
    render: () => <WalletDetailScreen />
  },
  {
    slug: 'connect_bank',
    label: 'Connect Bank',
    group: 'Wallets',
    render: () => <BankConnectScreen />
  },
  {
    slug: 'categories',
    label: 'Categories',
    group: 'Wallets',
    render: () => <CategoryEditorScreen />
  },
  {
    slug: 'new_category',
    label: 'New Category',
    group: 'Wallets',
    render: () => <AddCategoryScreen />
  },
  {
    slug: 'subscriptions',
    label: 'Subscriptions',
    group: 'Wallets',
    render: () => <SubscriptionsScreen />
  },
  {
    slug: 'recurring_income',
    label: 'Recurring Income',
    group: 'Wallets',
    render: () => <RecurringIncomeScreen />
  },
  { slug: 'new_goal', label: 'New Goal', group: 'Wallets', render: () => <RequestMoneyScreen /> },
  {
    slug: 'goal_detail',
    label: 'Goal Detail',
    group: 'Wallets',
    render: () => <GoalDetailScreen />
  },
  { slug: 'edit_goal', label: 'Edit Goal', group: 'Wallets', render: () => <EditGoalScreen /> },
  {
    slug: 'goal_withdraw',
    label: 'Goal Withdraw',
    group: 'Wallets',
    render: () => <GoalWithdrawScreen />
  },
  {
    slug: 'delete_goal_confirm',
    label: 'Delete Goal Confirm',
    group: 'Wallets',
    render: () => <ConfirmDeleteGoalScreen />
  },

  // Insights & settings
  {
    slug: 'reports_week',
    label: 'Weekly Report',
    group: 'Insights',
    render: () => <ActivitiesScreen initial="Week" />
  },
  {
    slug: 'reports_month',
    label: 'Monthly Report',
    group: 'Insights',
    render: () => <ActivitiesScreen initial="Month" />
  },
  {
    slug: 'reports_year',
    label: 'Yearly Report',
    group: 'Insights',
    render: () => <ActivitiesScreen initial="Year" />
  },
  { slug: 'analytics', label: 'Analytics', group: 'Insights', render: () => <AnalyticsScreen /> },
  { slug: 'alerts', label: 'Alerts', group: 'Insights', render: () => <NotificationsScreen /> },
  { slug: 'family', label: 'Family', group: 'Insights', render: () => <ProfileScreen /> },
  {
    slug: 'invite_member',
    label: 'Invite Member',
    group: 'Insights',
    render: () => <InviteMemberScreen />
  },
  {
    slug: 'permissions',
    label: 'Permissions',
    group: 'Insights',
    render: () => <MemberPermissionsScreen />
  },
  { slug: 'allowance', label: 'Allowance', group: 'Insights', render: () => <AllowanceScreen /> },
  { slug: 'settings', label: 'Settings', group: 'Insights', render: () => <SettingsScreen /> },
  {
    slug: 'edit_profile',
    label: 'Edit Profile',
    group: 'Insights',
    render: () => <EditProfileScreen />
  },
  { slug: 'passcode', label: 'Passcode', group: 'Insights', render: () => <PasscodeScreen /> },
  {
    slug: 'notif_prefs',
    label: 'Notif. Prefs',
    group: 'Insights',
    render: () => <NotificationPreferencesScreen />
  },
  {
    slug: 'currency',
    label: 'Currency',
    group: 'Insights',
    render: () => <CurrencyPickerScreen />
  },
  { slug: 'more', label: 'More', group: 'Insights', render: () => <MoreScreen /> },

  // Edge states
  {
    slug: 'empty_history',
    label: 'Empty History',
    group: 'Edge',
    render: () => <EmptyHistoryScreen />
  },
  {
    slug: 'join_family_error',
    label: 'Invalid Invite',
    group: 'Edge',
    render: () => <JoinFamilyErrorScreen />
  },
  {
    slug: 'remove_member',
    label: 'Remove Member',
    group: 'Edge',
    render: () => <RemoveMemberScreen />
  },
  {
    slug: 'goal_achieved',
    label: 'Goal Achieved',
    group: 'Edge',
    render: () => <GoalAchievedScreen />
  },
  {
    slug: 'plaid_connecting',
    label: 'Plaid Connecting',
    group: 'Edge',
    render: () => <PlaidConnectingScreen />
  },
  {
    slug: 'plaid_success',
    label: 'Plaid Synced',
    group: 'Edge',
    render: () => <PlaidSuccessScreen />
  }
]

export const SCREEN_MAP: Record<string, ScreenEntry> = Object.fromEntries(
  SCREENS.map(s => [s.slug, s])
)
