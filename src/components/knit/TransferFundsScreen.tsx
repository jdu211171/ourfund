import { ArrowLeft, ArrowDown, Users, Lock } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { useState } from "react";
import { useAppNavigation } from "@/lib/navigation";

const presets = ["$50", "$100", "$250", "$500"];

export function TransferFundsScreen() {
  const { navigate, goBack, wallets, walletBalanceUsd, recordTransfer } = useAppNavigation();
  const [amount, setAmount] = useState("0");
  const [note, setNote] = useState("");
  const [fromIdx, setFromIdx] = useState(0);
  const [toIdx, setToIdx] = useState(1);
  const fromWallet = wallets[fromIdx] ?? wallets[0];
  const toWallet = wallets[toIdx] ?? wallets[1] ?? wallets[0];
  const canTransfer = Boolean(
    wallets.length >= 2 && fromWallet && toWallet && fromWallet.id !== toWallet.id,
  );

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
          <h2 className="text-[17px] font-bold tracking-tight">Transfer</h2>
          <span className="h-9 w-9" />
        </header>

        <div className="mt-8 text-center">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Amount</p>
          <div className="mt-1 flex items-center justify-center gap-1">
            <span className="text-[24px] font-bold text-muted-foreground">$</span>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              className="w-40 bg-transparent text-center text-[40px] font-extrabold tracking-tight text-foreground outline-none border-b border-transparent focus:border-[var(--primary)] transition-colors focus:ring-0"
              placeholder="0"
            />
          </div>
        </div>

        <div className="mt-6 relative space-y-2">
          <button
            onClick={() => setFromIdx((prev) => (prev + 1) % Math.max(wallets.length, 1))}
            className="rounded-2xl p-4 text-white shadow-[var(--shadow-soft)]"
            style={{
              background: "linear-gradient(135deg, oklch(0.45 0.24 265), oklch(0.65 0.22 265))",
            }}
          >
            <p className="text-[10px] uppercase tracking-widest text-white/60">From</p>
            <div className="mt-1 flex items-center gap-2">
              <Users className="h-4 w-4" strokeWidth={2.25} />
              <p className="text-[15px] font-bold">{fromWallet?.label ?? "Create a wallet"}</p>
            </div>
            <p className="mt-1 text-[11px] text-white/70">
              Balance · ${walletBalanceUsd(fromWallet?.label ?? "").toLocaleString()}
            </p>
          </button>

          <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white text-[var(--primary)] shadow-[var(--shadow-soft)]">
            <ArrowDown className="h-4 w-4" strokeWidth={2.5} />
          </div>

          <button
            onClick={() => setToIdx((prev) => (prev + 1) % Math.max(wallets.length, 1))}
            className="rounded-2xl bg-white p-4 text-left shadow-[var(--shadow-soft)]"
          >
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">To</p>
            <div className="mt-1 flex items-center gap-2 text-foreground">
              <Lock className="h-4 w-4" strokeWidth={2.25} />
              <p className="text-[15px] font-bold">{toWallet?.label ?? "Create another wallet"}</p>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {toWallet?.sub ?? "Transfers need two wallets"}
            </p>
          </button>
        </div>

        <div className="mt-5 flex gap-2">
          {presets.map((q) => {
            const val = q.replace("$", "");
            return (
              <button
                key={q}
                onClick={() => setAmount(val)}
                className={`flex-1 rounded-full py-2 text-[12px] font-semibold active:scale-95 transition-all cursor-pointer ${
                  amount === val
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--muted)] text-foreground hover:bg-slate-200"
                }`}
              >
                {q}
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-2xl bg-[var(--muted)] px-4 py-3 focus-within:ring-2 focus-within:ring-[var(--primary)] transition-all">
          <label className="text-[11px] text-muted-foreground block">Note</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-transparent text-[13px] font-semibold text-foreground outline-none border-none p-0 focus:ring-0"
          />
        </div>

        <button
          onClick={() => {
            if (!canTransfer || !fromWallet || !toWallet) {
              navigate("new_wallet");
              return;
            }
            recordTransfer(parseFloat(amount || "0"), fromWallet.label, toWallet.label, note);
            navigate("home");
          }}
          className="mt-auto w-full rounded-full bg-[oklch(0.18_0.04_265)] py-4 text-[15px] font-semibold text-white active:scale-95 transition-all cursor-pointer"
        >
          {canTransfer ? "Transfer funds" : "Create another wallet"}
        </button>
      </div>
    </PhoneFrame>
  );
}
