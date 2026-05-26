import { useState } from "react";
import { ArrowLeft, ChevronDown, ShoppingBag, Users, Delete } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { Money } from "./Money";
import { useAppNavigation } from "@/lib/navigation";

const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"] as const;

export function SendMoneyScreen() {
  const { navigate, goBack, budgetMode, profile, addTransaction, categories, wallets } =
    useAppNavigation();
  const [amount, setAmount] = useState("0");
  const activeWallets = wallets.filter((w) =>
    budgetMode === "personal" ? w.type === "private" : w.type !== "private",
  );
  const [categoryIdx, setCategoryIdx] = useState(0);
  const [walletIdx, setWalletIdx] = useState(0);
  const category = categories[categoryIdx] ?? categories[0];
  const wallet = activeWallets[walletIdx] ?? activeWallets[0];
  const hasWallet = Boolean(wallet);

  const handleKeyPress = (k: (typeof keys)[number]) => {
    if (k === "del") {
      setAmount((prev) => {
        const next = prev.slice(0, -1);
        return next === "" ? "0" : next;
      });
    } else if (k === ".") {
      if (!amount.includes(".")) {
        setAmount((prev) => prev + ".");
      }
    } else {
      setAmount((prev) => {
        if (prev === "0") return k;
        return prev + k;
      });
    }
  };

  return (
    <PhoneFrame>
      <div className="flex-1 overflow-y-auto flex flex-col px-7 pt-10 pb-7 min-h-0">
        <header className="flex items-center justify-between">
          <button
            onClick={goBack}
            className="grid h-9 w-9 place-items-center rounded-full text-foreground hover:bg-slate-50 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
          </button>
          <h2 className="text-[17px] font-bold tracking-tight">Add Expense</h2>
          <span className="h-9 w-9" />
        </header>

        <div className="mt-8 text-center">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Amount</p>
          <div className="mt-2 inline-block">
            <Money usd={-parseFloat(amount || "0")} size="xl" tone="danger" signed />
          </div>
        </div>

        <div className="mt-7 space-y-3">
          <div className="flex items-center gap-3 rounded-2xl bg-white px-3 py-3 shadow-[var(--shadow-soft)]">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[oklch(0.95_0.05_265)] text-[var(--primary)]">
              <ShoppingBag className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <div className="flex-1 leading-tight">
              <p className="text-[11px] text-muted-foreground">Category</p>
              <p className="text-[14px] font-bold text-foreground">
                {category?.label ?? "Expense"}
              </p>
            </div>
            <button
              onClick={() => setCategoryIdx((prev) => (prev + 1) % Math.max(categories.length, 1))}
              className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground"
              aria-label="Change category"
            >
              <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-white px-3 py-3 shadow-[var(--shadow-soft)]">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[oklch(0.95_0.05_265)] text-[var(--primary)]">
              <Users className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <div className="flex-1 leading-tight">
              <p className="text-[11px] text-muted-foreground">Paid from</p>
              <p className="text-[14px] font-bold text-foreground">
                {wallet?.label ?? "Create a wallet first"}
              </p>
            </div>
            <button
              onClick={() => setWalletIdx((prev) => (prev + 1) % Math.max(activeWallets.length, 1))}
              className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground"
              aria-label="Change wallet"
            >
              <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="mt-6 grid flex-1 grid-cols-3 place-items-center gap-y-1">
          {keys.map((k) => (
            <button
              key={k}
              onClick={() => handleKeyPress(k)}
              className="grid h-12 w-12 place-items-center text-[26px] font-semibold text-foreground transition-colors active:bg-[var(--muted)] rounded-full hover:bg-slate-50 cursor-pointer"
              aria-label={k === "del" ? "Delete" : k}
            >
              {k === "del" ? (
                <span className="grid h-9 w-10 place-items-center rounded-lg bg-[var(--muted)] text-muted-foreground">
                  <Delete className="h-4 w-4" strokeWidth={2.25} />
                </span>
              ) : (
                k
              )}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            if (!hasWallet) {
              navigate("new_wallet");
              return;
            }
            const val = parseFloat(amount || "0");
            if (val > 0) {
              addTransaction({
                name: category?.label ? `${category.label} expense` : "Expense",
                who: `${profile.name.split(" ").filter(Boolean)[0] ?? "You"} · today`,
                usd: -val,
                category: category?.label ?? "Uncategorized",
                wallet: wallet.label,
                date: "today",
              });
            }
            goBack();
          }}
          className="mt-4 w-full rounded-full bg-[oklch(0.18_0.04_265)] py-4 text-[15px] font-semibold text-white active:scale-95 transition-transform cursor-pointer"
        >
          {hasWallet ? "Save expense" : "Create a wallet first"}
        </button>
      </div>
    </PhoneFrame>
  );
}
