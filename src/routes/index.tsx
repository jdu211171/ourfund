import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SendMoneyScreen } from "@/components/knit/SendMoneyScreen";
import { HomeScreen } from "@/components/knit/HomeScreen";
import { ActivitiesScreen } from "@/components/knit/ActivitiesScreen";
import { WalletScreen } from "@/components/knit/WalletScreen";
import { ProfileScreen } from "@/components/knit/ProfileScreen";
import { RequestMoneyScreen } from "@/components/knit/RequestMoneyScreen";
import { TransactionDetailScreen } from "@/components/knit/TransactionDetailScreen";
import { NotificationsScreen } from "@/components/knit/NotificationsScreen";
import { OnboardingScreen } from "@/components/knit/OnboardingScreen";
import { AddIncomeScreen } from "@/components/knit/AddIncomeScreen";
import { TransferFundsScreen } from "@/components/knit/TransferFundsScreen";
import { SubscriptionsScreen } from "@/components/knit/SubscriptionsScreen";
import { CreateWalletScreen } from "@/components/knit/CreateWalletScreen";
import { CategoryEditorScreen } from "@/components/knit/CategoryEditorScreen";
import { GoalDetailScreen } from "@/components/knit/GoalDetailScreen";
import { LoginScreen } from "@/components/knit/LoginScreen";
import { SignUpScreen } from "@/components/knit/SignUpScreen";
import { JoinFamilyScreen } from "@/components/knit/JoinFamilyScreen";
import { SettingsScreen } from "@/components/knit/SettingsScreen";
import { TransactionHistoryScreen } from "@/components/knit/TransactionHistoryScreen";
import { AnalyticsScreen } from "@/components/knit/AnalyticsScreen";
import { EditTransactionScreen } from "@/components/knit/EditTransactionScreen";
import { ConfirmDeleteScreen } from "@/components/knit/ConfirmDeleteScreen";
import { FilterSortScreen } from "@/components/knit/FilterSortScreen";
import { ReceiptScreen } from "@/components/knit/ReceiptScreen";
import { IncomeDetailScreen } from "@/components/knit/IncomeDetailScreen";
import { RecurringIncomeScreen } from "@/components/knit/RecurringIncomeScreen";
import { ConfirmInviteScreen } from "@/components/knit/ConfirmInviteScreen";
import { InviteMemberScreen } from "@/components/knit/InviteMemberScreen";
import { MemberPermissionsScreen } from "@/components/knit/MemberPermissionsScreen";
import { AllowanceScreen } from "@/components/knit/AllowanceScreen";
import { AddCategoryScreen } from "@/components/knit/AddCategoryScreen";
import { GoalWithdrawScreen } from "@/components/knit/GoalWithdrawScreen";
import { BankConnectScreen } from "@/components/knit/BankConnectScreen";
import { EditProfileScreen } from "@/components/knit/EditProfileScreen";
import { PasscodeScreen } from "@/components/knit/PasscodeScreen";
import { NotificationPreferencesScreen } from "@/components/knit/NotificationPreferencesScreen";
import { CurrencyPickerScreen } from "@/components/knit/CurrencyPickerScreen";
import { EmptyHistoryScreen } from "@/components/knit/EmptyHistoryScreen";
import { JoinFamilyErrorScreen } from "@/components/knit/JoinFamilyErrorScreen";
import { GoalAchievedScreen } from "@/components/knit/GoalAchievedScreen";
import { RemoveMemberScreen } from "@/components/knit/RemoveMemberScreen";
import { PlaidConnectingScreen } from "@/components/knit/PlaidConnectingScreen";
import { PlaidSuccessScreen } from "@/components/knit/PlaidSuccessScreen";

import { useState } from "react";
import { AppNavigationProvider, useAppNavigation } from "@/lib/navigation";

export const Route = createFileRoute("/")({
  component: IndexWrapper,
  head: () => ({
    meta: [
      { title: "Nest — Family Budget App" },
      {
        name: "description",
        content:
          "Nest family budget app — shared wallets, goals, reports and alerts for the whole household.",
      },
    ],
  }),
});

function IndexWrapper() {
  return (
    <AppNavigationProvider>
      <Index />
    </AppNavigationProvider>
  );
}

