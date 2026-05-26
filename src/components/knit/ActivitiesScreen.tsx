import { useState } from "react";
import { Bell, ShoppingBag, Home, Car, Coffee } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, ReferenceLine } from "recharts";
import { PhoneFrame } from "./PhoneFrame";
import { BottomNav } from "./BottomNav";
import { BalanceHeader } from "./BalanceHeader";
import { Money } from "./Money";
import { useAppNavigation } from "@/lib/navigation";

type Tab = "Week" | "Month" | "Year";

const labels: Record<Tab, string[]> = {
  Week: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  Month: ["W1", "W2", "W3", "W4"],
  Year: ["Jan", "Mar", "May", "Jul", "Sep", "Nov"],
};

const tabLabels: Record<Tab, string> = {
  Week: "This week",
  Month: "This month",
  Year: "This year",
};

const categoryIcons: Record<string, typeof Home> = {
  home: Home,
  shopping: ShoppingBag,
  car: Car,
  coffee: Coffee,
};

export function ActivitiesScreen({ initial = "Month" as Tab }: { initial?: Tab } = {}) {
  const {
    navigate,
    budgetMode,
    balanceUsd,
    incomeUsd,
    spentUsd,
    activeTransactions,
    categories,
    categorySpentUsd,
  } = useAppNavigation();
  const [tab, setTab] = useState<Tab>(initial);
  const expenses = activeTransactions.filter((transaction) => transaction.usd < 0);
  const chartData = labels[tab].map((label, index) => ({
    m: label,
    v: Math.abs(expenses[index]?.usd ?? 0),
  }));
  const peak = chartData.reduce((max, item) => (item.v > max.v ? item : max), chartData[0]);
  const categoryRows = (
    categories.length > 0
      ? categories.map((category) => ({
          Icon: categoryIcons[category.icon] ?? ShoppingBag,
          name: category.label,
          note: "Budget category",
          usd: -categorySpentUsd(category.label),
        }))
      : Array.from(new Set(expenses.map((transaction) => transaction.category))).map((name) => ({
          Icon: ShoppingBag,
          name,
          note: "Uncategorized budget",
          usd: -expenses
            .filter((transaction) => transaction.category === name)
            .reduce((sum, transaction) => sum + Math.abs(transaction.usd), 0),
        }))
  ).filter((row) => row.usd !== 0);

  return (
    <PhoneFrame>
      <div className="flex-1 overflow-y-auto flex flex-col px-7 pt-10 pb-28 min-h-0">
        <header className="flex items-center justify-between">
          <h2 className="text-[18px] font-extrabold tracking-tight text-[oklch(0.2_0.08_265)]">
            Reports
          </h2>
          <button
            onClick={() => navigate("alerts")}
            className="grid h-9 w-9 place-items-center rounded-full bg-[var(--muted)] text-foreground hover:bg-slate-200 transition-colors active:scale-95 cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </header>

        <div className="mt-4">
          <BalanceHeader
            balanceUsd={balanceUsd}
            incomeUsd={incomeUsd}
            spentUsd={spentUsd}
            label={`${budgetMode === "personal" ? "Personal" : "Family"} · ${tabLabels[tab]}`}
          />
        </div>

        <div className="mt-4 grid grid-cols-3 rounded-full bg-[var(--muted)] p-1 text-[12px] font-semibold">
          {(["Week", "Month", "Year"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full py-2 transition ${
                t === tab
                  ? "bg-white text-foreground shadow-[var(--shadow-soft)]"
                  : "text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-3xl bg-white p-4 shadow-[var(--shadow-soft)]">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {tabLabels[tab]} spent
              </p>
              <div className="mt-1">
                <Money usd={spentUsd} size="md" tone="danger" />
              </div>
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground">
              peak · {peak?.m ?? "-"}
            </span>
          </div>
          <div className="-mx-2 mt-2 h-[110px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 6, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="nestFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.55 0.24 265)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="oklch(0.55 0.24 265)" stopOpacity={0} />
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
                  dataKey="v"
                  stroke="oklch(0.55 0.24 265)"
                  strokeWidth={2.5}
                  fill="url(#nestFill)"
                  dot={{ r: 3, fill: "white", stroke: "oklch(0.55 0.24 265)", strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: "white", stroke: "oklch(0.2 0.08 265)", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <p className="mt-4 text-[13px] font-bold text-[oklch(0.2_0.08_265)]">By category</p>

        <div className="mt-2 space-y-2">
          {categoryRows.map((t) => (
            <div
              key={t.name}
              className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 shadow-[var(--shadow-soft)]"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[oklch(0.96_0.04_265)] text-[var(--primary)]">
                <t.Icon className="h-4 w-4" strokeWidth={2.25} />
              </div>
              <div className="flex-1 leading-tight">
                <p className="text-[12px] font-bold text-foreground">{t.name}</p>
                <p className="text-[10px] text-muted-foreground">{t.note}</p>
              </div>
              <Money usd={t.usd} size="sm" tone="danger" signed />
            </div>
          ))}
          {categoryRows.length === 0 && (
            <button
              onClick={() => navigate("add_expense")}
              className="w-full rounded-2xl bg-white px-4 py-5 text-center shadow-[var(--shadow-soft)]"
            >
              <p className="text-[13px] font-bold text-foreground">No spending yet</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Add expenses to build live reports.
              </p>
            </button>
          )}
        </div>
      </div>
      <BottomNav active="activity" />
    </PhoneFrame>
  );
}
