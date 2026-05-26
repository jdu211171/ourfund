import { useState } from "react";
import { Bell, Briefcase, Receipt } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { BottomNav } from "./BottomNav";
import { BalanceHeader } from "./BalanceHeader";
import { Money } from "./Money";
import { useAppNavigation } from "@/lib/navigation";

export function HomeScreen() {
  const {
    navigate,
    household,
    activeTransactions,
    balanceUsd,
    incomeUsd,
    spentUsd,
    setSelectedTransactionId,
  } = useAppNavigation();

  const currentTxns = activeTransactions.slice(0, 5).map((t) => ({
    id: t.id,
    Icon: t.usd < 0 ? Receipt : Briefcase,
    name: t.name,
    who: t.who,
    usd: t.usd,
    tone: (t.usd < 0 ? "danger" : "success") as "danger" | "success",
  }));

  return (
    <PhoneFrame className="z-10">
      <div className="flex-1 overflow-y-auto flex flex-col px-7 pt-10 pb-28 min-h-0">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground">Good evening</p>
            <h2 className="font-display text-[24px] leading-none tracking-tight">
              {household?.name ?? "Your household"}
            </h2>
          </div>
          <button
            className="grid h-10 w-10 place-items-center rounded-full bg-[var(--muted)]"
            aria-label="Notifications"
            onClick={() => navigate("alerts")}
          >
            <Bell className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </header>

        <div className="mt-4">
          <BalanceHeader
            balanceUsd={balanceUsd}
            incomeUsd={incomeUsd}
            spentUsd={spentUsd}
            interactive
          />
        </div>

        <p className="mt-5 text-[13px] font-bold text-foreground">Recent Activity</p>

        <div className="mt-3 space-y-2.5 overflow-hidden">
          {currentTxns.map((t) => (
            <div
              key={t.id}
              onClick={() => {
                setSelectedTransactionId(t.id);
                navigate(t.usd < 0 ? "expense_detail" : "income_detail");
              }}
              className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 shadow-[var(--shadow-soft)] cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--muted)] text-muted-foreground">
                <t.Icon className="h-4 w-4" strokeWidth={2.25} />
              </div>
              <div className="flex-1 leading-tight">
                <p className="text-[12px] font-bold text-foreground">{t.name}</p>
                <p className="text-[10px] text-muted-foreground">{t.who}</p>
              </div>
              <Money usd={t.usd} size="sm" tone={t.tone} signed />
            </div>
          ))}
          {currentTxns.length === 0 && (
            <div className="rounded-2xl bg-white px-4 py-5 text-center shadow-[var(--shadow-soft)]">
              <p className="text-[13px] font-bold text-foreground">No activity yet</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Add income or an expense to start your live balance.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => navigate("add_income")}
                  className="rounded-full bg-[var(--primary)] py-2.5 text-[12px] font-semibold text-white"
                >
                  Add income
                </button>
                <button
                  onClick={() => navigate("add_expense")}
                  className="rounded-full bg-[var(--muted)] py-2.5 text-[12px] font-semibold text-foreground"
                >
                  Add expense
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <BottomNav active="home" />
    </PhoneFrame>
  );
}