function AppRouter() {
  const { currentScreen } = useAppNavigation();

  switch (currentScreen) {
    case "onboarding":
      return <OnboardingScreen />;
    case "login":
      return <LoginScreen />;
    case "signup":
      return <SignUpScreen />;
    case "join_family":
      return <JoinFamilyScreen />;
    case "join_family_error":
      return <JoinFamilyErrorScreen />;
    case "confirm_invite":
      return <ConfirmInviteScreen />;
    case "home":
      return <HomeScreen />;
    case "wallet":
      return <WalletScreen />;
    case "new_wallet":
      return <CreateWalletScreen />;
    case "connect_bank":
      return <BankConnectScreen />;
    case "plaid_connecting":
      return <PlaidConnectingScreen />;
    case "plaid_success":
      return <PlaidSuccessScreen />;
    case "categories":
      return <CategoryEditorScreen />;
    case "new_category":
      return <AddCategoryScreen />;
    case "subscriptions":
      return <SubscriptionsScreen />;
    case "recurring_income":
      return <RecurringIncomeScreen />;
    case "new_goal":
      return <RequestMoneyScreen />;
    case "goal_detail":
      return <GoalDetailScreen />;
    case "goal_withdraw":
      return <GoalWithdrawScreen />;
    case "goal_achieved":
      return <GoalAchievedScreen />;
    case "reports_week":
      return <ActivitiesScreen initial="Week" />;
    case "reports_month":
      return <ActivitiesScreen initial="Month" />;
    case "reports_year":
      return <ActivitiesScreen initial="Year" />;
    case "analytics":
      return <AnalyticsScreen />;
    case "alerts":
      return <NotificationsScreen />;
    case "family":
      return <ProfileScreen />;
    case "invite_member":
      return <InviteMemberScreen />;
    case "permissions":
      return <MemberPermissionsScreen />;
    case "allowance":
      return <AllowanceScreen />;
    case "settings":
      return <SettingsScreen />;
    case "edit_profile":
      return <EditProfileScreen />;
    case "passcode":
      return <PasscodeScreen />;
    case "notif_prefs":
      return <NotificationPreferencesScreen />;
    case "currency":
      return <CurrencyPickerScreen />;
    case "empty_history":
      return <EmptyHistoryScreen />;
    case "remove_member":
      return <RemoveMemberScreen />;
    case "add_expense":
      return <SendMoneyScreen />;
    case "add_income":
      return <AddIncomeScreen />;
    case "transfer":
      return <TransferFundsScreen />;
    case "expense_detail":
      return <TransactionDetailScreen />;
    case "income_detail":
      return <IncomeDetailScreen />;
    case "edit_expense":
      return <EditTransactionScreen />;
    case "delete_confirm":
      return <ConfirmDeleteScreen />;
    case "filter_sort":
      return <FilterSortScreen />;
    case "receipt":
      return <ReceiptScreen />;
    case "history_search":
      return <TransactionHistoryScreen />;
    default:
      return <OnboardingScreen />;
  }
}

