import { Check, CheckCircle2 } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { useAppNavigation } from "@/lib/navigation";

export function PlaidSuccessScreen() {
  const { navigate, selectedBankName, linkedBanks } = useAppNavigation();
  const bank = linkedBanks.find((b) => b.name === selectedBankName);
  const accounts = bank?.accounts ?? [];

  return (
    <PhoneFrame>
      <div className="flex h-full flex-col items-center px-7 pt-16 pb-7">
        <div
          className="grid h-20 w-20 place-items-center rounded-3xl text-white shadow-[var(--shadow-tile)]"
          style={{ background: "linear-gradient(135deg, oklch(0.7 0.2 150), oklch(0.5 0.2 150))" }}
        >
          <CheckCircle2 className="h-10 w-10" strokeWidth={2} />
        </div>

        <h2 className="mt-6 font-display text-[24px] tracking-tight text-foreground">
          Bank synced!
        </h2>
        <p className="mt-1.5 text-center text-[12px] text-muted-foreground max-w-[240px]">
          {selectedBankName} is now linked. We imported {accounts.length} accounts and made them
          available in Wallets.
        </p>

        <div className="mt-6 w-full rounded-3xl bg-white p-4 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-3 border-b border-[var(--muted)] pb-3">
            <div
              className="grid h-10 w-10 place-items-center rounded-xl text-white text-[12px] font-extrabold"
              style={{ background: "oklch(0.45 0.18 250)" }}
            >
              C
            </div>
            <div className="flex-1 leading-tight">
              <p className="text-[12px] font-bold text-foreground">{selectedBankName}</p>
              <p className="text-[10px] text-muted-foreground">Connected just now</p>
            </div>
            <span className="rounded-full bg-[oklch(0.92_0.1_150)] px-2 py-0.5 text-[10px] font-bold text-[oklch(0.4_0.18_150)]">
              Active
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {accounts.map((a) => (
              <div key={a.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-[oklch(0.5_0.2_150)]" strokeWidth={2.5} />
                  <p className="text-[12px] font-semibold text-foreground">{a.name}</p>
                </div>
                <p className="text-[12px] font-bold text-foreground tabular-nums">
                  ${a.balanceUsd.toLocaleString()}
                </p>
              </div>
            ))}
            {accounts.length === 0 && (
              <button
                onClick={() => navigate("connect_bank")}
                className="w-full rounded-2xl bg-[var(--muted)] py-3 text-[12px] font-semibold text-foreground"
              >
                Connect a bank to import accounts
              </button>
            )}
          </div>
        </div>

        <div className="mt-auto w-full space-y-2">
          <button
            onClick={() => navigate("wallet")}
            className="w-full rounded-full bg-[oklch(0.18_0.04_265)] py-4 text-[15px] font-semibold text-white"
          >
            Done
          </button>
          <button
            onClick={() => navigate("connect_bank")}
            className="w-full rounded-full bg-white py-3 text-[13px] font-semibold text-foreground shadow-[var(--shadow-soft)]"
          >
            Connect another bank
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}
