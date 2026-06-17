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
  ArrowUpRight,
  ArrowLeftRight,
  Target,
  TrendingDown,
  MoreHorizontal,
  Wallet as WalletIcon,
  PiggyBank,
  Briefcase,
  Receipt,
} from "lucide-react";
import { useEffect, useMemo } from "react";
import { PhoneFrame, useFrameMode } from "./PhoneFrame";
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
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
    walletBalanceUsd,
  } = useAppNavigation();

  const mode = useFrameMode();

  useEffect(() => {
    if (budgetMode === "personal" && currentMemberId && selectedMemberId !== currentMemberId) {
      setSelectedMemberId(currentMemberId);
    }
  }, [budgetMode, currentMemberId, selectedMemberId, setSelectedMemberId]);

  const firstName = profile.name.trim().split(" ").filter(Boolean)[0] ?? "there";
  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const scheduleToday = new Date();
  
  const upcomingBills = useMemo(() => {
    return subscriptions
      .map((item) => ({ item, info: getScheduleInfo(item.every, scheduleToday) }))
      .filter((entry) => entry.info.daysUntil !== null && entry.info.daysUntil <= 30) // Show upcoming bills up to 30 days
      .sort((a, b) => (a.info.daysUntil ?? 0) - (b.info.daysUntil ?? 0));
  }, [subscriptions, scheduleToday]);

  const forecastItems = useMemo(() => {
    return recurringIncome
      .map((item) => ({ item, info: getScheduleInfo(item.every, scheduleToday) }))
      .filter((entry) => entry.info.daysUntil !== null && entry.info.daysUntil <= 30)
      .sort((a, b) => (a.info.daysUntil ?? 0) - (b.info.daysUntil ?? 0));
  }, [recurringIncome, scheduleToday]);

  const expectedIncomeUsd = forecastItems.reduce((sum, entry) => sum + entry.item.amountUsd, 0);
  const showUpcoming = upcomingBills.filter(b => b.info.daysUntil !== null && b.info.daysUntil <= 5).length > 0;
  const showForecast = forecastItems.filter(f => f.info.daysUntil !== null && f.info.daysUntil <= 5).length > 0;
  
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

  // Dynamic cashflow calculation for charts
  const cashflow = useMemo(() => {
    const weeks = Array.from({ length: 8 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (7 * (7 - i)));
      return {
        label: `W${i + 1}`,
        start: new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay()),
        end: new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay() + 6, 23, 59, 59),
        income: 0,
        expense: 0,
      };
    });

    activeTransactions.forEach((t) => {
      const tDate = new Date(t.date);
      if (isNaN(tDate.getTime())) return;
      weeks.forEach((w) => {
        if (tDate >= w.start && tDate <= w.end) {
          if (t.usd > 0) {
            w.income += t.usd;
          } else {
            w.expense += Math.abs(t.usd);
          }
        }
      });
    });

    const hasData = weeks.some((w) => w.income > 0 || w.expense > 0);
    if (!hasData) {
      return [
        { d: "W1", income: 1200, expense: 820 },
        { d: "W2", income: 980, expense: 1140 },
        { d: "W3", income: 1640, expense: 1020 },
        { d: "W4", income: 1380, expense: 1580 },
        { d: "W5", income: 1820, expense: 1240 },
        { d: "W6", income: 2100, expense: 1640 },
        { d: "W7", income: 1740, expense: 1320 },
        { d: "W8", income: 2090, expense: 1290 },
      ];
    }

    return weeks.map((w) => ({
      d: w.label,
      income: Math.round(w.income),
      expense: Math.round(w.expense),
    }));
  }, [activeTransactions]);

  // Dynamic category spending for charts
  const categoryChartData = useMemo(() => {
    const colors = [
      "oklch(0.66 0.22 265)",
      "oklch(0.7 0.18 200)",
      "oklch(0.72 0.18 145)",
      "oklch(0.75 0.18 70)",
      "oklch(0.7 0.22 305)",
    ];
    const data = categories.map((cat, i) => {
      const val = Math.round(categorySpentUsd(cat.label));
      return {
        name: cat.label,
        value: val,
        color: cat.color || colors[i % colors.length],
      };
    }).filter((c) => c.value > 0);

    if (data.length === 0) {
      return [
        { name: "Rent", value: 1850, color: "oklch(0.66 0.22 265)" },
        { name: "Groceries", value: 612, color: "oklch(0.7 0.18 200)" },
        { name: "Transport", value: 186, color: "oklch(0.72 0.18 145)" },
        { name: "Dining", value: 94, color: "oklch(0.75 0.18 70)" },
        { name: "Other", value: 248, color: "oklch(0.7 0.22 305)" },
      ];
    }
    return data;
  }, [categories, categorySpentUsd]);

  const totalCategorySpent = useMemo(() => {
    return categoryChartData.reduce((sum, c) => sum + c.value, 0);
  }, [categoryChartData]);

  // Dynamic wallets list
  const desktopWallets = useMemo(() => {
    return activeWallets.map((w) => ({
      id: w.id,
      name: w.label,
      balance: walletBalanceUsd(w.label),
      color: w.color || "oklch(0.66 0.22 265)",
    })).slice(0, 3);
  }, [activeWallets, walletBalanceUsd]);

  const recentTransactionsDesktop = useMemo(() => {
    return activeTransactions.slice(0, 5);
  }, [activeTransactions]);

  if (mode === "web") {
    return (
      <div className="space-y-6">
        {/* Title row */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[12px] uppercase tracking-widest text-muted-foreground">Family Dashboard</p>
            <h1 className="font-display text-[34px] leading-none tracking-tight text-foreground">Good evening, {firstName}</h1>
            <p className="mt-1.5 text-[13px] text-muted-foreground">
              Your household is <span className="font-semibold text-[var(--primary)]">{household?.name ?? "Joint household"}</span>. Keep it up.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("wallet_switcher")}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--card)] px-3.5 py-2.5 text-[12px] font-semibold text-foreground border border-[var(--border)] transition hover:bg-[var(--muted)]/50"
            >
              {activeWallet?.label ?? "Select wallet"} <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button
              onClick={() => navigate("add_expense")}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-[12px] font-bold text-white shadow-[0_12px_30px_-12px_oklch(0.55_0.24_265/0.7)] transition hover:opacity-90 cursor-pointer"
            >
              <ArrowUpRight className="h-4 w-4" /> New expense
            </button>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {[
            { label: "Net balance", usd: balanceUsd, change: 4.2, up: true, Icon: WalletIcon, accent: "oklch(0.66 0.22 265)" },
            { label: "Income", usd: incomeUsd, change: 2.1, up: true, Icon: ArrowDownLeft, accent: "oklch(0.72 0.18 145)" },
            { label: "Expense", usd: spentUsd, change: -8.4, up: false, Icon: ArrowUpRight, accent: "oklch(0.7 0.22 25)" },
            { label: "Savings Goal", usd: primaryGoal ? primaryGoal.savedUsd : 0, change: goalPct, up: true, Icon: PiggyBank, accent: "oklch(0.75 0.18 70)" },
          ].map((k) => (
            <div key={k.label} className="rounded-2xl bg-[var(--card)] p-5 border border-[var(--border)]">
              <div className="flex items-center justify-between">
                <span
                  className="grid h-9 w-9 place-items-center rounded-xl"
                  style={{ background: `color-mix(in oklab, ${k.accent} 22%, transparent)`, color: k.accent }}
                >
                  <k.Icon className="h-4 w-4" strokeWidth={2.5} />
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    k.up ? "bg-[var(--success)]/15 text-[var(--success)]" : "bg-[var(--danger)]/15 text-[var(--danger)]"
                  }`}
                >
                  {k.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {k.change > 0 ? "+" : ""}
                  {k.change}%
                </span>
              </div>
              <p className="mt-4 text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">{k.label}</p>
              <div className="mt-1">
                <Money usd={k.usd} size="lg" />
              </div>
            </div>
          ))}
        </div>

        {/* Main grid: chart + side */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="rounded-2xl bg-[var(--card)] p-6 xl:col-span-2 border border-[var(--border)]">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Cash flow</p>
                <p className="font-display text-[22px] leading-none tracking-tight text-foreground">Last 8 weeks</p>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground font-semibold">
                  <span className="h-2 w-2 rounded-full bg-[oklch(0.72_0.18_145)]" /> Income
                </span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground font-semibold">
                  <span className="h-2 w-2 rounded-full bg-[oklch(0.66_0.22_265)]" /> Expense
                </span>
              </div>
            </div>
            <div className="mt-5 h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashflow} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.72 0.18 145)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="oklch(0.72 0.18 145)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.66 0.22 265)" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="oklch(0.66 0.22 265)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "oklch(0.74 0.02 260)" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "oklch(0.74 0.02 260)" }} />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.235 0.028 265)",
                      border: "1px solid oklch(1 0 0 / 0.1)",
                      borderRadius: 12,
                      color: "white",
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="income" stroke="oklch(0.72 0.18 145)" strokeWidth={2.5} fill="url(#gIncome)" />
                  <Area type="monotone" dataKey="expense" stroke="oklch(0.66 0.22 265)" strokeWidth={2.5} fill="url(#gExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-2xl bg-[var(--card)] p-6 border border-[var(--border)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Spending by category</p>
                <p className="font-display text-[22px] leading-none tracking-tight text-foreground">
                  <Money usd={totalCategorySpent} size="md" />
                </p>
              </div>
              <button
                onClick={() => navigate("categories")}
                className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--muted)] text-muted-foreground transition hover:bg-[var(--accent)] cursor-pointer"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 flex items-center gap-5">
              <div className="h-[150px] w-[150px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryChartData} dataKey="value" innerRadius={48} outerRadius={70} paddingAngle={3} stroke="none">
                      {categoryChartData.map((c) => (
                        <Cell key={c.name} fill={c.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {categoryChartData.map((c) => (
                  <div key={c.name} className="flex items-center gap-2 text-[12px] text-foreground">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                    <span className="text-muted-foreground truncate max-w-[80px] font-semibold">{c.name}</span>
                    <span className="ml-auto font-bold"><Money usd={c.value} size="sm" /></span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Wallets */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <p className="font-display text-[20px] tracking-tight text-foreground">Wallets</p>
            <button onClick={() => navigate("wallet")} className="text-[12px] font-semibold text-[var(--primary)] transition hover:opacity-80">Manage</button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {desktopWallets.map((w) => (
              <div
                key={w.id}
                onClick={() => navigate("wallet_detail")}
                className="relative overflow-hidden rounded-2xl bg-[var(--card)] p-5 cursor-pointer transition hover:-translate-y-0.5 shadow-sm border border-[var(--border)]"
              >
                <div
                  className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-10 blur-2xl"
                  style={{ background: w.color }}
                />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span
                      className="grid h-9 w-9 place-items-center rounded-xl text-white"
                      style={{ background: w.color }}
                    >
                      <WalletIcon className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-4 text-[12px] text-muted-foreground font-semibold">{w.name}</p>
                  <div className="mt-1">
                    <Money usd={w.balance} size="lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom grid */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="rounded-2xl bg-[var(--card)] p-6 xl:col-span-2 border border-[var(--border)]">
            <div className="flex items-center justify-between">
              <p className="font-display text-[20px] tracking-tight text-foreground">Recent transactions</p>
              <button onClick={() => navigate("history_search")} className="text-[12px] font-semibold text-[var(--primary)] transition hover:opacity-80">View all</button>
            </div>
            <div className="mt-3 overflow-hidden rounded-xl border border-[var(--border)]">
              <table className="w-full text-left text-[13px] text-foreground">
                <thead className="bg-[var(--muted)]/60 text-[10px] uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Description</th>
                    <th className="px-4 py-2.5 font-semibold">Member</th>
                    <th className="px-4 py-2.5 font-semibold">Date</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactionsDesktop.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => {
                        setSelectedTransactionId(t.id);
                        navigate(t.usd > 0 ? "income_detail" : "expense_detail");
                      }}
                      className="border-t border-[var(--border)] cursor-pointer hover:bg-[var(--muted)]/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--muted)] text-muted-foreground">
                            <Receipt className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-semibold">{t.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-semibold">{t.who}</td>
                      <td className="px-4 py-3 text-muted-foreground">{t.date}</td>
                      <td className="px-4 py-3 text-right">
                        <Money usd={t.usd} size="sm" tone={t.usd > 0 ? "success" : "danger"} signed />
                      </td>
                    </tr>
                  ))}
                  {recentTransactionsDesktop.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-muted-foreground">No recent transactions.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-2xl bg-[var(--card)] p-6 border border-[var(--border)]">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Quick actions</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {[
                  { Icon: ArrowDownLeft, label: "Add income", tint: "var(--success)", action: () => navigate("add_income") },
                  { Icon: ArrowUpRight, label: "Add expense", tint: "var(--danger)", action: () => navigate("add_expense") },
                  { Icon: ArrowLeftRight, label: "Transfer", tint: "var(--primary)", action: () => navigate("transfer") },
                  { Icon: Target, label: "New goal", tint: "oklch(0.75 0.18 70)", action: () => navigate("new_goal") },
                ].map(({ Icon, label, tint, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    className="flex flex-col items-start gap-2 rounded-xl bg-[var(--muted)] p-3 text-left transition hover:bg-[var(--accent)] cursor-pointer"
                  >
                    <span
                      className="grid h-9 w-9 place-items-center rounded-lg"
                      style={{ color: tint, background: `color-mix(in oklab, ${tint} 18%, transparent)` }}
                    >
                      <Icon className="h-4 w-4" strokeWidth={2.5} />
                    </span>
                    <span className="text-[12px] font-bold text-foreground">{label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl bg-[var(--card)] p-6 border border-[var(--border)]">
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">Upcoming bills</p>
                <span className="rounded-full bg-[var(--muted)] px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                  Next 30 days
                </span>
              </div>
              <div className="mt-3 space-y-3">
                {upcomingBills.slice(0, 4).map((entry) => (
                  <div
                    key={entry.item.id}
                    onClick={() => navigate("subscriptions")}
                    className="flex items-center gap-3 cursor-pointer hover:opacity-90"
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--muted)] text-muted-foreground">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1 leading-tight">
                      <p className="truncate text-[12.5px] font-bold text-foreground">{entry.item.label}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatScheduleSubtext(entry.info, { includeCategory: true })}
                      </p>
                    </div>
                    <Money usd={-entry.item.amountUsd} size="sm" tone="danger" />
                  </div>
                ))}
                {upcomingBills.length === 0 && (
                  <p className="text-[12px] text-muted-foreground text-center py-2 font-semibold">No bills due soon.</p>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    );
  }

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
