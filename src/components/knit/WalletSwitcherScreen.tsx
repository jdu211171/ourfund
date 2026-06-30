import { ArrowLeft, Check, Lock, Plus, Users, PiggyBank } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { Money } from "./Money";
import { useAppNavigation } from "@/lib/navigation";

/**
 * Wallet switcher — opens from the Home header chip. Selecting a wallet
 * sets it as the "active" target for new income & expense entries.
 */
export function WalletSwitcherScreen() {
  const {
    activeWallets,
    selectedWalletId,
    setSelectedWalletId,
    goBack,
    navigate,
    walletBalanceUsd,
  } = useAppNavigation();

  const currentActiveId =
    selectedWalletId && activeWallets.some((w) => w.id === selectedWalletId)
      ? selectedWalletId
      : (activeWallets[0]?.id ?? "");

  const handleSelect = (walletId: string) => {
    setSelectedWalletId(walletId);
    goBack();
  };

  return (
    <PhoneFrame>
      <div className="flex h-full flex-col px-7 pt-10 pb-7">
        <header className="flex items-center justify-between">
          <button
            onClick={goBack}
            className="grid h-9 w-9 place-items-center rounded-full text-foreground hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
          </button>
          <h2 className="text-[17px] font-bold tracking-tight">Switch wallet</h2>
          <span className="h-9 w-9" />
        </header>

        <p className="mt-5 text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
          Active wallet for new entries
        </p>

        <div className="mt-3 space-y-2 flex-1 overflow-y-auto pr-1">
          {activeWallets.map((w) => {
            const isActive = w.id === currentActiveId;
            return (
              <button
                key={w.id}
                onClick={() => handleSelect(w.id)}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left shadow-[var(--shadow-soft)] transition-all cursor-pointer active:scale-[0.99] border-2 ${
                  isActive
                    ? "bg-[var(--accent)] border-[var(--primary)]"
                    : "bg-white border-transparent hover:bg-slate-50"
                }`}
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
                <div className="flex-1 leading-tight min-w-0">
                  <p className="text-[12px] font-bold text-foreground truncate">{w.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{w.sub}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Money usd={walletBalanceUsd(w.label)} size="sm" />
                  {isActive && (
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--primary)] text-white animate-in zoom-in-50 duration-200">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => navigate("new_wallet")}
          className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-[oklch(0.97_0.01_265)] py-3 text-[12px] font-semibold text-[var(--primary)] hover:bg-[oklch(0.94_0.02_265)] active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" strokeWidth={2.25} />
          New wallet
        </button>

        <p className="mt-4 pt-4 text-[10px] leading-snug text-muted-foreground border-t border-slate-100">
          The active wallet is where new income & expenses are recorded. You can change it any time
          — past transactions stay where they were.
        </p>

        <button
          onClick={goBack}
          className="mt-3 w-full rounded-full bg-[oklch(0.18_0.04_265)] py-4 text-[15px] font-semibold text-white active:scale-95 transition-all cursor-pointer hover:opacity-90"
        >
          Use active wallet
        </button>
      </div>
    </PhoneFrame>
  );
}
