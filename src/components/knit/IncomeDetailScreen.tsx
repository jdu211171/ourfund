import { ArrowLeft, ArrowDownLeft, Repeat, Edit3 } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { Money } from "./Money";
import { useAppNavigation } from "@/lib/navigation";
import { getRelativeDateString } from "@/context/helpers";

export function IncomeDetailScreen() {
  const { goBack, navigate, selectedTransactionId, transactions } = useAppNavigation();

  // Find dynamic transaction
  const txn =
    transactions.find((t) => t.id === selectedTransactionId) || transactions.find((t) => t.usd > 0);

  if (!txn) {
    return (
      <PhoneFrame>
        <div className="flex h-full flex-col px-7 pt-10 pb-7">
          <header className="flex items-center justify-between">
            <button
              onClick={goBack}
              className="grid h-9 w-9 place-items-center rounded-full text-foreground hover:bg-slate-50 transition-colors cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
            </button>
            <h2 className="text-[17px] font-bold tracking-tight">Income</h2>
            <span className="h-9 w-9" />
          </header>
          <button
            onClick={() => navigate("add_income")}
            className="m-auto rounded-3xl bg-white px-5 py-6 text-center shadow-[var(--shadow-soft)]"
          >
            <p className="text-[14px] font-bold text-foreground">No income selected</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Add income to see its details.</p>
          </button>
        </div>
      </PhoneFrame>
    );
  }

  const rows = [
    ["Status", "Deposited"],
    ["Wallet", txn.wallet],
    ["Received by", txn.who.split(" · ")[0] || "You"],
    ["Source", txn.name],
    ["Recurrence", txn.who.toLowerCase().includes("recurring") ? "Recurring" : "One-time"],
    [
      "Date",
      (() => {
        const rel = getRelativeDateString(txn.date, new Date());
        return rel === "today" || rel === "yesterday"
          ? `${rel} 09:00`
          : `${rel}, 09:00`;
      })(),
    ],
  ];

  return (
    <PhoneFrame>
      <div className="flex h-full flex-col px-7 pt-10 pb-7">
        <header className="flex items-center justify-between">
          <button
            onClick={goBack}
            className="grid h-9 w-9 place-items-center rounded-full text-foreground hover:bg-slate-50 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
          </button>
          <h2 className="text-[17px] font-bold tracking-tight">Income</h2>
          <button
            onClick={() => navigate("edit_expense")}
            className="grid h-9 w-9 place-items-center rounded-full text-foreground hover:bg-slate-50 transition-colors cursor-pointer"
            aria-label="Edit"
          >
            <Edit3 className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </header>

        <div className="mt-6 flex flex-col items-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[oklch(0.95_0.08_150)] text-[var(--success)] shadow-[var(--shadow-tile)]">
            <ArrowDownLeft className="h-6 w-6" strokeWidth={2.25} />
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">
            {txn.category} · {txn.name}
          </p>
          <div className="mt-2 inline-block">
            <Money usd={txn.usd} size="xl" tone="success" signed />
          </div>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[oklch(0.95_0.04_265)] px-3 py-0.5 text-[10px] font-semibold text-[var(--primary)]">
            <Repeat className="h-3 w-3" strokeWidth={3} /> Recurring monthly
          </span>
        </div>

        <div className="mt-6 rounded-3xl bg-white p-4 shadow-[var(--shadow-soft)]">
          {rows.map(([k, v], i) => (
            <div
              key={k}
              className={`flex items-center justify-between py-2.5 ${i < rows.length - 1 ? "border-b border-[oklch(0.94_0.01_265)]" : ""}`}
            >
              <span className="text-[11px] text-muted-foreground">{k}</span>
              <span className="text-[12px] font-semibold text-foreground">{v}</span>
            </div>
          ))}
        </div>

        <p className="mt-3 px-1 text-[11px] text-muted-foreground">
          Note: Manage this income schedule from recurring income.
        </p>

        <button
          onClick={() => navigate("recurring_income")}
          className="mt-auto w-full rounded-full bg-[oklch(0.18_0.04_265)] py-4 text-[15px] font-semibold text-white active:scale-95 transition-transform cursor-pointer"
        >
          Manage recurring
        </button>
      </div>
    </PhoneFrame>
  );
}
