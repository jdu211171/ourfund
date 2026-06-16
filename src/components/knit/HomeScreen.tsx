import {
  AlertTriangle,
  ArrowDownLeft,
  Bell,
  CheckCircle2,
  Clock,
  Plus,
  TrendingUp,
  ChevronDown,
  Lock,
  Users,
} from "lucide-react";
import { useEffect } from "react";
import { PhoneFrame } from "./PhoneFrame";
import { BottomNav } from "./BottomNav";
import { BalanceHeader } from "./BalanceHeader";
import { Money } from "./Money";
import { useAppNavigation } from "@/lib/navigation";
import { GoalIcon, normalizeGoalIconName } from "./goalIconOptions";
import { formatScheduleSubtext, getScheduleInfo } from "@/lib/schedules";

export function HomeScreen() {
  const {
    navigate,
    budgetMode,
    household,
    profile,
    activeTransactions,
    balanceUsd,
    incomeUsd,
    spentUsd,
    currentMemberId,
    selectedMemberId,
    setSelectedMemberId,
    setSelectedTransactionId,
    subscriptions,
    recurringIncome,
    goals,
    setSelectedGoalId,
    categories,
    categorySpentUsd,
    notifications,
    activeWallets,
    selectedWalletId,
  } = useAppNavigation();

  useEffect(() => {
    if (budgetMode === "personal" && currentMemberId && selectedMemberId !== currentMemberId) {
      setSelectedMemberId(currentMemberId);
    }
  }, [budgetMode, currentMemberId, selectedMemberId, setSelectedMemberId]);

  const firstName = profile.name.trim().split(" ").filter(Boolean)[0] ?? "there";
  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const scheduleToday = new Date();
  const upcomingBills = subscriptions
    .map((item) => ({ item, info: getScheduleInfo(item.every, scheduleToday) }))
    .filter((entry) => entry.info.daysUntil !== null && entry.info.daysUntil <= 5)
    .sort((a, b) => (a.info.daysUntil ?? 0) - (b.info.daysUntil ?? 0));
  const forecastItems = recurringIncome
    .map((item) => ({ item, info: getScheduleInfo(item.every, scheduleToday) }))
    .filter((entry) => entry.info.daysUntil !== null && entry.info.daysUntil <= 5)
    .sort((a, b) => (a.info.daysUntil ?? 0) - (b.info.daysUntil ?? 0));
  const expectedIncomeUsd = forecastItems.reduce((sum, entry) => sum + entry.item.amountUsd, 0);
  const showUpcoming = upcomingBills.length > 0;
  const showForecast = forecastItems.length > 0;
  const primaryGoal = goals.find((goal) => goal.savedUsd < goal.targetUsd) ?? goals[0];
  const goalPct = primaryGoal
    ? Math.min(100, Math.round((primaryGoal.savedUsd / Math.max(primaryGoal.targetUsd, 1)) * 100))
    : 0;
  const budgetAlerts = categories
    .map((category) => {
      const usedUsd = categorySpentUsd(category.label);
      const pct =
        category.limitUsd > 0
          ? Math.round((usedUsd / category.limitUsd) * 100)
          : usedUsd > 0
            ? 100
            : 0;
      return { ...category, usedUsd, pct };
    })
    .filter((category) => category.pct >= 75)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 2);
  const recentTransactions = activeTransactions.slice(0, 3);
  const activeWallet = activeWallets.find((w) => w.id === selectedWalletId) ?? activeWallets[0];

  return (
    <PhoneFrame className="z-10">
      <div className="flex-1 overflow-y-auto flex flex-col px-7 pt-10 pb-28 min-h-0">
        <header className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">Good evening, {firstName}</p>
            <h2 className="truncate font-display text-[24px] leading-none tracking-tight">
              {household?.name ?? "Your budget"}
            </h2>
          </div>
          <button
            className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--muted)]"
            aria-label="Notifications"
            onClick={() => navigate("alerts")}
          >
            <Bell className="h-4 w-4" strokeWidth={2.25} />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--danger)]" />
            )}
          </button>
        </header>

        {activeWallet && (
          <div className="mt-5 flex flex-col gap-1 items-start">
            <button
              onClick={() => navigate("wallet_switcher")}
              className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-[var(--shadow-soft)] transition-transform active:scale-95 cursor-pointer"
            >
              <span
                className="grid h-5 w-5 place-items-center rounded-full"
                style={{ background: "oklch(0.96 0.05 265)", color: activeWallet.color }}
              >
                {activeWallet.type === "private" ? (
                  <Lock className="h-3 w-3" strokeWidth={2.5} />
                ) : (
                  <Users className="h-3 w-3" strokeWidth={2.5} />
                )}
              </span>
              <span className="text-[11px] font-bold text-foreground">{activeWallet.label}</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2.5} />
            </button>
            <p className="text-[10px] text-muted-foreground">Active wallet · tap to switch</p>
          </div>
        )}

        <div className="mt-4">
          <BalanceHeader
            balanceUsd={balanceUsd}
            incomeUsd={incomeUsd}
            spentUsd={spentUsd}
            interactive
          />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-[13px] font-bold text-foreground">Today</p>
          <button
            type="button"
            onClick={() => navigate("subscriptions")}
            className="text-[11px] font-bold text-[var(--primary)]"
          >
            View bills
          </button>
        </div>

        {(showUpcoming || showForecast) && (
          <div
            className={`mt-2 grid gap-2 ${showUpcoming && showForecast ? "grid-cols-2" : "grid-cols-1"}`}
          >
            {showUpcoming && (
              <button
                type="button"
                onClick={() => navigate("subscriptions")}
                className="rounded-2xl bg-white p-3 text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-[oklch(0.96_0.05_25)] text-[var(--danger)]">
                    <Clock className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <span className="text-[11px] font-bold text-foreground">Upcoming</span>
                </div>
                <p className="mt-3 text-[12px] font-semibold text-foreground">
                  {upcomingBills[0]?.item.label ?? "No bills due"}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {upcomingBills[0]
                    ? formatScheduleSubtext(upcomingBills[0].info, { includeCategory: true })
                    : "Add recurring bills"}
                </p>
              </button>
            )}

            {showForecast && (
              <button
                type="button"
                onClick={() => navigate("recurring_income")}
                className="rounded-2xl bg-white p-3 text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-[oklch(0.96_0.04_145)] text-[var(--success)]">
                    <TrendingUp className="h-4 w-4" strokeWidth={2.25} />
                  </span>
                  <span className="text-[11px] font-bold text-foreground">Forecast</span>
                </div>
                <div className="mt-3">
                  <Money usd={expectedIncomeUsd} size="sm" tone="success" />
                </div>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {forecastItems.length} deposit{forecastItems.length === 1 ? "" : "s"} due soon
                </p>
              </button>
            )}
          </div>
        )}

        {(primaryGoal || budgetAlerts.length > 0) && (
          <div className="mt-3 space-y-2">
            {primaryGoal && (
              <button
                type="button"
                onClick={() => {
                  setSelectedGoalId(primaryGoal.id);
                  navigate("goal_detail");
                }}
                className="w-full rounded-2xl bg-white text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[oklch(0.95_0.04_265)] text-[var(--primary)]">
                    <GoalIcon
                      name={normalizeGoalIconName(primaryGoal.icon)}
                      className="h-4 w-4"
                      strokeWidth={2.25}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-bold text-foreground">
                      {primaryGoal.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{goalPct}% funded</p>
                  </div>
                  <Money usd={primaryGoal.savedUsd} size="sm" />
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--muted)]">
                  <div
                    className="h-full rounded-full bg-[var(--primary)]"
                    style={{ width: `${goalPct}%` }}
                  />
                </div>
              </button>
            )}
            {budgetAlerts.map((category) => (
              <button
                type="button"
                key={category.id}
                onClick={() => navigate("categories")}
                className="flex w-full items-center gap-3 rounded-2xl bg-white py-2.5 text-left"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[oklch(0.96_0.05_25)] text-[var(--danger)]">
                  <AlertTriangle className="h-4 w-4" strokeWidth={2.25} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-bold text-foreground">
                    {category.label} near limit
                  </p>
                  <p className="text-[10px] text-muted-foreground">{category.pct}% used</p>
                </div>
                <Money usd={category.usedUsd} size="sm" />
              </button>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between">
          <p className="text-[13px] font-bold text-foreground">Recent activity</p>
          <button
            type="button"
            onClick={() => navigate("history_search")}
            className="text-[11px] font-bold text-[var(--primary)]"
          >
            See all
          </button>
        </div>

        <div>
          {recentTransactions.map((transaction) => (
            <button
              key={transaction.id}
              type="button"
              onClick={() => {
                setSelectedTransactionId(transaction.id);
                navigate(transaction.usd < 0 ? "expense_detail" : "income_detail");
              }}
              className="flex w-full items-center gap-3 rounded-2xl bg-white py-1.5 text-left"
            >
              <span
                className={`grid h-10 w-10 place-items-center rounded-xl ${
                  transaction.usd < 0
                    ? "bg-[oklch(0.96_0.05_25)] text-[var(--danger)]"
                    : "bg-[oklch(0.95_0.08_150)] text-[var(--success)]"
                }`}
              >
                <ArrowDownLeft
                  className={`h-4 w-4 ${transaction.usd < 0 ? "rotate-180" : ""}`}
                  strokeWidth={2.25}
                />
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-[12px] font-bold text-foreground">
                  {transaction.name}
                </span>
                <span className="block text-[10px] text-muted-foreground">{transaction.who}</span>
              </span>
              <Money
                usd={transaction.usd}
                size="sm"
                tone={transaction.usd < 0 ? "danger" : "success"}
                signed
              />
            </button>
          ))}
          {recentTransactions.length === 0 && (
            <button
              onClick={() => navigate("add_expense")}
              className="flex w-full items-center gap-3 rounded-2xl bg-white py-3 text-left"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[oklch(0.95_0.08_150)] text-[var(--success)]">
                <CheckCircle2 className="h-4 w-4" strokeWidth={2.25} />
              </span>
              <span>
                <span className="block text-[12px] font-bold text-foreground">
                  Start tracking today
                </span>
                <span className="block text-[10px] text-muted-foreground">
                  Add your first transaction.
                </span>
              </span>
              <Plus className="ml-auto h-4 w-4 text-muted-foreground" strokeWidth={2.25} />
            </button>
          )}
        </div>
      </div>
      <BottomNav active="home" />
    </PhoneFrame>
  );
}
