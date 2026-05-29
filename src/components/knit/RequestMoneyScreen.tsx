import { ArrowLeft, Check } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { useEffect, useMemo, useState } from "react";
import { useAppNavigation } from "@/lib/navigation";
import {
  currencyAdornment,
  currencyValueToUsd,
  formatCurrencyValue,
  formatUsdAsCurrency,
  usdToCurrencyValue,
} from "@/lib/currency";
import {
  defaultGoalIconName,
  GoalIcon,
  goalIconOptions,
  normalizeGoalIconName,
} from "./goalIconOptions";

const presetUsd = [1000, 2500, 5000, 10000];

export function RequestMoneyScreen() {
  const { navigate, goBack, currency, addGoal, members: familyMembers } = useAppNavigation();
  const [amount, setAmount] = useState("0");
  const [title, setTitle] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [contributors, setContributors] = useState(() => familyMembers.map((member) => member.id));
  const [iconQuery, setIconQuery] = useState("");
  const [selectedIconName, setSelectedIconName] = useState(defaultGoalIconName);
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [visibleIcons, setVisibleIcons] = useState(120);
  const targetUsd = currencyValueToUsd(parseFloat(amount || "0"), currency);
  const { prefix, suffix } = currencyAdornment(currency);
  const normalizedIconName = normalizeGoalIconName(selectedIconName);
  const filteredIcons = useMemo(() => {
    const query = iconQuery.trim().toLowerCase();
    if (!query) return goalIconOptions;
    return goalIconOptions.filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        option.key.toLowerCase().includes(query),
    );
  }, [iconQuery]);
  const visibleIconOptions = filteredIcons.slice(0, visibleIcons);

  useEffect(() => {
    setVisibleIcons(120);
  }, [iconQuery]);

  const createGoal = () => {
    const goal = addGoal({
      title: title.trim() || "New goal",
      targetUsd,
      savedUsd: 0,
      targetDate: targetDate.trim() || "No deadline",
      icon: normalizedIconName,
      color: "oklch(0.55 0.24 265)",
      contributors,
    });
    navigate(goal.targetUsd <= goal.savedUsd ? "goal_achieved" : "goal_detail");
  };

  return (
    <PhoneFrame>
      <div className="flex-1 overflow-y-auto flex flex-col px-7 pt-10 pb-7 min-h-0">
        <header className="flex items-center justify-between">
          <button
            onClick={goBack}
            className="grid h-9 w-9 place-items-center rounded-full text-foreground hover:bg-slate-50 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
          </button>
          <h2 className="text-[17px] font-bold tracking-tight">New Goal</h2>
          <span className="h-9 w-9" />
        </header>

        <div className="mt-6 flex flex-col items-center">
          <button
            type="button"
            onClick={() => setIsIconPickerOpen(true)}
            className="grid h-14 w-14 place-items-center rounded-2xl text-white shadow-[var(--shadow-tile)] transition-transform hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, oklch(0.65 0.22 265), oklch(0.45 0.24 265))",
            }}
            aria-label="Change goal icon"
          >
            <GoalIcon name={normalizedIconName} className="h-6 w-6" strokeWidth={2.25} />
          </button>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Tap icon to change
          </p>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-3 text-center text-[11px] uppercase tracking-widest text-muted-foreground outline-none border-b border-transparent focus:border-[var(--primary)] transition-colors focus:ring-0 w-40"
            placeholder="Goal Title"
          />
          <div className="mt-1 flex items-center justify-center gap-1">
            {prefix && (
              <span className="text-[20px] font-bold text-muted-foreground">{prefix}</span>
            )}
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              className="w-48 bg-transparent text-center text-[34px] font-extrabold tracking-tight text-foreground outline-none border-b border-transparent focus:border-[var(--primary)] transition-colors focus:ring-0"
              placeholder="0.00"
            />
            {suffix && (
              <span className="text-[14px] font-bold text-muted-foreground">{suffix}</span>
            )}
          </div>

          <input
            type="text"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="mt-1 w-36 bg-transparent text-center text-[11px] text-muted-foreground outline-none border-b border-transparent focus:border-[var(--primary)]"
            placeholder="Target date"
          />
        </div>

        <div className="mt-4 flex gap-2">
          {presetUsd.map((usd) => {
            const val = String(Math.round(usdToCurrencyValue(usd, currency)));
            return (
              <button
                key={usd}
                onClick={() => setAmount(val)}
                className={`flex-1 rounded-full py-2 text-[12px] font-semibold active:scale-95 transition-all cursor-pointer ${
                  amount === val
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--muted)] text-foreground hover:bg-slate-200"
                }`}
              >
                {formatCurrencyValue(Number(val), currency, { maximumFractionDigits: 0 })}
              </button>
            );
          })}
        </div>

        <div className="mt-5 rounded-2xl bg-white p-3 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-foreground">Progress</span>
            <span className="text-muted-foreground">
              {formatUsdAsCurrency(0, currency)} of {formatUsdAsCurrency(targetUsd, currency)}
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--muted)]">
            <div className="h-full w-0 rounded-full bg-[var(--primary)]" />
          </div>
        </div>

        <p className="mt-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Contributing
        </p>

        <div className="mt-2 space-y-2">
          {familyMembers.map((p) => {
            const selected = contributors.includes(p.id);
            return (
              <button
                key={p.name}
                onClick={() =>
                  setContributors((prev) =>
                    prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id],
                  )
                }
                className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-2.5 text-left shadow-[var(--shadow-soft)]"
              >
                <div
                  className="grid h-10 w-10 place-items-center rounded-full text-white text-[12px] font-bold"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.65 0.22 265), oklch(0.45 0.24 265))",
                  }}
                >
                  {p.initials}
                </div>
                <div className="flex-1 leading-tight">
                  <p className="text-[12px] font-bold text-foreground">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {p.role}
                    {p.allowanceUsd ? ` · ${formatUsdAsCurrency(p.allowanceUsd, currency)}/wk` : ""}
                  </p>
                </div>
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full ${
                    selected ? "bg-[var(--primary)] text-white" : "bg-[var(--muted)]"
                  }`}
                >
                  {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={createGoal}
          className="mt-3 w-full rounded-full bg-[oklch(0.18_0.04_265)] py-4 text-[15px] font-semibold text-white active:scale-95 transition-all cursor-pointer"
        >
          Create goal
        </button>
      </div>
      {isIconPickerOpen && (
        <div className="absolute inset-0 z-20 flex flex-col bg-[var(--canvas)]">
          <div className="flex items-center justify-between px-6 pt-8">
            <h3 className="text-[16px] font-bold text-foreground">Choose icon</h3>
            <button
              type="button"
              onClick={() => setIsIconPickerOpen(false)}
              className="text-[12px] font-semibold text-[var(--primary)]"
            >
              Done
            </button>
          </div>
          <div className="px-6 pt-3">
            <div className="rounded-2xl bg-white px-3 py-2 shadow-[var(--shadow-soft)]">
              <input
                value={iconQuery}
                onChange={(e) => setIconQuery(e.target.value)}
                className="w-full bg-transparent text-[12px] font-semibold text-foreground outline-none"
                placeholder="Search icons"
              />
            </div>
          </div>
          <div className="mt-4 flex-1 overflow-y-auto px-6 pb-8">
            <div className="grid grid-cols-4 gap-3">
              {visibleIconOptions.map(({ key }) => (
                <button
                  key={key}
                  onClick={() => setSelectedIconName(key)}
                  className={`grid h-14 place-items-center rounded-2xl transition-all cursor-pointer ${
                    normalizeGoalIconName(selectedIconName) === key
                      ? "bg-[var(--primary)] text-white shadow-md scale-105"
                      : "bg-white text-foreground shadow-[var(--shadow-soft)] hover:bg-slate-50 active:scale-95"
                  }`}
                >
                  <GoalIcon name={key} className="h-5 w-5" strokeWidth={2.25} />
                </button>
              ))}
            </div>
            {filteredIcons.length === 0 && (
              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                No icons found.
              </p>
            )}
            {filteredIcons.length > visibleIcons && (
              <button
                type="button"
                onClick={() => setVisibleIcons((prev) => prev + 120)}
                className="mx-auto mt-4 block rounded-full bg-white px-4 py-2 text-[12px] font-semibold text-foreground shadow-[var(--shadow-soft)]"
              >
                Load more
              </button>
            )}
          </div>
        </div>
      )}
    </PhoneFrame>
  );
}
