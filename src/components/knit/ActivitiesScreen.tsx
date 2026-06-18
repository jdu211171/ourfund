import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Landmark,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, ReferenceLine } from "recharts";
import { PhoneFrame } from "./PhoneFrame";
import { BottomNav } from "./BottomNav";
import { BudgetModeToggle } from "./BudgetModeToggle";
import { Money } from "./Money";
import { useAppNavigation, type ReportPeriod } from "@/lib/navigation";
import { categoryIconMap } from "./categoryOptions";

const labels: Record<ReportPeriod, string[]> = {
  Week: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  Month: ["W1", "W2", "W3", "W4"],
  Year: ["Jan", "Mar", "May", "Jul", "Sep", "Nov"],
};

const tabLabels: Record<ReportPeriod, string> = {
  Week: "This week",
  Month: "This month",
  Year: "This year",
};

export function ActivitiesScreen({
  initial = "Month" as ReportPeriod,
}: { initial?: ReportPeriod } = {}) {
  const {
    navigate,
    budgetMode,
    reportPeriod,
    setReportPeriod,
    incomeUsd,
    spentUsd,
    currentMonthTransactions,
    categories,
    categorySpentUsd,
  } = useAppNavigation();
  const tab = reportPeriod ?? initial;
  const expenses = currentMonthTransactions.filter((transaction) => transaction.usd < 0);
  const incomeTransactions = currentMonthTransactions.filter((transaction) => transaction.usd > 0);
  const chartData = labels[tab].map((label, index) => {
    const expense = expenses[index];
    const income = incomeTransactions[index];
    return {
      m: label,
      spent: Math.abs(expense?.usd ?? 0),
      income: income?.usd ?? 0,
    };
  });
  const peak = chartData.reduce(
    (max, item) => (item.spent > max.spent ? item : max),
    chartData[0] ?? { m: "-", spent: 0, income: 0 },
  );
  const netUsd = incomeUsd - spentUsd;
  const avgExpenseUsd = spentUsd / Math.max(expenses.length, 1);
  const categoryRows = (
    categories.length > 0
      ? categories.map((category) => {
          const usedUsd = categorySpentUsd(category.label);
          const pct =
            category.limitUsd > 0
              ? Math.min(100, Math.round((usedUsd / category.limitUsd) * 100))
              : 0;
          return {
            Icon: categoryIconMap[category.icon] ?? ShoppingBag,
            name: category.label,
            note: `${pct}% of limit`,
            usd: -usedUsd,
            color: category.color,
            pct,
          };
        })
      : Array.from(new Set(expenses.map((transaction) => transaction.category))).map((name) => {
          const matching = expenses.filter((transaction) => transaction.category === name);
          const usedUsd = matching.reduce((sum, transaction) => sum + Math.abs(transaction.usd), 0);
          return {
            Icon: ShoppingBag,
            name,
            note: `${matching.length} transactions`,
            usd: -usedUsd,
            color: "oklch(0.55 0.24 265)",
            pct: spentUsd > 0 ? Math.round((usedUsd / spentUsd) * 100) : 0,
          };
        })
  )
    .filter((row) => row.usd !== 0)
    .sort((a, b) => Math.abs(b.usd) - Math.abs(a.usd));
  const topCategory = categoryRows[0] ?? null;
  const riskyCategories = categoryRows.filter((row) => row.pct >= 80);

  return (
    <PhoneFrame>
      <div className="flex-1 overflow-y-auto flex flex-col px-7 pt-10 pb-28 min-h-0">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-extrabold tracking-tight text-[oklch(0.2_0.08_265)]">
              Reports
            </h2>
            <p className="text-[11px] text-muted-foreground">
              {budgetMode === "personal" ? "Personal" : "Family"} insights
            </p>
          </div>
          <BudgetModeToggle className="scale-95 origin-right" />
        </header>

        <div className="mt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("analytics")}
            className="text-[11px] font-bold text-[var(--primary)]"
          >
            Analytics
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 rounded-full bg-[var(--muted)] p-1 text-[12px] font-semibold">
          {(["Week", "Month", "Year"] as ReportPeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => setReportPeriod(period)}
              className={`rounded-full py-2 transition ${
                period === tab
                  ? "bg-white text-foreground shadow-[var(--shadow-soft)]"
                  : "text-muted-foreground"
              }`}
            >
              {period}
            </button>
          ))}
        </div>

        <section className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white p-3 flex flex-col items-center text-center">
            <span className="grid h-7 w-7 place-items-center rounded-xl bg-[oklch(0.96_0.05_25)] text-[var(--danger)]">
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
            <p className="mt-2 text-[10px] text-muted-foreground">Spent</p>
            <Money usd={spentUsd} size="sm" tone="danger" />
          </div>
          <div className="rounded-2xl bg-white p-3 flex flex-col items-center text-center">
            <span className="grid h-7 w-7 place-items-center rounded-xl bg-[oklch(0.96_0.04_145)] text-[var(--success)]">
              <ArrowDownLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
            <p className="mt-2 text-[10px] text-muted-foreground">Income</p>
            <Money usd={incomeUsd} size="sm" tone="success" />
          </div>
          <div className="rounded-2xl bg-white p-3 flex flex-col items-center text-center">
            <span className="grid h-7 w-7 place-items-center rounded-xl bg-[oklch(0.95_0.04_265)] text-[var(--primary)]">
              <Landmark className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
            <p className="mt-2 text-[10px] text-muted-foreground">Net</p>
            <Money usd={netUsd} size="sm" />
          </div>
        </section>

        <section className="rounded-3xl bg-white mt-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {tabLabels[tab]} pattern
              </p>
              <div className="mt-1">
                <Money usd={spentUsd} size="lg" tone="danger" />
              </div>
            </div>
            <span className="rounded-full bg-[var(--muted)] px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
              peak {peak?.m ?? "-"}
            </span>
          </div>

          <div className="-mx-2 mt-3 h-[128px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 6, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="nestSpentFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.6 0.22 25)" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="oklch(0.6 0.22 25)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="m"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "oklch(0.55 0.02 260)" }}
                />
                <YAxis hide />
                <ReferenceLine x={peak?.m} stroke="oklch(0.55 0.02 260)" strokeDasharray="2 3" />
                <Area
                  type="monotone"
                  dataKey="spent"
                  stroke="oklch(0.6 0.22 25)"
                  strokeWidth={2.5}
                  fill="url(#nestSpentFill)"
                  dot={{ r: 3, fill: "white", stroke: "oklch(0.6 0.22 25)", strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: "white", stroke: "oklch(0.2 0.08 265)", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Deep dive", Icon: BarChart3, screen: "analytics" },
            { label: "Filter", Icon: SlidersHorizontal, screen: "filter_sort" },
            { label: "Search", Icon: Search, screen: "history_search" },
            { label: "Months", Icon: Landmark, screen: "monthly_history" },
          ].map(({ label, Icon, screen }) => (
            <button
              key={label}
              type="button"
              onClick={() => navigate(screen as any)}
              className="flex flex-col items-center gap-2 rounded-2xl bg-white px-2 py-3"
            >
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-[oklch(0.95_0.04_265)] text-[var(--primary)]">
                <Icon className="h-4 w-4" strokeWidth={2.35} />
              </span>
              <span className="text-[10px] font-bold text-foreground">{label}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-[13px] font-bold text-[oklch(0.2_0.08_265)]">Category breakdown</p>
          <p className="text-[10px] font-semibold text-muted-foreground">
            Avg <Money usd={avgExpenseUsd} size="sm" tone="danger" />
          </p>
        </div>

        <div className="mt-2 space-y-2">
          {categoryRows.slice(0, 5).map((row) => (
            <button
              key={row.name}
              type="button"
              onClick={() => navigate("categories")}
              className="w-full rounded-2xl bg-white py-2.5 text-left"
            >
              <div className="flex items-center gap-3">
                <div
                  className="grid h-10 w-10 place-items-center rounded-xl text-white"
                  style={{ background: row.color }}
                >
                  <row.Icon className="h-4 w-4" strokeWidth={2.25} />
                </div>
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="truncate text-[12px] font-bold text-foreground">{row.name}</p>
                  <p className="text-[10px] text-muted-foreground">{row.note}</p>
                </div>
                <Money usd={row.usd} size="sm" tone="danger" signed />
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--muted)]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(row.pct, 100)}%`,
                    background: row.pct > 80 ? "var(--danger)" : row.color,
                  }}
                />
              </div>
            </button>
          ))}
          {categoryRows.length === 0 && (
            <button
              onClick={() => navigate("add_expense")}
              className="w-full rounded-2xl bg-white px-4 py-5 text-center"
            >
              <p className="text-[13px] font-bold text-foreground">No spending yet</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Add expenses to build live reports.
              </p>
            </button>
          )}
        </div>

        <p className="mt-5 text-[13px] font-bold text-[oklch(0.2_0.08_265)]">Insights</p>
        <div className="mt-2 space-y-2">
          <div className="flex items-center gap-3 rounded-2xl bg-white py-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[oklch(0.95_0.04_265)] text-[var(--primary)]">
              <BarChart3 className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-bold text-foreground">
                {topCategory ? `${topCategory.name} leads spending` : "No top category yet"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {topCategory ? topCategory.note : "Create categories for better insights"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white py-3">
            <span
              className={`grid h-10 w-10 place-items-center rounded-xl ${
                riskyCategories.length > 0
                  ? "bg-[oklch(0.96_0.05_25)] text-[var(--danger)]"
                  : "bg-[oklch(0.96_0.04_145)] text-[var(--success)]"
              }`}
            >
              <AlertTriangle className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-bold text-foreground">
                {riskyCategories.length > 0
                  ? `${riskyCategories.length} categories near limit`
                  : "Budgets look controlled"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {netUsd >= 0 ? "Income still covers this period" : "Spending is above income"}
              </p>
            </div>
          </div>
        </div>
      </div>
      <BottomNav active="activity" />
    </PhoneFrame>
  );
}
