import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Money } from "./Money";
import { formatUsdAsCurrency } from "@/lib/currency";
import { useAppNavigation } from "@/lib/navigation";
import { BudgetModeToggle } from "./BudgetModeToggle";

type Props = {
  label?: string;
  balanceUsd: number;
  incomeUsd: number;
  spentUsd: number;
  interactive?: boolean;
};

/**
 * Shared budget-showing header used on every primary screen so users see
 * the same balance surface everywhere. Borderless: white card, soft shadow.
 */
export function BalanceHeader({
  label = "Current balance",
  balanceUsd,
  incomeUsd,
  spentUsd,
  interactive = true,
}: Props) {
  const { currency } = useAppNavigation();
  const balanceText = formatUsdAsCurrency(balanceUsd, currency, { compact: true });
  const balanceToggleVariant = balanceText.length >= 14 ? "vertical" : undefined;

  return (
    <div className="rounded-3xl bg-white shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
          {label}
        </p>
      </div>
      <div className="mt-1 flex items-center justify-between gap-2 [container-type:inline-size]">
        <Money
          usd={balanceUsd}
          size="xl"
          compact
          nowrap
          className="min-w-0"
          primaryClassName="!text-[clamp(28px,9cqw,34px)]"
        />
        <BudgetModeToggle
          className={`shrink-0 scale-80 ${balanceToggleVariant === "vertical" ? "origin-left" : "origin-right"}`} 
          variant={balanceToggleVariant}
        />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Cell
          tint="oklch(0.96 0.04 145)"
          fg="var(--success)"
          icon={<ArrowDownLeft className="h-3.5 w-3.5" strokeWidth={2.75} />}
          label="Income"
          usd={incomeUsd}
          interactive={interactive}
        />
        <Cell
          tint="oklch(0.96 0.05 25)"
          fg="var(--danger)"
          icon={<ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.75} />}
          label="Expense"
          usd={spentUsd}
          interactive={interactive}
        />
      </div>
    </div>
  );
}

function Cell({
  tint,
  fg,
  icon,
  label,
  usd,
  interactive,
}: {
  tint: string;
  fg: string;
  icon: React.ReactNode;
  label: string;
  usd: number;
  interactive: boolean;
}) {
  const { navigate } = useAppNavigation();
  const content = (
    <>
      <div className="flex items-center gap-1.5">
        <span
          className="grid h-5 w-5 place-items-center rounded-full"
          style={{ background: tint, color: fg }}
        >
          {icon}
        </span>
        <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
      </div>
      <Money usd={usd} size="md" tone={label === "Expense" ? "danger" : "default"} />
    </>
  );

  if (interactive) {
    return (
      <button
        onClick={() => navigate(label === "Expense" ? "scan_receipt" : "add_income")}
        className="flex flex-col gap-1.5 rounded-2xl bg-[var(--muted)]/55 p-3 text-left transition-colors hover:bg-[var(--muted)]"
        type="button"
      >
        {content}
      </button>
    );
  }

  return <div className="flex flex-col gap-1.5">{content}</div>;
}
