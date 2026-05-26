import { ArrowLeft, Briefcase, Gift, Wallet, Plus } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { useAppNavigation } from "@/lib/navigation";

export function RecurringIncomeScreen() {
  const { goBack, addRecurringIncome, recurringIncome } = useAppNavigation();
  const total = recurringIncome.reduce((sum, item) => sum + item.amountUsd, 0);

  return (
    <PhoneFrame>
      <div className="flex h-full flex-col px-7 pt-10 pb-7">
        <header className="flex items-center justify-between">
          <button
            onClick={goBack}
            className="grid h-9 w-9 place-items-center rounded-full"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
          </button>
          <h2 className="text-[17px] font-bold tracking-tight">Recurring income</h2>
          <button
            onClick={() => addRecurringIncome()}
            className="grid h-9 w-9 place-items-center rounded-full bg-[var(--muted)]"
            aria-label="Add"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </header>

        <div className="mt-5 rounded-3xl bg-[var(--primary)] p-4 text-white shadow-[var(--shadow-tile)]">
          <p className="text-[11px] uppercase tracking-widest opacity-80">Expected this month</p>
          <p className="mt-1 font-display text-[28px] tracking-tight">${total.toLocaleString()}</p>
          <p className="text-[11px] opacity-80">From {recurringIncome.length} scheduled deposits</p>
        </div>

        <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Schedules
        </p>

        <div className="mt-2 flex-1 space-y-2 overflow-hidden">
          {recurringIncome.map((it, index) => {
            const Icon = index === 2 ? Gift : index === 3 ? Wallet : Briefcase;
            return (
              <div
                key={it.label}
                className="flex items-center gap-3 rounded-2xl bg-white px-3 py-3 shadow-[var(--shadow-soft)]"
              >
                <div
                  className="grid h-10 w-10 place-items-center rounded-xl text-white"
                  style={{ background: it.color }}
                >
                  <Icon className="h-4 w-4" strokeWidth={2.25} />
                </div>
                <div className="flex-1 leading-tight">
                  <p className="text-[12px] font-bold text-foreground">{it.label}</p>
                  <p className="text-[10px] text-muted-foreground">{it.every}</p>
                </div>
                <p className="text-[12px] font-extrabold text-[var(--success)]">
                  +${it.amountUsd.toLocaleString()}
                </p>
              </div>
            );
          })}
          {recurringIncome.length === 0 && (
            <button
              onClick={() => addRecurringIncome()}
              className="w-full rounded-2xl bg-white px-4 py-5 text-center shadow-[var(--shadow-soft)]"
            >
              <p className="text-[13px] font-bold text-foreground">No income schedules</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Add a recurring deposit to forecast monthly income.
              </p>
            </button>
          )}
        </div>

        <button
          onClick={() => addRecurringIncome()}
          className="mt-auto w-full rounded-full bg-[oklch(0.18_0.04_265)] py-4 text-[15px] font-semibold text-white"
        >
          Add new schedule
        </button>
      </div>
    </PhoneFrame>
  );
}
