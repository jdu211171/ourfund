import { ArrowLeft, Briefcase, Gift, Wallet, Plus, Tag } from "lucide-react";
import { useMemo, useState } from "react";
import { PhoneFrame } from "./PhoneFrame";
import { useAppNavigation } from "@/lib/navigation";
import { currencyValueToUsd, formatUsdAsCurrency } from "@/lib/currency";
import { OptionSelect } from "./OptionSelect";
import {
  ScheduleFrequency,
  formatISODate,
  formatScheduleSubtext,
  getScheduleInfo,
  makeScheduleMeta,
} from "@/lib/schedules";

export function RecurringIncomeScreen() {
  const { goBack, navigate, currency, addRecurringIncome, recurringIncome } = useAppNavigation();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<ScheduleFrequency>("monthly");
  const [nextDate, setNextDate] = useState(
    formatISODate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
  );
  const incomeCategories = useMemo(
    () =>
      [
        { value: "Salary", label: "Salary" },
        { value: "Freelance", label: "Freelance" },
        { value: "Allowance", label: "Allowance" },
        { value: "Gift", label: "Gift" },
        { value: "Bonus", label: "Bonus" },
        { value: "Other", label: "Other" },
      ] as const,
    [],
  );
  const [category, setCategory] = useState(incomeCategories[0]?.value ?? "Salary");
  const amountUsd = currencyValueToUsd(Number(amount || 0), currency);
  const scheduleRows = recurringIncome
    .map((item) => ({ item, info: getScheduleInfo(item.every) }))
    .sort((a, b) => (a.info.daysUntil ?? 9999) - (b.info.daysUntil ?? 9999));
  const total = recurringIncome.reduce((sum, item) => sum + item.amountUsd, 0);
  const handleAdd = () => {
    if (!name.trim() || !amountUsd || !nextDate) return;
    const meta = makeScheduleMeta({ frequency, nextDate, category });
    addRecurringIncome({
      label: name.trim(),
      amountUsd,
      every: meta.every,
      color: "oklch(0.7 0.18 150)",
    });
    setName("");
    setAmount("");
    setFrequency("monthly");
    setNextDate(formatISODate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)));
    setCategory(incomeCategories[0]?.value ?? "Salary");
    setShowForm(false);
  };

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
            onClick={() => setShowForm(true)}
            className="grid h-9 w-9 place-items-center rounded-full bg-[var(--muted)]"
            aria-label="Add"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </header>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Income
          </p>
          <button
            onClick={() => navigate("subscriptions")}
            className="text-[11px] font-bold text-[var(--primary)]"
          >
            Expense schedules
          </button>
        </div>

        {showForm && (
          <div className="mt-4 space-y-3 rounded-3xl bg-white p-4 shadow-[var(--shadow-soft)]">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              New recurring income
            </p>
            <div className="rounded-2xl bg-[var(--muted)] px-3 py-2">
              <p className="text-[10px] text-muted-foreground">Name</p>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Salary, Freelance, Allowance"
                className="w-full bg-transparent text-[13px] font-semibold text-foreground outline-none"
              />
            </div>
            <div className="rounded-2xl bg-[var(--muted)] px-3 py-2">
              <p className="text-[10px] text-muted-foreground">Amount</p>
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full bg-transparent text-[13px] font-semibold text-foreground outline-none"
              />
            </div>
            <OptionSelect
              label="Category"
              value={category}
              options={incomeCategories}
              onChange={setCategory}
              icon={<Tag className="h-5 w-5" strokeWidth={2.25} />}
            />
            <OptionSelect
              label="Frequency"
              value={frequency}
              options={[
                { value: "weekly", label: "Weekly" },
                { value: "monthly", label: "Monthly" },
                { value: "yearly", label: "Yearly" },
              ]}
              onChange={setFrequency}
              icon={<Briefcase className="h-5 w-5" strokeWidth={2.25} />}
            />
            <div className="rounded-2xl bg-[var(--muted)] px-3 py-2">
              <p className="text-[10px] text-muted-foreground">Next date</p>
              <input
                value={nextDate}
                onChange={(event) => setNextDate(event.target.value)}
                type="date"
                className="w-full bg-transparent text-[13px] font-semibold text-foreground outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                className="flex-1 rounded-full bg-[oklch(0.18_0.04_265)] py-3 text-[13px] font-semibold text-white"
              >
                Save schedule
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-full bg-[var(--muted)] py-3 text-[13px] font-semibold text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="mt-5 rounded-3xl bg-[var(--primary)] p-4 text-white shadow-[var(--shadow-tile)]">
          <p className="text-[11px] uppercase tracking-widest opacity-80">Expected this month</p>
          <p className="mt-1 font-display text-[28px] tracking-tight">
            {formatUsdAsCurrency(total, currency)}
          </p>
          <p className="text-[11px] opacity-80">From {recurringIncome.length} scheduled deposits</p>
        </div>

        <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Schedules
        </p>

        <div className="mt-2 flex-1 space-y-2 overflow-hidden">
          {scheduleRows.map(({ item: it, info }, index) => {
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
                  <p className="text-[10px] text-muted-foreground">
                    {formatScheduleSubtext(info, { includeCategory: true })}
                  </p>
                </div>
                <p className="text-[12px] font-extrabold text-[var(--success)]">
                  {formatUsdAsCurrency(it.amountUsd, currency, { signed: true })}
                </p>
              </div>
            );
          })}
          {recurringIncome.length === 0 && (
            <button
              onClick={() => setShowForm(true)}
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
          onClick={() => setShowForm(true)}
          className="mt-auto w-full rounded-full bg-[oklch(0.18_0.04_265)] py-4 text-[15px] font-semibold text-white"
        >
          Add new schedule
        </button>
      </div>
    </PhoneFrame>
  );
}
