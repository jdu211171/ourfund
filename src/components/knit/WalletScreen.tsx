import {
  ArrowRightLeft,
  CalendarClock,
  ChevronRight,
  Lock,
  PiggyBank,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { ComingSoonBadge } from "./ComingSoonBadge";
import { BottomNav } from "./BottomNav";
import { BudgetModeToggle } from "./BudgetModeToggle";
import { Money } from "./Money";
import { useAppNavigation } from "@/lib/navigation";
import { categoryIconMap } from "./categoryOptions";
import { GoalIcon, normalizeGoalIconName } from "./goalIconOptions";
import { formatScheduleSubtext, getScheduleInfo } from "@/lib/schedules";

export function WalletScreen() {
  const {
    navigate,
    budgetMode,
    activeWallets,
    walletBalanceUsd,
    categories,
    categorySpentUsd,
    balanceUsd,
    members,
    selectedMemberId,
    goals,
    setSelectedGoalId,
    linkedBanks,
    subscriptions,
    recurringIncome,
  } = useAppNavigation();
  const viewedMember = members.find((member) => member.id === selectedMemberId);

  const sortedWallets = [...activeWallets].sort((a, b) => {
    if (budgetMode === "personal") {
      return a.type === "private" ? -1 : 1;
    }
    return a.type !== "private" ? -1 : 1;
  });
  const primaryWallet = sortedWallets[0] ?? null;
  const visibleOwner =
    budgetMode === "personal" && viewedMember ? viewedMember.name.split(" ")[0] : "Household";
  const categoryRows = categories
    .map((category) => {
      const usedUsd = categorySpentUsd(category.label);
      const pct =
        category.limitUsd > 0 ? Math.min(100, Math.round((usedUsd / category.limitUsd) * 100)) : 0;
      return { ...category, usedUsd, pct };
    })
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 4);
  const scheduledIncomeRows = recurringIncome
    .map((item) => ({ item, info: getScheduleInfo(item.every) }))
    .sort((a, b) => (a.info.daysUntil ?? 9999) - (b.info.daysUntil ?? 9999));
  const scheduledExpenseRows = subscriptions
    .map((item) => ({ item, info: getScheduleInfo(item.every) }))
    .sort((a, b) => (a.info.daysUntil ?? 9999) - (b.info.daysUntil ?? 9999));
  const scheduledIncomeUsd = recurringIncome.reduce((sum, item) => sum + item.amountUsd, 0);
  const scheduledExpenseUsd = subscriptions.reduce((sum, item) => sum + item.amountUsd, 0);
  const scheduledNetUsd = scheduledIncomeUsd - scheduledExpenseUsd;
  const nextIncome = scheduledIncomeRows[0];
  const nextExpense = scheduledExpenseRows[0];

  return (
    <PhoneFrame>
      <div className="flex-1 overflow-y-auto flex flex-col px-7 pt-10 pb-28 min-h-0">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-extrabold tracking-tight text-[oklch(0.2_0.08_265)]">
              Wallets
            </h2>
            <p className="text-[11px] text-muted-foreground">{visibleOwner} money map</p>
          </div>
          <BudgetModeToggle className="scale-95 origin-right" />
        </header>

        <section className="mt-4 rounded-3xl bg-white">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Active containers
              </p>
              <p className="mt-1 text-[18px] font-extrabold text-foreground">
                {activeWallets.length} wallets
              </p>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {primaryWallet ? `${primaryWallet.label} is primary` : "Create a wallet to start"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Total</p>
              <Money usd={balanceUsd} size="md" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => navigate("transfer")}
              className="flex items-center gap-2 rounded-2xl bg-[var(--muted)] py-3 text-left"
            >
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-white text-[var(--primary)]">
                <ArrowRightLeft className="h-4 w-4" strokeWidth={2.25} />
              </span>
              <span>
                <span className="block text-[11px] font-bold text-foreground">Move money</span>
                <span className="block text-[10px] text-muted-foreground">Between wallets</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => navigate("new_wallet")}
              className="flex items-center gap-2 rounded-2xl bg-[var(--muted)] py-3 text-left"
            >
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-white text-[var(--primary)]">
                <WalletCards className="h-4 w-4" strokeWidth={2.25} />
              </span>
              <span>
                <span className="block text-[11px] font-bold text-foreground">New wallet</span>
                <span className="block text-[10px] text-muted-foreground">Shared or private</span>
              </span>
            </button>
          </div>
        </section>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-[13px] font-bold text-[oklch(0.2_0.08_265)]">
            {budgetMode === "personal" && viewedMember
              ? `${viewedMember.name.split(" ")[0]}'s wallets`
              : "Household wallets"}
          </p>
          <button
            type="button"
            onClick={() => navigate("new_wallet")}
            className="text-[11px] font-bold text-[var(--primary)]"
          >
            Add
          </button>
        </div>

        <div className="mt-2">
          {sortedWallets.map((wallet) => (
            <div key={wallet.id} className="flex items-center gap-3 rounded-2xl bg-white py-3">
              <div
                className="grid h-11 w-11 place-items-center rounded-2xl"
                style={{ background: "oklch(0.96 0.05 265)", color: wallet.color }}
              >
                {wallet.type === "private" ? (
                  <Lock className="h-4 w-4" strokeWidth={2.25} />
                ) : wallet.type === "connected" ? (
                  <PiggyBank className="h-4 w-4" strokeWidth={2.25} />
                ) : (
                  <Users className="h-4 w-4" strokeWidth={2.25} />
                )}
              </div>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-[12px] font-bold text-foreground">{wallet.label}</p>
                <p className="text-[10px] text-muted-foreground">{wallet.sub}</p>
              </div>
              <Money usd={walletBalanceUsd(wallet.label)} size="sm" />
            </div>
          ))}
          {sortedWallets.length === 0 && (
            <button
              onClick={() => navigate("new_wallet")}
              className="w-full rounded-2xl bg-white py-5 text-center"
            >
              <p className="text-[13px] font-bold text-foreground">No wallet here yet</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Create a wallet for this view.
              </p>
            </button>
          )}
        </div>

        <section className="mt-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-bold text-[oklch(0.2_0.08_265)]">Scheduled cashflow</p>
            <button
              type="button"
              onClick={() => navigate("subscriptions")}
              className="text-[11px] font-bold text-[var(--primary)]"
            >
              Manage
            </button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => navigate("recurring_income")}
              className="rounded-2xl bg-white p-3 text-left shadow-[var(--shadow-soft)]"
            >
              <span className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-[oklch(0.95_0.08_150)] text-[var(--success)]">
                  <TrendingUp className="h-4 w-4" strokeWidth={2.25} />
                </span>
                <span className="text-[11px] font-bold text-foreground">Income</span>
              </span>
              <Money
                usd={scheduledIncomeUsd}
                size="sm"
                tone="success"
                signed={scheduledIncomeUsd > 0}
                className="mt-3"
              />
              <span className="mt-2 block truncate text-[10px] text-muted-foreground">
                {nextIncome
                  ? `${nextIncome.item.label} · ${formatScheduleSubtext(nextIncome.info)}`
                  : "No scheduled income"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => navigate("subscriptions")}
              className="rounded-2xl bg-white p-3 text-left shadow-[var(--shadow-soft)]"
            >
              <span className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-[oklch(0.96_0.05_25)] text-[var(--danger)]">
                  <TrendingDown className="h-4 w-4" strokeWidth={2.25} />
                </span>
                <span className="text-[11px] font-bold text-foreground">Bills</span>
              </span>
              <Money usd={scheduledExpenseUsd} size="sm" tone="danger" className="mt-3" />
              <span className="mt-2 block truncate text-[10px] text-muted-foreground">
                {nextExpense
                  ? `${nextExpense.item.label} · ${formatScheduleSubtext(nextExpense.info)}`
                  : "No scheduled bills"}
              </span>
            </button>
          </div>
          <div className="mt-2 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-[var(--shadow-soft)]">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--muted)] text-[var(--primary)]">
              <CalendarClock className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-bold text-foreground">Net scheduled</span>
              <span className="block text-[10px] text-muted-foreground">
                {recurringIncome.length} income · {subscriptions.length} bills
              </span>
            </span>
            <Money
              usd={scheduledNetUsd}
              size="sm"
              tone={scheduledNetUsd >= 0 ? "success" : "danger"}
              signed
            />
          </div>
        </section>

        <div className="mt-2 flex items-center justify-between">
          <p className="text-[13px] font-bold text-[oklch(0.2_0.08_265)]">Category controls</p>
          <button
            type="button"
            onClick={() => navigate("categories")}
            className="text-[11px] font-bold text-[var(--primary)]"
          >
            Manage
          </button>
        </div>

        <div className="mt-2 space-y-2.5">
          {categoryRows.map((category) => {
            const Icon = categoryIconMap[category.icon] ?? ShoppingBag;
            return (
              <button
                type="button"
                key={category.id}
                onClick={() => navigate("categories")}
                className="w-full rounded-2xl bg-white py-2.5 text-left"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-10 w-10 place-items-center rounded-xl text-white"
                    style={{ background: category.color }}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2.25} />
                  </div>
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate text-[12px] font-bold text-foreground">
                      {category.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{category.pct}% of limit</p>
                  </div>
                  <Money usd={category.usedUsd} size="sm" />
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--muted)]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${category.pct}%`,
                      background: category.pct > 80 ? "var(--danger)" : category.color,
                    }}
                  />
                </div>
              </button>
            );
          })}
          {categoryRows.length === 0 && (
            <button
              onClick={() => navigate("new_category")}
              className="w-full rounded-2xl bg-white py-2 text-center"
            >
              <p className="text-[13px] font-bold text-foreground">No limits yet</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Add budget categories to track spending.
              </p>
            </button>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <p className="text-[13px] font-bold text-[oklch(0.2_0.08_265)]">Goals</p>
          <button
            type="button"
            onClick={() => navigate("new_goal")}
            className="text-[11px] font-bold text-[var(--primary)]"
          >
            New
          </button>
        </div>
        <div className="mt-2">
          {goals.slice(0, 2).map((goal) => {
            const pct = Math.min(
              100,
              Math.round((goal.savedUsd / Math.max(goal.targetUsd, 1)) * 100),
            );
            const goalIconName = normalizeGoalIconName(goal.icon);
            const targetDateLabel = (() => {
              const d = goal.targetDate;
              if (!d || d === "No deadline") return "No deadline";
              const match = d.match(/^(\d{4})-(\d{2})$/);
              if (!match) return d;
              const dt = new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, 1);
              return dt.toLocaleDateString("en-US", { month: "short", year: "numeric" });
            })();

            return (
              <button
                key={goal.id}
                type="button"
                onClick={() => {
                  setSelectedGoalId(goal.id);
                  navigate("goal_detail");
                }}
                className="flex w-full items-center gap-3 rounded-2xl bg-white py-3 text-left"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[oklch(0.95_0.04_265)] text-[var(--primary)]">
                  <GoalIcon name={goalIconName} className="h-4 w-4" strokeWidth={2.25} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-bold text-foreground">
                    {goal.title}
                  </span>
                  <span className="block text-[10px] text-muted-foreground">
                    {pct}% funded by {targetDateLabel}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" strokeWidth={2.25} />
              </button>
            );
          })}
        </div>
      </div>
      <BottomNav active="wallet" />
    </PhoneFrame>
  );
}
