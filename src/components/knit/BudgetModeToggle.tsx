import type { BudgetMode } from "@/lib/navigation";
import { useAppNavigation } from "@/lib/navigation";

type ToggleVariant = "horizontal" | "vertical";

export function BudgetModeToggle({
  className = "",
  variant = "horizontal",
}: {
  className?: string;
  variant?: ToggleVariant;
}) {
  const { budgetMode, setBudgetMode } = useAppNavigation();

  const isVertical = variant === "vertical";

  return (
    <div
      className={`inline-flex rounded-2xl bg-[var(--muted)] p-1 text-[11px] font-bold ${className} ${
        isVertical ? "flex-col" : ""
      }`}
    >
      {(["personal", "family"] as BudgetMode[]).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => setBudgetMode(mode)}
          className={`rounded-xl capitalize transition-all ${
            isVertical
              ? "w-full text-left px-4 py-2.5"
              : "px-3 py-1.5"
          } ${
            budgetMode === mode
              ? "bg-white text-foreground shadow-[var(--shadow-soft)]"
              : "text-muted-foreground hover:bg-white/50"
          }`}
        >
          {mode}
        </button>
      ))}
    </div>
  );
}
