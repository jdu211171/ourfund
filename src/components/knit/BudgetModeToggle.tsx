import type { BudgetMode } from "@/lib/navigation";
import { useAppNavigation } from "@/lib/navigation";

export function BudgetModeToggle({ className = "" }: { className?: string }) {
  const { budgetMode, setBudgetMode } = useAppNavigation();

  return (
    <div
      className={`inline-flex rounded-full bg-[var(--muted)] p-1 text-[11px] font-bold ${className}`}
    >
      {(["personal", "family"] as BudgetMode[]).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => setBudgetMode(mode)}
          className={`rounded-full px-3 py-1.5 capitalize transition-all ${
            budgetMode === mode
              ? "bg-white text-foreground shadow-[var(--shadow-soft)]"
              : "text-muted-foreground"
          }`}
        >
          {mode}
        </button>
      ))}
    </div>
  );
}
