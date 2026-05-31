import { ArrowLeft, Plus, Tv, Wifi, Zap, Music, Home, Tag } from "lucide-react";
import { useMemo, useState } from "react";
import { PhoneFrame } from "./PhoneFrame";
import { useAppNavigation } from "@/lib/navigation";
import { Money } from "./Money";
import { currencyValueToUsd, formatUsdAsCurrency } from "@/lib/currency";
import { OptionSelect } from "./OptionSelect";
import {
  ScheduleFrequency,
  formatISODate,
  formatScheduleSubtext,
  getScheduleInfo,
  makeScheduleMeta,
} from "@/lib/schedules";

const icons = [Home, Zap, Wifi, Tv, Music];

export function SubscriptionsScreen() {
  const { goBack, navigate, currency, addSubscription, subscriptions, categories } =
    useAppNavigation();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<ScheduleFrequency>("monthly");
  const [nextDate, setNextDate] = useState(
    formatISODate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
  );
  const categoryOptions = useMemo(
    () =>
      [
        ...categories.map((category) => ({
          value: category.label,
          label: category.label,
          description: `${formatUsdAsCurrency(category.limitUsd, currency)} limit`,
        })),
        { value: "Uncategorized", label: "Uncategorized" },
      ] as const,
    [categories, currency],
  );
  const [category, setCategory] = useState(categoryOptions[0]?.value ?? "Uncategorized");
  const amountUsd = currencyValueToUsd(Number(amount || 0), currency);
  const scheduleRows = subscriptions
    .map((item) => ({ item, info: getScheduleInfo(item.every) }))
    .sort((a, b) => (a.info.daysUntil ?? 9999) - (b.info.daysUntil ?? 9999));
  const total = subscriptions.reduce((sum, item) => sum + item.amountUsd, 0);
  const handleAdd = () => {
    if (!name.trim() || !amountUsd || !nextDate) return;
    const meta = makeScheduleMeta({ frequency, nextDate, category });
    const color = categories.find((c) => c.label === category)?.color ?? "oklch(0.65 0.22 30)";
    addSubscription({
      label: name.trim(),
      amountUsd,
      every: meta.every,
      color,
    });
    setName("");
    setAmount("");
    setFrequency("monthly");
    setNextDate(formatISODate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)));
    setCategory(categoryOptions[0]?.value ?? "Uncategorized");
    setShowForm(false);
  };

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
          <h2 className="text-[17px] font-bold tracking-tight">Recurring</h2>
          <button
            onClick={() => setShowForm(true)}
            className="grid h-9 w-9 place-items-center rounded-full bg-[var(--muted)]"
            aria-label="Add subscription"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </header>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Expenses
          </p>
          <button
            onClick={() => navigate("recurring_income")}
            className="text-[11px] font-bold text-[var(--primary)]"
          >
            Income schedules
          </button>
        </div>

        {showForm && (
          <div className="mt-4 space-y-3 rounded-3xl bg-white p-4 shadow-[var(--shadow-soft)]">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              New recurring expense
            </p>
            <div className="rounded-2xl bg-[var(--muted)] px-3 py-2">
              <p className="text-[10px] text-muted-foreground">Name</p>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Rent, Electricity, Netflix"
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
              options={categoryOptions}
              onChange={setCategory}
              icon={<Tag className="h-5 w-5" strokeWidth={2.25} />}
              emptyLabel="Create a category first"
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
              icon={<Home className="h-5 w-5" strokeWidth={2.25} />}
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

        <div
          className="mt-5 rounded-3xl p-5 text-white shadow-[var(--shadow-soft)]"
          style={{
            background: "linear-gradient(135deg, oklch(0.45 0.24 265), oklch(0.65 0.22 265))",
          }}
        >
          <p className="text-[10px] uppercase tracking-widest text-white/60">Monthly recurring</p>
          <p className="mt-1 text-[28px] font-extrabold tracking-tight">
            {formatUsdAsCurrency(total, currency)}
          </p>
          <p className="text-[11px] text-white/70">Across {subscriptions.length} subscriptions</p>
        </div>

        <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Up next
        </p>

        <div className="mt-2 flex-1 space-y-2 overflow-hidden">
          {scheduleRows.map(({ item: s, info }, index) => {
            const Icon = icons[index % icons.length];
            const soon = info.daysUntil !== null && info.daysUntil <= 5;
            return (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 shadow-[var(--shadow-soft)]"
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[oklch(0.95_0.04_265)] text-[var(--primary)]">
                  <Icon className="h-4 w-4" strokeWidth={2.25} />
                </div>
                <div className="flex-1 leading-tight">
                  <p className="text-[12px] font-bold text-foreground">{s.label}</p>
                  <p
                    className={`text-[10px] ${soon ? "text-[var(--danger)] font-semibold" : "text-muted-foreground"}`}
                  >
                    {formatScheduleSubtext(info, { includeCategory: true })}
                  </p>
                </div>
                <Money usd={s.amountUsd} size="sm" />
              </div>
            );
          })}
          {subscriptions.length === 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full rounded-2xl bg-white px-4 py-5 text-center shadow-[var(--shadow-soft)]"
            >
              <p className="text-[13px] font-bold text-foreground">No recurring bills</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Add a subscription or bill to keep forecasts live.
              </p>
            </button>
          )}
        </div>
      </div>
    </PhoneFrame>
  );
}
