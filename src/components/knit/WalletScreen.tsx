import { Plus, Users, Lock, ShoppingBag, PiggyBank } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { BottomNav } from "./BottomNav";
import { BalanceHeader } from "./BalanceHeader";
import { Money } from "./Money";
import { useAppNavigation } from "@/lib/navigation";
import { categoryIconMap } from "./categoryOptions";

export function WalletScreen() {
  const {
    navigate,
    budgetMode,
    activeWallets,
    walletBalanceUsd,
    categories,
    categorySpentUsd,
    balanceUsd,
    incomeUsd,
    spentUsd,
    members,
    selectedMemberId,
  } = useAppNavigation();
  const viewedMember = members.find((member) => member.id === selectedMemberId);

  // Sort wallets so the active budget wallet is on top
  const sortedWallets = [...activeWallets].sort((a, b) => {
    if (budgetMode === "personal") {
      return a.type === "private" ? -1 : 1;
    } else {
      return a.type !== "private" ? -1 : 1;
    }
  });

  return (
    <PhoneFrame>
      <div className="flex-1 overflow-y-auto flex flex-col px-7 pt-10 pb-28 min-h-0">
        <header className="flex items-center justify-between">
          <h2 className="text-[18px] font-extrabold tracking-tight text-[oklch(0.2_0.08_265)]">
            Wallets
          </h2>
          <button
            onClick={() => navigate("new_wallet")}
            className="grid h-9 w-9 place-items-center rounded-full bg-[var(--muted)] hover:bg-slate-200 transition-colors active:scale-95 cursor-pointer"
            aria-label="Add wallet"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </header>

        <div className="mt-4">
          <BalanceHeader
            balanceUsd={balanceUsd}
            incomeUsd={incomeUsd}
            spentUsd={spentUsd}
            label={budgetMode === "personal" ? "Personal balance" : "Family balance"}
          />
        </div>

        <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          {budgetMode === "personal" && viewedMember
            ? `${viewedMember.name.split(" ")[0]}'s private wallets`
            : "Household wallets"}
        </p>
        <div className="mt-2 space-y-2">
          {sortedWallets.map((w) => (
            <div
              key={w.label}
              className="flex items-center gap-3 rounded-2xl bg-white px-3 py-3 shadow-[var(--shadow-soft)]"
            >
              <div
                className="grid h-11 w-11 place-items-center rounded-2xl"
                style={{ background: "oklch(0.96 0.05 265)", color: w.color }}
              >
                {w.type === "private" ? (
                  <Lock className="h-4 w-4" strokeWidth={2.25} />
                ) : w.type === "connected" ? (
                  <PiggyBank className="h-4 w-4" strokeWidth={2.25} />
                ) : (
                  <Users className="h-4 w-4" strokeWidth={2.25} />
                )}
              </div>
              <div className="flex-1 leading-tight">
                <p className="text-[12px] font-bold text-foreground">{w.label}</p>
                <p className="text-[10px] text-muted-foreground">{w.sub}</p>
              </div>
              <Money usd={walletBalanceUsd(w.label)} size="sm" />
            </div>
          ))}
          {sortedWallets.length === 0 && (
            <button
              onClick={() => navigate("new_wallet")}
              className="w-full rounded-2xl bg-white px-4 py-5 text-center shadow-[var(--shadow-soft)]"
            >
              <p className="text-[13px] font-bold text-foreground">No wallet here yet</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Create a wallet for this view.
              </p>
            </button>
          )}
        </div>

        <button
          onClick={() => navigate("new_wallet")}
          className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-[oklch(0.97_0.01_265)] py-3 text-[12px] font-semibold text-[var(--primary)] hover:bg-[oklch(0.93_0.02_265)] transition-colors active:scale-95 cursor-pointer"
        >
          <Plus className="h-4 w-4" strokeWidth={2.25} />
          Add a wallet
        </button>

        <p className="mt-5 text-[13px] font-bold text-[oklch(0.2_0.08_265)]">Category limits</p>

        <div className="mt-3 space-y-2.5">
          {categories.map((category) => {
            const Icon = categoryIconMap[category.icon] ?? ShoppingBag;
            const usd = categorySpentUsd(category.label);
            const pct =
              category.limitUsd > 0
                ? Math.min(100, Math.round((usd / category.limitUsd) * 100))
                : 100;
            return (
              <div
                key={category.id}
                onClick={() => navigate("categories")}
                className="rounded-2xl bg-white px-3 py-2.5 shadow-[var(--shadow-soft)] cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-[oklch(0.96_0.04_265)] text-[var(--primary)]">
                    <Icon className="h-4 w-4" strokeWidth={2.25} />
                  </div>
                  <div className="flex-1 leading-tight">
                    <p className="text-[12px] font-bold text-foreground">{category.label}</p>
                    <p className="text-[10px] text-muted-foreground">{pct}% of limit</p>
                  </div>
                  <Money usd={usd} size="sm" />
                </div>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[var(--muted)]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: pct > 80 ? "var(--danger)" : "var(--primary)",
                    }}
                  />
                </div>
              </div>
            );
          })}
          {categories.length === 0 && (
            <button
              onClick={() => navigate("new_category")}
              className="w-full rounded-2xl bg-white px-4 py-5 text-center shadow-[var(--shadow-soft)]"
            >
              <p className="text-[13px] font-bold text-foreground">No limits yet</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Add budget categories to track spending.
              </p>
            </button>
          )}
        </div>
      </div>
      <BottomNav active="wallet" />
    </PhoneFrame>
  );
}
