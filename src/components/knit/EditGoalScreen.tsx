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

export function EditGoalScreen() {
  const {
    navigate,
    goBack,
    currency,
    goals,
    selectedGoalId,
    updateGoal,
    members: familyMembers,
  } = useAppNavigation();
  const goal = goals.find((g) => g.id === selectedGoalId) ?? goals[0];
  const [amount, setAmount] = useState("0");
  const [title, setTitle] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [contributors, setContributors] = useState<string[]>([]);
  const [iconQuery, setIconQuery] = useState("");
  const [selectedIconName, setSelectedIconName] = useState(defaultGoalIconName);
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

  useEffect(() => {
    if (!goal) return;
    setTitle(goal.title);
    setTargetDate(goal.targetDate);
    setContributors(goal.contributors ?? []);
    setAmount(String(Math.round(usdToCurrencyValue(goal.targetUsd, currency))));
    setSelectedIconName(normalizeGoalIconName(goal.icon));
  }, [currency, goal?.id]);

  if (!goal) {
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
            <h2 className="text-[17px] font-bold tracking-tight">Edit Goal</h2>
            <span className="h-9 w-9" />
          </header>
          <div className="m-auto rounded-3xl bg-white px-5 py-6 text-center shadow-[var(--shadow-soft)]">
            <p className="text-[14px] font-bold text-foreground">No goal selected</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Create a savings goal to edit its details.
            </p>
            <button
              onClick={() => navigate("new_goal")}
              className="mt-4 rounded-full bg-[var(--primary)] px-5 py-2.5 text-[12px] font-semibold text-white"
            >
              Create goal
            </button>
          </div>
        </div>
      </PhoneFrame>
    );
  }

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
          <h2 className="text-[17px] font-bold tracking-tight">Edit Goal</h2>
          <span className="h-9 w-9" />
        </header>

        <div className="mt-6 flex flex-col items-center">
          <div
            className="grid h-14 w-14 place-items-center rounded-2xl text-white shadow-[var(--shadow-tile)]"
            style={{
              background: "linear-gradient(135deg, oklch(0.65 0.22 265), oklch(0.45 0.24 265))",
            }}
          >
            <GoalIcon name={normalizedIconName} className="h-6 w-6" strokeWidth={2.25} />
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-3 text-center text-[11px] uppercase tracking-widest text-muted-foreground outline-none border-b border-transparent focus:border-[var(--primary)] transition-colors focus:ring-0 w-40"
            placeholder="Goal Title"
          />
          <div className="mt-1 flex items-center justify-center gap-1">
            {prefix && <span className="text-[20px] font-bold text-muted-foreground">{prefix}</span>}
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              className="w-48 bg-transparent text-center text-[34px] font-extrabold tracking-tight text-foreground outline-none border-b border-transparent focus:border-[var(--primary)] transition-colors focus:ring-0"
              placeholder="0.00"
            />
            {suffix && <span className="text-[14px] font-bold text-muted-foreground">{suffix}</span>}
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
              {formatUsdAsCurrency(goal.savedUsd, currency)} of {formatUsdAsCurrency(targetUsd, currency)}
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--muted)]">
            <div
              className="h-full rounded-full bg-[var(--primary)]"
              style={{
                width: `${Math.min(
                  100,
                  Math.round((goal.savedUsd / Math.max(targetUsd, 1)) * 100),
                )}%`,
              }}
            />
          </div>
        </div>

        <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Icon
        </p>
        <div className="mt-2 rounded-2xl bg-white px-3 py-2 shadow-[var(--shadow-soft)]">
          <input
            value={iconQuery}
            onChange={(e) => setIconQuery(e.target.value)}
            className="w-full bg-transparent text-[12px] font-semibold text-foreground outline-none"
            placeholder="Search icons"
          />
        </div>
        <div className="mt-2 max-h-40 overflow-y-auto pr-1">
          <div className="grid grid-cols-5 gap-2">
            {filteredIcons.map(({ key }) => (
              <button
                key={key}
                onClick={() => setSelectedIconName(key)}
                className={`grid h-12 place-items-center rounded-2xl transition-all cursor-pointer ${
                  normalizeGoalIconName(selectedIconName) === key
                    ? "bg-[var(--primary)] text-white shadow-md scale-105"
                    : "bg-white text-foreground shadow-[var(--shadow-soft)] hover:bg-slate-50 active:scale-95"
                }`}
              >
                <GoalIcon name={key} className="h-4 w-4" strokeWidth={2.25} />
              </button>
            ))}
          </div>
          {filteredIcons.length === 0 && (
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              No icons found.
            </p>
          )}
        </div>

        <p className="mt-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Contributing
        </p>

        <div className="mt-2 flex-1 space-y-2 overflow-hidden">
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
          onClick={() => {
            updateGoal(goal.id, {
              title: title.trim() || "New goal",
              targetUsd,
              targetDate: targetDate.trim() || "No deadline",
              icon: normalizedIconName,
              contributors,
            });
            navigate("goal_detail");
          }}
          className="mt-3 w-full rounded-full bg-[oklch(0.18_0.04_265)] py-4 text-[15px] font-semibold text-white active:scale-95 transition-all cursor-pointer"
        >
          Save changes
        </button>
      </div>
    </PhoneFrame>
  );
}
