import { useState } from "react";
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  ShoppingBag,
  Coffee,
  Car,
  Home,
  Briefcase,
} from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { Money } from "./Money";
import { useAppNavigation, type Transaction, type TxnKind } from "@/lib/navigation";
import { getRelativeDateString, formatTransactionWho } from "@/context/helpers";

const filters: TxnKind[] = ["All", "Expense", "Income", "Goals", "Transfer"];

function iconFor(txn: Transaction) {
  const text = `${txn.category} ${txn.name}`.toLowerCase();
  if (txn.usd > 0) return Briefcase;
  if (text.includes("rent") || text.includes("housing") || text.includes("electric")) return Home;
  if (text.includes("dining") || text.includes("coffee")) return Coffee;
  if (text.includes("transport") || text.includes("gas")) return Car;
  return ShoppingBag;
}

function groupDate(date: string) {
  const rel = getRelativeDateString(date, new Date());
  return rel.charAt(0).toUpperCase() + rel.slice(1);
}

export function TransactionHistoryScreen() {
  const {
    goBack,
    navigate,
    activeTransactions,
    selectedTransactionId,
    setSelectedTransactionId,
    historyFilters,
    setHistoryFilters,
  } = useAppNavigation();
  const [query, setQuery] = useState("");

  const filtered = activeTransactions
    .filter((txn) => {
      if (historyFilters.kind === "Expense" && txn.usd >= 0) return false;
      if (historyFilters.kind === "Income" && txn.usd <= 0) return false;
      if (historyFilters.kind === "Goals" && txn.category !== "Goals") return false;
      if (historyFilters.kind === "Transfer" && txn.category !== "Transfer") return false;
      if (
        historyFilters.member !== "Anyone" &&
        !txn.who.toLowerCase().includes(historyFilters.member.toLowerCase())
      )
        return false;
      if (historyFilters.categories.length > 0 && !historyFilters.categories.includes(txn.category))
        return false;
      const amount = Math.abs(txn.usd);
      if (amount < historyFilters.minUsd || amount > historyFilters.maxUsd) return false;
      if (
        query &&
        !`${txn.name} ${txn.who} ${txn.category}`.toLowerCase().includes(query.toLowerCase())
      )
        return false;
      return true;
    })
    .sort((a, b) => {
      if (historyFilters.sort === "Highest amount") return Math.abs(b.usd) - Math.abs(a.usd);
      if (historyFilters.sort === "Lowest amount") return Math.abs(a.usd) - Math.abs(b.usd);
      if (historyFilters.sort === "Oldest") return a.id.localeCompare(b.id);
      return b.id.localeCompare(a.id);
    });

  const groups = filtered.reduce<Record<string, Transaction[]>>((acc, txn) => {
    const key = groupDate(txn.date);
    acc[key] = [...(acc[key] ?? []), txn];
    return acc;
  }, {});

  return (
    <PhoneFrame>
      <div className="flex h-full flex-col px-7 pt-10 pb-7">
        <header className="flex items-center justify-between">
          <button
            onClick={goBack}
            className="grid h-9 w-9 place-items-center rounded-full text-foreground"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
          </button>
          <h2 className="text-[17px] font-bold tracking-tight">History</h2>
          <button
            onClick={() => navigate("filter_sort")}
            className="grid h-9 w-9 place-items-center rounded-full bg-[var(--muted)]"
            aria-label="Filters"
          >
            <SlidersHorizontal className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </header>

        <div className="mt-4 flex items-center gap-2 rounded-full bg-white px-3 py-2.5 shadow-[var(--shadow-soft)]">
          <Search className="h-4 w-4 text-muted-foreground" strokeWidth={2.25} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-[12px] text-foreground outline-none placeholder:text-muted-foreground"
            placeholder="Search transactions..."
          />
        </div>

        <div className="mt-3 flex gap-2 overflow-hidden">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setHistoryFilters({ kind: f })}
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                historyFilters.kind === f
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--muted)] text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="mt-4 flex-1 space-y-4 overflow-y-auto">
          {Object.keys(groups).length === 0 ? (
            <button
              onClick={() => navigate("add_expense")}
              className="mt-16 w-full rounded-2xl bg-white px-4 py-8 text-center shadow-[var(--shadow-soft)]"
            >
              <p className="text-[13px] font-bold text-foreground">No matching transactions</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Add a transaction or reset filters.
              </p>
            </button>
          ) : (
            Object.entries(groups).map(([day, items]) => (
              <div key={day}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {day}
                </p>
                <div className="mt-2 space-y-2">
                  {items.map((txn) => {
                    const Icon = iconFor(txn);
                    const selected = selectedTransactionId === txn.id;
                    return (
                      <button
                        key={txn.id}
                        onClick={() => {
                          setSelectedTransactionId(txn.id);
                          navigate(txn.usd < 0 ? "expense_detail" : "income_detail");
                        }}
                        className={`flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-2.5 text-left shadow-[var(--shadow-soft)] ${selected ? "ring-2 ring-[var(--primary)]" : ""}`}
                      >
                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-[oklch(0.95_0.04_265)] text-[var(--primary)]">
                          <Icon className="h-4 w-4" strokeWidth={2.25} />
                        </div>
                        <div className="flex-1 leading-tight">
                          <p className="text-[12px] font-bold text-foreground">{txn.name}</p>
                          <p className="text-[10px] text-muted-foreground">{formatTransactionWho(txn.who, txn.date)}</p>
                        </div>
                        <Money
                          usd={txn.usd}
                          size="sm"
                          tone={txn.usd < 0 ? "danger" : "success"}
                          signed
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PhoneFrame>
  );
}
