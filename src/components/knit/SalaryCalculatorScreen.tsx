import { useMemo, useState } from "react";
import { ArrowLeft, ChevronDown, Check, Globe2 } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { useAppNavigation } from "@/lib/navigation";
import {
  ENGINES,
  calculate,
  defaultInsurance,
  getEngine,
  type DeductionCategory,
  type InsuranceKey,
  type Period,
} from "@/lib/salary/tax-engines";

export function SalaryCalculatorScreen() {
  const { goBack } = useAppNavigation();
  const [country, setCountry] = useState("JP");
  const [period, setPeriod] = useState<Period>("monthly");
  const engine = getEngine(country);
  const [amount, setAmount] = useState<number>(Math.round(engine.defaultGrossAnnual / 12));
  const [insurance, setInsurance] = useState(defaultInsurance(engine));
  const [pickerOpen, setPickerOpen] = useState(false);

  const result = useMemo(
    () => calculate(country, amount, period, insurance),
    [country, amount, period, insurance],
  );

  const fmt = (n: number) =>
    new Intl.NumberFormat(engine.locale, {
      style: "currency",
      currency: engine.currency,
      maximumFractionDigits: 0,
    }).format(Math.round(n));

  const handleCountry = (code: string) => {
    const e = getEngine(code);
    setCountry(code);
    setInsurance(defaultInsurance(e));
    setAmount(period === "monthly" ? Math.round(e.defaultGrossAnnual / 12) : e.defaultGrossAnnual);
    setPickerOpen(false);
  };

  const toggleIns = (k: InsuranceKey) => setInsurance((s) => ({ ...s, [k]: !s[k] }));

  const gross = period === "monthly" ? amount : amount;
  const net = period === "monthly" ? result.netMonthly : result.netAnnual;
  const totalDed = period === "monthly" ? result.totalDeductions / 12 : result.totalDeductions;
  const factor = period === "monthly" ? 12 : 1;
  const social = result.deductions.socialInsurance / factor;
  const tax = result.deductions.incomeTax / factor;
  const resident = result.deductions.residentTax / factor;
  const other = (result.deductions.other ?? 0) / factor;
  const itemizedDeductions = result.deductions.items.map((item) => ({
    ...item,
    amount: item.amount / factor,
  }));

  const pct = (v: number) => (gross > 0 ? (v / gross) * 100 : 0);
  const toneFor = (category: DeductionCategory) => {
    if (category === "social") return "warn";
    if (category === "tax") return "danger";
    if (category === "local") return "success";
    return "muted";
  };

  return (
    <PhoneFrame>
      <div className="flex h-full flex-col overflow-y-auto px-7 pt-10 pb-7">
        <header className="flex items-center justify-between">
          <button
            onClick={goBack}
            className="grid h-9 w-9 place-items-center rounded-full text-foreground"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
          </button>
          <h2 className="text-[17px] font-bold tracking-tight">Salary</h2>
          <span className="h-9 w-9" />
        </header>

        {/* Country */}
        <div className="relative mt-5">
          <button
            onClick={() => setPickerOpen((v) => !v)}
            className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-3 text-left shadow-[var(--shadow-soft)]"
          >
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[oklch(0.95_0.05_265)] text-[var(--primary)]">
              <Globe2 className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <div className="flex-1 leading-tight">
              <p className="text-[11px] text-muted-foreground">Country</p>
              <p className="text-[14px] font-bold text-foreground">{engine.label}</p>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition ${pickerOpen ? "rotate-180" : ""}`}
              strokeWidth={2.5}
            />
          </button>
          {pickerOpen && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-phone)]">
              {Object.values(ENGINES).map((e) => (
                <button
                  key={e.code}
                  onClick={() => handleCountry(e.code)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-[13px] font-semibold text-foreground hover:bg-[var(--muted)]"
                >
                  {e.label}
                  {country === e.code && <Check className="h-4 w-4 text-[var(--primary)]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Gross input */}
        <div className="mt-4 rounded-2xl bg-white p-4 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Gross salary
            </p>
            <div className="flex rounded-full bg-[var(--muted)] p-0.5">
              {(["monthly", "annual"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
                    period === p ? "bg-[var(--primary)] text-white" : "text-muted-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-[22px] font-bold text-muted-foreground">
              {engine.currencySymbol}
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={Number.isFinite(amount) ? amount : 0}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
              className="w-full bg-transparent text-[28px] font-bold text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>

        {/* Net take-home */}
        <div
          className="mt-4 rounded-2xl p-4 text-white shadow-[var(--shadow-tile)]"
          style={{
            background: "linear-gradient(135deg, oklch(0.55 0.24 265), oklch(0.4 0.22 270))",
          }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">
            Net take-home · {period === "monthly" ? "per month" : "per year"}
          </p>
          <p className="mt-1 font-display text-[30px] leading-tight tracking-tight">{fmt(net)}</p>
          <div className="mt-2 flex items-center justify-between text-[11px] opacity-90">
            <span>Deductions {fmt(totalDed)}</span>
            <span className="font-bold">{(result.effectiveRate * 100).toFixed(1)}%</span>
          </div>
          {/* Stacked bar */}
          <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-white/20">
            <div className="bg-[oklch(0.85_0.18_85)]" style={{ width: `${pct(social)}%` }} />
            <div className="bg-[oklch(0.7_0.2_25)]" style={{ width: `${pct(tax)}%` }} />
            {resident > 0 && (
              <div className="bg-[oklch(0.75_0.18_145)]" style={{ width: `${pct(resident)}%` }} />
            )}
            {other > 0 && (
              <div className="bg-[oklch(0.7_0.08_285)]" style={{ width: `${pct(other)}%` }} />
            )}
          </div>
        </div>

        {/* Deduction selectors */}
        <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Included deductions
        </p>
        <div className="mt-2 space-y-2">
          {engine.insuranceOptions.map((opt) => {
            const on = insurance[opt.key] ?? false;
            return (
              <button
                key={opt.key}
                onClick={() => toggleIns(opt.key)}
                className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-2.5 text-left shadow-[var(--shadow-soft)]"
              >
                <div
                  className={`grid h-6 w-6 place-items-center rounded-md transition ${
                    on ? "bg-[var(--primary)] text-white" : "bg-[var(--muted)] text-transparent"
                  }`}
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </div>
                <div className="flex-1 leading-tight">
                  <p className="text-[13px] font-bold text-foreground">{opt.label}</p>
                  <p className="text-[10px] text-muted-foreground">{opt.hint}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Breakdown */}
        <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Breakdown
        </p>
        <div className="mt-2 space-y-1.5 rounded-2xl bg-white p-3 shadow-[var(--shadow-soft)]">
          <Row label="Gross" value={fmt(gross)} bold />
          {itemizedDeductions.map((item) => (
            <Row
              key={item.key}
              label={item.label}
              value={`− ${fmt(item.amount)}`}
              tone={toneFor(item.category)}
            />
          ))}
          <div className="my-1 h-px bg-[var(--muted)]" />
          <Row label="Net" value={fmt(net)} bold tone="primary" />
        </div>

        <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
          Estimate only. Actual deductions vary by age, dependents, region, filing status and
          employer plan.
        </p>
      </div>
    </PhoneFrame>
  );
}

function Row({
  label,
  value,
  bold,
  tone,
}: {
  label: string;
  value: string;
  bold?: boolean;
  tone?: "warn" | "danger" | "success" | "primary" | "muted";
}) {
  const color =
    tone === "warn"
      ? "text-[oklch(0.65_0.18_85)]"
      : tone === "danger"
        ? "text-[var(--danger)]"
        : tone === "success"
          ? "text-[var(--success)]"
          : tone === "primary"
            ? "text-[var(--primary)]"
            : tone === "muted"
              ? "text-muted-foreground"
              : "text-foreground";
  return (
    <div className="flex items-center justify-between px-1 py-1">
      <span
        className={`text-[12px] ${bold ? "font-bold text-foreground" : "text-muted-foreground"}`}
      >
        {label}
      </span>
      <span className={`text-[13px] tabular-nums ${bold ? "font-bold" : "font-semibold"} ${color}`}>
        {value}
      </span>
    </div>
  );
}
