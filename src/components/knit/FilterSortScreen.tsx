import { ArrowLeft, Check } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { useAppNavigation } from "@/lib/navigation";
import { useState } from "react";

const sorts = ["Newest", "Oldest", "Highest amount", "Lowest amount"];
const dateRanges = ["All time", "Today", "This month"];

export function FilterSortScreen() {
  const {
    goBack,
    navigate,
    historyFilters,
    setHistoryFilters,
    resetHistoryFilters,
    activeTransactions,
    members,
    categories,
  } = useAppNavigation();
  const [dateRange, setDateRange] = useState(dateRanges[0]);
  const memberFilters = [
    "Anyone",
    ...members.map((member) => member.name.split(" ").filter(Boolean)[0]).filter(Boolean),
  ];
  const categoryFilters = [
    ...new Set([
      ...categories.map((category) => category.label),
      ...activeTransactions.map((transaction) => transaction.category),
    ]),
  ];

  const toggleCategory = (category: string) => {
    setHistoryFilters({
      categories: historyFilters.categories.includes(category)
        ? historyFilters.categories.filter((c) => c !== category)
        : [...historyFilters.categories, category],
    });
  };

  const resultCount = activeTransactions.filter((txn) => {
    if (
      historyFilters.member !== "Anyone" &&
      !txn.who.toLowerCase().includes(historyFilters.member.toLowerCase())
    )
      return false;
    if (historyFilters.categories.length > 0 && !historyFilters.categories.includes(txn.category))
      return false;
    const amount = Math.abs(txn.usd);
    return amount >= historyFilters.minUsd && amount <= historyFilters.maxUsd;
  }).length;

  return (
    <PhoneFrame>
      <div className="flex h-full flex-col px-7 pt-10 pb-7">
        <header className="flex items-center justify-between">
          <button
            onClick={goBack}
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-slate-50 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
          </button>
          <h2 className="text-[17px] font-bold tracking-tight">Filter & sort</h2>
          <button
            onClick={resetHistoryFilters}
            className="text-[12px] font-semibold text-[var(--primary)]"
          >
            Reset
          </button>
        </header>

        <div className="mt-5 space-y-5 overflow-hidden">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Member
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {memberFilters.map((m) => (
                <button
                  key={m}
                  onClick={() => setHistoryFilters({ member: m })}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${historyFilters.member === m ? "bg-[var(--primary)] text-white" : "bg-white text-foreground shadow-[var(--shadow-soft)]"}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Category
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {categoryFilters.map((c) => (
                <button
                  key={c}
                  onClick={() => toggleCategory(c)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${historyFilters.categories.includes(c) ? "bg-[var(--primary)] text-white" : "bg-white text-foreground shadow-[var(--shadow-soft)]"}`}
                >
                  {c}
                </button>
              ))}
              {categoryFilters.length === 0 && (
                <button
                  onClick={() => navigate("new_category")}
                  className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-foreground shadow-[var(--shadow-soft)]"
                >
                  Add category
                </button>
              )}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Date range
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {dateRanges.map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`rounded-2xl px-3 py-2.5 text-left shadow-[var(--shadow-soft)] ${
                    dateRange === range
                      ? "bg-[var(--primary)] text-white"
                      : "bg-white text-foreground"
                  }`}
                >
                  <p
                    className={`text-[10px] ${dateRange === range ? "text-white/70" : "text-muted-foreground"}`}
                  >
                    Range
                  </p>
                  <p className="text-[12px] font-bold">{range}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Amount range
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-white px-3 py-2.5 shadow-[var(--shadow-soft)]">
                <p className="text-[10px] text-muted-foreground">Min</p>
                <input
                  value={historyFilters.minUsd}
                  onChange={(e) =>
                    setHistoryFilters({
                      minUsd: Number(e.target.value.replace(/[^0-9.]/g, "")) || 0,
                    })
                  }
                  className="w-full bg-transparent text-[12px] font-bold text-foreground outline-none"
                />
              </div>
              <div className="rounded-2xl bg-white px-3 py-2.5 shadow-[var(--shadow-soft)]">
                <p className="text-[10px] text-muted-foreground">Max</p>
                <input
                  value={historyFilters.maxUsd}
                  onChange={(e) =>
                    setHistoryFilters({
                      maxUsd: Number(e.target.value.replace(/[^0-9.]/g, "")) || 0,
                    })
                  }
                  className="w-full bg-transparent text-[12px] font-bold text-foreground outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Sort by
            </p>
            <div className="mt-2 rounded-2xl bg-white shadow-[var(--shadow-soft)]">
              {sorts.map((s, i) => (
                <button
                  key={s}
                  onClick={() => setHistoryFilters({ sort: s })}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-[12px] font-semibold ${i < sorts.length - 1 ? "border-b border-[oklch(0.94_0.01_265)]" : ""}`}
                >
                  {s}
                  {historyFilters.sort === s && (
                    <Check className="h-3.5 w-3.5 text-[var(--primary)]" strokeWidth={3} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate("history_search")}
          className="mt-auto w-full rounded-full bg-[oklch(0.18_0.04_265)] py-4 text-[15px] font-semibold text-white"
        >
          Show {resultCount} results
        </button>
      </div>
    </PhoneFrame>
  );
}