function Index() {
  const [viewMode, setViewMode] = useState<"app" | "showcase">("app");

  const sections: { title: string; screens: { label: string; node: ReactNode }[] }[] = [
    {
      title: "Account & onboarding",
      screens: [
        { label: "Onboarding", node: <OnboardingScreen /> },
        { label: "Sign In", node: <LoginScreen /> },
        { label: "Sign Up", node: <SignUpScreen /> },
        { label: "Join Household", node: <JoinFamilyScreen /> },
        { label: "Confirm Invite", node: <ConfirmInviteScreen /> },
      ],
    },
    {
      title: "Daily flow",
      screens: [
        { label: "Home", node: <HomeScreen /> },
        { label: "Add Expense", node: <SendMoneyScreen /> },
        { label: "Add Income", node: <AddIncomeScreen /> },
        { label: "Transfer", node: <TransferFundsScreen /> },
        { label: "Expense Detail", node: <TransactionDetailScreen /> },
        { label: "Income Detail", node: <IncomeDetailScreen /> },
        { label: "Edit Expense", node: <EditTransactionScreen /> },
        { label: "Delete Confirm", node: <ConfirmDeleteScreen /> },
        { label: "Receipt", node: <ReceiptScreen /> },
        { label: "History & Search", node: <TransactionHistoryScreen /> },
        { label: "Filter & Sort", node: <FilterSortScreen /> },
      ],
    },
    {
      title: "Wallets, categories & goals",
      screens: [
        { label: "Wallets", node: <WalletScreen /> },
        { label: "New Wallet", node: <CreateWalletScreen /> },
        { label: "Connect Bank", node: <BankConnectScreen /> },
        { label: "Categories", node: <CategoryEditorScreen /> },
        { label: "New Category", node: <AddCategoryScreen /> },
        { label: "Subscriptions", node: <SubscriptionsScreen /> },
        { label: "Recurring Income", node: <RecurringIncomeScreen /> },
        { label: "New Goal", node: <RequestMoneyScreen /> },
        { label: "Goal Detail", node: <GoalDetailScreen /> },
        { label: "Goal Withdraw", node: <GoalWithdrawScreen /> },
      ],
    },
    {
      title: "Insights, alerts & settings",
      screens: [
        { label: "Weekly Report", node: <ActivitiesScreen initial="Week" /> },
        { label: "Monthly Report", node: <ActivitiesScreen initial="Month" /> },
        { label: "Yearly Report", node: <ActivitiesScreen initial="Year" /> },
        { label: "Analytics", node: <AnalyticsScreen /> },
        { label: "Alerts", node: <NotificationsScreen /> },
        { label: "Family", node: <ProfileScreen /> },
        { label: "Invite Member", node: <InviteMemberScreen /> },
        { label: "Permissions", node: <MemberPermissionsScreen /> },
        { label: "Allowance", node: <AllowanceScreen /> },
        { label: "Settings", node: <SettingsScreen /> },
        { label: "Edit Profile", node: <EditProfileScreen /> },
        { label: "Passcode", node: <PasscodeScreen /> },
        { label: "Notif. Prefs", node: <NotificationPreferencesScreen /> },
        { label: "Currency", node: <CurrencyPickerScreen /> },
      ],
    },
    {
      title: "Edge states & celebrations",
      screens: [
        { label: "Empty History", node: <EmptyHistoryScreen /> },
        { label: "Invalid Invite Code", node: <JoinFamilyErrorScreen /> },
        { label: "Remove Member", node: <RemoveMemberScreen /> },
        { label: "Goal Achieved 🎉", node: <GoalAchievedScreen /> },
        { label: "Plaid Connecting", node: <PlaidConnectingScreen /> },
        { label: "Plaid Synced", node: <PlaidSuccessScreen /> },
      ],
    },
  ];

  if (viewMode === "app") {
    return (
      <main className="min-h-screen w-full flex flex-col items-center justify-center bg-[var(--canvas)] relative">
        {/* Sleek toggle header - only visible on desktops/tablets to keep mobile clean */}
        <div className="absolute top-6 hidden sm:flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200 shadow-sm z-50">
          <button
            onClick={() => setViewMode("app")}
            className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
              viewMode === "app"
                ? "bg-[var(--primary)] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            📱 Mobile App
          </button>
          <button
            onClick={() => setViewMode("showcase")}
            className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
              viewMode === "showcase"
                ? "bg-[var(--primary)] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            🗂️ Showcase Gallery
          </button>
        </div>

        <AppRouter />
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-[var(--canvas)] py-16 px-6 relative">
      {/* Sleek toggle header */}
      <div className="absolute top-6 right-6 flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200 shadow-sm z-50">
        <button
          onClick={() => setViewMode("app")}
          className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
            viewMode === "app"
              ? "bg-[var(--primary)] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          📱 Mobile App
        </button>
        <button
          onClick={() => setViewMode("showcase")}
          className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
            viewMode === "showcase"
              ? "bg-[var(--primary)] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          🗂️ Showcase Gallery
        </button>
      </div>

      <h1 className="sr-only">Nest family budget app screens</h1>
      <div className="mx-auto max-w-6xl text-center mt-8">
        <p className="font-display text-[14px] tracking-widest uppercase text-[var(--primary)]">
          Nest.
        </p>
        <h2 className="mt-2 font-display text-[44px] leading-tight tracking-tight text-foreground">
          The family budget, finally simple
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[13px] text-muted-foreground">
          A complete product surface — onboarding, shared wallets, expenses, transfers, goals,
          history, analytics and settings — built on one design system.
        </p>
      </div>
      <div className="mx-auto mt-12 max-w-7xl space-y-16">
        {sections.map((section) => (
          <section key={section.title}>
            <h3 className="mb-8 text-center font-display text-[20px] tracking-tight text-foreground">
              {section.title}
            </h3>
            <div className="grid grid-cols-1 gap-y-14 gap-x-10 sm:grid-cols-2 lg:grid-cols-3 place-items-center">
              {section.screens.map((s) => (
                <div key={s.label} className="flex flex-col items-center gap-4">
                  {s.node}
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
