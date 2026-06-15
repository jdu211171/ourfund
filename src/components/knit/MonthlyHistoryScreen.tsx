import { ArrowLeft, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { Money } from "./Money";
import { useAppNavigation } from "@/lib/navigation";

type MonthRow = {
  label: string;
  incomeUsd: number;
  expenseUsd: number;
  carryUsd: number; // net carried INTO this month (previous balance)
};

// Newest first. Each month starts fresh at 0 income / 0 expense on top of carry.
const months: MonthRow[] = [
  { label: "November 2026", incomeUsd: 2090.2, expenseUsd: 1290.0, carryUsd: 1289.4 },
  { label: "October 2026", incomeUsd: 4820.0, expenseUsd: 3540.6, carryUsd: 10.0 },
  { label: "September 2026", incomeUsd: 4500.0, expenseUsd: 4490.0, carryUsd: 0.0 },
  { label: "August 2026", incomeUsd: 4600.0, expenseUsd: 3980.5, carryUsd: -609.5 },
  { label: "July 2026", incomeUsd: 3200.0, expenseUsd: 3809.5, carryUsd: 0.0 },
];

export function MonthlyHistoryScreen() {
  const { goBack } = useAppNavigation();
  const current = months[0];
  const carryNow = current.carryUsd + current.incomeUsd - current.expenseUsd;

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
          <h2 className="text-[17px] font-bold tracking-tight">Monthly history</h2>
          <span className="w-9" />
        </header>

        {/* Carry-forward / net wallet */}
        <div className="mt-4 rounded-3xl bg-white p-5 shadow-[var(--shadow-soft)]">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Net balance carried forward
          </p>
          <div className="mt-1">
            <Money usd={carryNow} size="lg" />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Each new month begins with <span className="font-bold text-foreground">0 income</span>{" "}
            and <span className="font-bold text-foreground">0 expense</span>. Only this balance
            carries over.
          </p>
        </div>

        <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Past months
        </p>

        <div className="mt-2 flex-1 space-y-2 overflow-hidden">
          {months.map((m, i) => {
            const net = m.incomeUsd - m.expenseUsd;
            const positive = net >= 0;
            return (
              <button
                key={m.label}
                className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-3 text-left shadow-[var(--shadow-soft)]"
              >
                <div
                  className="grid h-11 w-11 place-items-center rounded-2xl"
                  style={{
                    background: positive ? "oklch(0.96 0.06 145)" : "oklch(0.96 0.06 25)",
                    color: positive ? "var(--success)" : "var(--danger)",
                  }}
                >
                  {positive ? (
                    <TrendingUp className="h-4 w-4" strokeWidth={2.5} />
                  ) : (
                    <TrendingDown className="h-4 w-4" strokeWidth={2.5} />
                  )}
                </div>
                <div className="flex-1 leading-tight">
                  <p className="text-[12px] font-bold text-foreground">
                    {m.label}{" "}
                    {i === 0 && (
                      <span className="ml-1 text-[9px] font-bold uppercase tracking-widest text-[var(--primary)]">
                        · now
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    In{" "}
                    <span className="font-semibold text-[var(--success)]">
                      ${m.incomeUsd.toLocaleString()}
                    </span>
                    {"  ·  "}
                    Out{" "}
                    <span className="font-semibold text-[var(--danger)]">
                      ${m.expenseUsd.toLocaleString()}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Money usd={net} size="sm" tone={positive ? "success" : "danger"} signed />
                  <ChevronRight className="h-4 w-4 text-muted-foreground" strokeWidth={2.25} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </PhoneFrame>
  );
}
