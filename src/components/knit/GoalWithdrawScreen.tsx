import { ArrowLeft, Plane, ArrowDownLeft } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { useState } from "react";
import { useAppNavigation } from "@/lib/navigation";

export function GoalWithdrawScreen() {
  const { navigate, goBack, goals, selectedGoalId, wallets, withdrawFromGoal } = useAppNavigation();
  const goal = goals.find((g) => g.id === selectedGoalId) ?? goals[0];
  const [amount, setAmount] = useState("0");
  const [selectedWallet, setSelectedWallet] = useState(0);
  const wallet = wallets[selectedWallet] ?? wallets[0];

  if (!goal) {
    return (
      <PhoneFrame>
        <div className="flex h-full flex-col px-7 pt-10 pb-7">
          <header className="flex items-center justify-between">
            <button
              onClick={goBack}
              className="grid h-9 w-9 place-items-center rounded-full text-foreground hover:bg-slate-50 transition-colors cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
            </button>
            <h2 className="text-[17px] font-bold tracking-tight">Withdraw</h2>
            <span className="h-9 w-9" />
          </header>
          <button
            onClick={() => navigate("new_goal")}
            className="m-auto rounded-3xl bg-white px-5 py-6 text-center shadow-[var(--shadow-soft)]"
          >
            <p className="text-[14px] font-bold text-foreground">No goal selected</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Create a goal before making withdrawals.
            </p>
          </button>
        </div>
      </PhoneFrame>
    );
  }

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
          <h2 className="text-[17px] font-bold tracking-tight">Withdraw</h2>
          <div className="w-9" />
        </header>

        <div className="mt-5 flex items-center gap-3 rounded-3xl bg-white p-4 shadow-[var(--shadow-soft)]">
          <div
            className="grid h-12 w-12 place-items-center rounded-2xl text-white"
            style={{
              background: "linear-gradient(135deg, oklch(0.65 0.22 200), oklch(0.45 0.24 200))",
            }}
          >
            <Plane className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <div className="flex-1 leading-tight">
            <p className="text-[12px] font-bold text-foreground">{goal.title}</p>
            <p className="text-[10px] text-muted-foreground">
              Saved ${goal.savedUsd.toLocaleString()} of ${goal.targetUsd.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col items-center">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Amount to withdraw
          </p>
          <div className="mt-2 flex items-center justify-center gap-1">
            <span className="text-[20px] font-bold text-muted-foreground">$</span>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              className="w-40 bg-transparent text-center text-[44px] font-extrabold tracking-tight text-foreground outline-none border-b border-transparent focus:border-[var(--primary)] transition-colors focus:ring-0"
              placeholder="0"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Remaining after: $
            {Math.max(0, goal.savedUsd - (parseFloat(amount) || 0)).toLocaleString()}
          </p>
        </div>

        <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Send to
        </p>
        <div className="mt-2 space-y-1.5">
          {wallets.map((w, i) => (
            <button
              key={w.id}
              onClick={() => setSelectedWallet(i)}
              className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-[12px] font-semibold active:scale-95 transition-all cursor-pointer ${
                i === selectedWallet
                  ? "bg-[var(--primary)] text-white shadow-md"
                  : "bg-white text-foreground shadow-[var(--shadow-soft)] hover:bg-slate-50"
              }`}
            >
              <span>{w.label}</span>
              <ArrowDownLeft className="h-4 w-4" strokeWidth={2.25} />
            </button>
          ))}
          {wallets.length === 0 && (
            <button
              onClick={() => navigate("new_wallet")}
              className="w-full rounded-2xl bg-white px-4 py-4 text-center shadow-[var(--shadow-soft)]"
            >
              <p className="text-[13px] font-bold text-foreground">No wallet available</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Create a wallet to receive withdrawals.
              </p>
            </button>
          )}
        </div>

        <p className="mt-4 text-[11px] text-muted-foreground">
          Withdrawing reduces your goal progress. Admins will be notified.
        </p>

        <button
          onClick={() => {
            if (!wallet) {
              navigate("new_wallet");
              return;
            }
            withdrawFromGoal(goal.id, parseFloat(amount || "0"), wallet.label);
            navigate("goal_detail");
          }}
          className="mt-auto w-full rounded-full bg-[oklch(0.18_0.04_265)] py-4 text-[15px] font-semibold text-white active:scale-95 transition-all cursor-pointer"
        >
          {wallet ? "Confirm withdrawal" : "Create wallet"}
        </button>
      </div>
    </PhoneFrame>
  );
}
