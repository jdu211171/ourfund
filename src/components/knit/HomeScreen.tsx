import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowRightLeft,
  Bell,
  Briefcase,
  CheckCircle2,
  Clock,
  Plus,
  Receipt,
  Target,
  TrendingUp,
} from "lucide-react";
import { useEffect } from "react";
import { PhoneFrame } from "./PhoneFrame";
import { BottomNav } from "./BottomNav";
import { BudgetModeToggle } from "./BudgetModeToggle";
import { Money } from "./Money";
import { useAppNavigation } from "@/lib/navigation";

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
    categories,
    categorySpentUsd,
    notifications,
  } = useAppNavigation();

  useEffect(() => {
    if (budgetMode === "personal" && currentMemberId && selectedMemberId !== currentMemberId) {
      setSelectedMemberId(currentMemberId);
    }
  }, [budgetMode, currentMemberId, selectedMemberId, setSelectedMemberId]);

  const firstName = profile.name.trim().split(" ").filter(Boolean)[0] ?? "there";
  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const netUsd = incomeUsd - spentUsd;
  const savingsPct = incomeUsd > 0 ? Math.round((Math.max(netUsd, 0) / incomeUsd) * 100) : 0;
  const upcomingBills = subscriptions.slice(0, 2);
  const expectedIncomeUsd = recurringIncome.reduce((sum, item) => sum + item.amountUsd, 0);
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

  const quickActions = [
    { label: "Expense", Icon: Receipt, screen: "add_expense" },
    { label: "Income", Icon: Briefcase, screen: "add_income" },
    { label: "Transfer", Icon: ArrowRightLeft, screen: "transfer" },
    { label: "Goal", Icon: Target, screen: "new_goal" },
  ] as const;

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

        <div className="mt-4 flex items-center justify-between gap-3">
          <BudgetModeToggle />
          <button
            type="button"
            onClick={() => navigate("history_search")}
            className="rounded-full bg-white px-3 py-2 text-[11px] font-bold text-foreground"
          >
            History
          </button>
        </div>

        <section className="mt-4 rounded-3xl bg-[oklch(0.18_0.04_265)] p-4 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/60">
                {budgetMode === "personal" ? "Personal cash left" : "Household cash left"}
              </p>
              <div className="mt-1">
                <Money usd={balanceUsd} size="lg" className="text-white [&_*]:text-white" />
              </div>
            </div>
            <div
              className={`rounded-2xl px-3 py-2 text-right ${
                netUsd >= 0 ? "bg-white/12 text-white" : "bg-[oklch(0.6_0.22_25)] text-white"
              }`}
            >
              <p className="text-[10px] font-semibold opacity-75">Net</p>
              <Money usd={netUsd} size="sm" tone={netUsd >= 0 ? "success" : "danger"} signed />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-left">
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-[10px] text-white/60">Income</p>
              <Money usd={incomeUsd} size="sm" className="[&_*]:text-white" />
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-[10px] text-white/60">Spent</p>
              <Money usd={spentUsd} size="sm" className="[&_*]:text-white" />
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-[10px] text-white/60">Saved</p>
              <p className="mt-1 text-[13px] font-extrabold">{savingsPct}%</p>
            </div>
          </div>
        </section>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {quickActions.map(({ label, Icon, screen }) => (
            <button
              key={label}
              type="button"
              onClick={() => navigate(screen)}
              className="flex flex-col items-center gap-2 rounded-2xl bg-white px-2 py-3 text-center"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[oklch(0.95_0.04_265)] text-[var(--primary)]">
                <Icon className="h-4 w-4" strokeWidth={2.35} />
              </span>
              <span className="text-[10px] font-bold text-foreground">{label}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-[13px] font-bold text-foreground">Today</p>
          <button
            type="button"
            onClick={() => navigate("subscriptions")}
            className="text-[11px] font-bold text-[var(--primary)]"
          >
            View bills
          </button>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
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
              {upcomingBills[0]?.label ?? "No bills due"}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {upcomingBills[0]?.every ?? "Add recurring bills"}
            </p>
          </button>

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
              {recurringIncome.length} scheduled deposits
            </p>
          </button>
        </div>

        {(primaryGoal || budgetAlerts.length > 0) && (
          <div className="mt-3 space-y-2">
            {primaryGoal && (
              <button
                type="button"
                onClick={() => navigate("goal_detail")}
                className="w-full rounded-2xl bg-white p-3 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[oklch(0.95_0.04_265)] text-[var(--primary)]">
                    <Target className="h-4 w-4" strokeWidth={2.25} />
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
                className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-2.5 text-left"
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

        <div className="mt-2 space-y-2">
          {recentTransactions.map((transaction) => (
            <button
              key={transaction.id}
              type="button"
              onClick={() => {
                setSelectedTransactionId(transaction.id);
                navigate(transaction.usd < 0 ? "expense_detail" : "income_detail");
              }}
              className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-2.5 text-left"
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
              className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-3 text-left"
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
