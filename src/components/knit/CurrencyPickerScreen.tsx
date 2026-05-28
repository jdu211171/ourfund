import { ArrowLeft, Search, Check } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { useAppNavigation, type BudgetMode, type CurrencyCode } from "@/lib/navigation";
import { useState } from "react";

const popular = [
  ["JPY", "Japanese Yen", "¥"],
  ["UZS", "Uzbek So'm", "so'm"],
  ["USD", "US Dollar", "$"],
  ["EUR", "Euro", "€"],
  ["GBP", "British Pound", "£"],
];
const all = [
  ["AUD", "Australian Dollar", "$"],
  ["CHF", "Swiss Franc", "Fr"],
  ["SEK", "Swedish Krona", "kr"],
  ["NOK", "Norwegian Krone", "kr"],
  ["DKK", "Danish Krone", "kr"],
  ["MXN", "Mexican Peso", "$"],
  ["BRL", "Brazilian Real", "R$"],
];

function Row({
  code,
  name,
  sym,
  active,
  onClick,
}: {
  code: CurrencyCode;
  name: string;
  sym: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-2.5 text-left">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--muted)] text-[12px] font-bold text-foreground">
        {sym}
      </div>
      <div className="flex-1 leading-tight">
        <p className="text-[12px] font-bold text-foreground">{code}</p>
        <p className="text-[10px] text-muted-foreground">{name}</p>
      </div>
      {active && <Check className="h-4 w-4 text-[var(--primary)]" strokeWidth={3} />}
    </button>
  );
}

export function CurrencyPickerScreen() {
  const { goBack, currencies, currencyTarget, setCurrencyTarget, setCurrencyForMode } =
    useAppNavigation();
  const [query, setQuery] = useState("");
  const activeCurrency = currencies[currencyTarget];
  const popularRows = popular.filter(([c, n]) =>
    `${c} ${n}`.toLowerCase().includes(query.toLowerCase()),
  );
  const allRows = all.filter(([c, n]) => `${c} ${n}`.toLowerCase().includes(query.toLowerCase()));

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
          <h2 className="text-[17px] font-bold tracking-tight">Currency</h2>
          <div className="w-9" />
        </header>

        <div className="mt-4 flex items-center gap-2 rounded-full bg-white px-4 py-3 shadow-[var(--shadow-soft)]">
          <Search className="h-4 w-4 text-muted-foreground" strokeWidth={2.25} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search currency"
            className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="mt-4 grid grid-cols-2 rounded-2xl bg-white p-1 shadow-[var(--shadow-soft)]">
          {(["personal", "family"] as BudgetMode[]).map((target) => (
            <button
              key={target}
              onClick={() => setCurrencyTarget(target)}
              className={`rounded-xl py-2 text-[12px] font-semibold capitalize transition-all ${
                currencyTarget === target
                  ? "bg-[var(--primary)] text-white"
                  : "text-muted-foreground hover:bg-slate-50"
              }`}
            >
              {target}
            </button>
          ))}
        </div>

        <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Popular for {currencyTarget}
        </p>
        <div className="mt-2 rounded-2xl bg-white shadow-[var(--shadow-soft)] divide-y divide-[oklch(0.94_0.01_265)]">
          {popularRows.map(([c, n, s]) => (
            <Row
              key={c}
              code={c as CurrencyCode}
              name={n}
              sym={s}
              active={c === activeCurrency}
              onClick={() => setCurrencyForMode(currencyTarget, c as CurrencyCode)}
            />
          ))}
        </div>

        <p className="mt-4 text-[10px] text-muted-foreground italic px-1">
          Personal and family spaces can use different display currencies.
        </p>

        <p className="mt-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          All currencies
        </p>
        <div className="mt-2 flex-1 overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-soft)] divide-y divide-[oklch(0.94_0.01_265)]">
          {allRows.map(([c, n, s]) => (
            <Row
              key={c}
              code={c as CurrencyCode}
              name={n}
              sym={s}
              active={c === activeCurrency}
              onClick={() => setCurrencyForMode(currencyTarget, c as CurrencyCode)}
            />
          ))}
        </div>
      </div>
    </PhoneFrame>
  );
}
