import { ArrowLeft, Briefcase, Gift, Pencil, Plus, Tag, Trash2, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { PhoneFrame } from "./PhoneFrame";
import { useAppNavigation } from "@/lib/navigation";
import { currencyValueToUsd, formatUsdAsCurrency, usdToCurrencyValue } from "@/lib/currency";
import { OptionSelect } from "./OptionSelect";
import {
  ScheduleFrequency,
  formatISODate,
  formatScheduleSubtext,
  getScheduleInfo,
  makeScheduleMeta,
} from "@/lib/schedules";

const frequencyOptions: { value: ScheduleFrequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const defaultNextScheduleDate = () => formatISODate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

export function RecurringIncomeScreen() {
  const {
    goBack,
    navigate,
    currency,
    addRecurringIncome,
    recurringIncome,
    updateScheduleItem,
    deleteScheduleItem,
  } = useAppNavigation();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<ScheduleFrequency>("monthly");
  const [nextDate, setNextDate] = useState(defaultNextScheduleDate);
  const incomeCategories = useMemo(
    () => [
      { value: "Salary", label: "Salary" },
      { value: "Freelance", label: "Freelance" },
      { value: "Allowance", label: "Allowance" },
      { value: "Gift", label: "Gift" },
      { value: "Bonus", label: "Bonus" },
      { value: "Other", label: "Other" },
    ],
    [],
  );
  const [category, setCategory] = useState(incomeCategories[0]?.value ?? "Salary");
  const amountUsd = currencyValueToUsd(Number(amount || 0), currency);
  const scheduleRows = recurringIncome
    .map((item) => ({ item, info: getScheduleInfo(item.every) }))
    .sort((a, b) => (a.info.daysUntil ?? 9999) - (b.info.daysUntil ?? 9999));
  const total = recurringIncome.reduce((sum, item) => sum + item.amountUsd, 0);

  const resetForm = () => {
    setName("");
    setAmount("");
    setFrequency("monthly");
    setNextDate(defaultNextScheduleDate());
    setCategory(incomeCategories[0]?.value ?? "Salary");
    setEditingId(null);
  };

  const beginCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const formatAmountInput = (amountUsdValue: number) => {
    const localAmount = usdToCurrencyValue(amountUsdValue, currency);
    return Number.isInteger(localAmount)
      ? String(localAmount)
      : localAmount.toFixed(2).replace(/\.?0+$/, "");
  };

  const beginEdit = (item: (typeof recurringIncome)[number]) => {
    const info = getScheduleInfo(item.every);
    setEditingId(item.id);
    setName(item.label);
    setAmount(formatAmountInput(item.amountUsd));
    setFrequency(info.meta?.frequency ?? "monthly");
    setNextDate(info.nextDate ? formatISODate(info.nextDate) : defaultNextScheduleDate());
    setCategory(info.meta?.category ?? incomeCategories[0]?.value ?? "Salary");
    setShowForm(true);
  };

  const removeSchedule = (id: string) => {
    if (editingId === id) {
      resetForm();
      setShowForm(false);
    }
    deleteScheduleItem(id);
  };

  const handleSave = () => {
    if (!name.trim() || !amountUsd || !nextDate) return;
    const meta = makeScheduleMeta({ frequency, nextDate, category });
    const payload = {
      label: name.trim(),
      amountUsd,
      every: meta.every,
      color: "oklch(0.7 0.18 150)",
      type: "income" as const,
    };

    if (editingId) {
      updateScheduleItem(editingId, payload);
    } else {
      addRecurringIncome(payload);
    }

    resetForm();
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
            onClick={beginCreate}
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
              {editingId ? "Edit recurring income" : "New recurring income"}
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
              options={frequencyOptions}
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
                onClick={handleSave}
                className="flex-1 rounded-full bg-[oklch(0.18_0.04_265)] py-3 text-[13px] font-semibold text-white"
              >
                {editingId ? "Update schedule" : "Save schedule"}
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
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

        <div className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {scheduleRows.map(({ item: it, info }, index) => {
            const Icon = index === 2 ? Gift : index === 3 ? Wallet : Briefcase;
            return (
              <div
                key={it.id}
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
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => beginEdit(it)}
                    className="grid h-8 w-8 place-items-center rounded-full bg-[var(--muted)] text-foreground"
                    aria-label={`Edit ${it.label}`}
                  >
                    <Pencil className="h-3.5 w-3.5" strokeWidth={2.4} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSchedule(it.id)}
                    className="grid h-8 w-8 place-items-center rounded-full bg-[oklch(0.96_0.05_25)] text-[var(--danger)]"
                    aria-label={`Delete ${it.label}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2.4} />
                  </button>
                </div>
              </div>
            );
          })}
          {recurringIncome.length === 0 && (
            <button
              onClick={beginCreate}
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
          onClick={beginCreate}
          className="mt-auto w-full rounded-full bg-[oklch(0.18_0.04_265)] py-4 text-[15px] font-semibold text-white"
        >
          Add new schedule
        </button>
      </div>
    </PhoneFrame>
  );
}
