import { ArrowLeft, ArrowDown, Users, Lock } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { useEffect, useMemo, useState } from "react";
import { useAppNavigation } from "@/lib/navigation";
import { OptionSelect } from "./OptionSelect";
import {
  currencyAdornment,
  currencyValueToUsd,
  formatCurrencyValue,
  formatUsdAsCurrency,
} from "@/lib/currency";

const presets = [50, 100, 250, 500];

export function TransferFundsScreen() {
  const {
    navigate,
    goBack,
    currency,
    wallets,
    members,
    currentMemberId,
    walletBalanceUsd,
    recordTransfer,
  } = useAppNavigation();
  const [amount, setAmount] = useState("0");
  const [note, setNote] = useState("");
  const currentMember = members.find((member) => member.id === currentMemberId);
  const isAdmin = currentMember?.role === "Admin";
  const fromWallets = useMemo(
    () =>
      wallets.filter((wallet) => {
        const ownWallet = currentMemberId ? wallet.members.includes(currentMemberId) : false;
        if (isAdmin) return wallet.type !== "private" || ownWallet;
        return ownWallet && wallet.type !== "shared";
      }),
    [currentMemberId, isAdmin, wallets],
  );
  const toWallets = useMemo(
    () =>
      wallets.filter((wallet) => {
        if (isAdmin) return true;
        return wallet.type === "shared" || wallet.type === "private";
      }),
    [isAdmin, wallets],
  );
  const [fromId, setFromId] = useState(fromWallets[0]?.id ?? "");
  const [toId, setToId] = useState(toWallets.find((wallet) => wallet.id !== fromId)?.id ?? "");
  const fromWallet = fromWallets.find((wallet) => wallet.id === fromId) ?? fromWallets[0];
  const toWallet =
    toWallets.find((wallet) => wallet.id === toId && wallet.id !== fromWallet?.id) ??
    toWallets.find((wallet) => wallet.id !== fromWallet?.id);
  const amountUsd = currencyValueToUsd(parseFloat(amount || "0"), currency);
  const { prefix, suffix } = currencyAdornment(currency);
  const hasTransferPair = Boolean(fromWallet && toWallet && fromWallet.id !== toWallet.id);
  const canTransfer = hasTransferPair && amountUsd > 0;

  useEffect(() => {
    if (!fromWallets.some((wallet) => wallet.id === fromId)) {
      setFromId(fromWallets[0]?.id ?? "");
    }
  }, [fromId, fromWallets]);

  useEffect(() => {
    if (!toWallet || toWallet.id === fromWallet?.id) {
      setToId(toWallets.find((wallet) => wallet.id !== fromWallet?.id)?.id ?? "");
    }
  }, [fromWallet?.id, toWallet, toWallets]);

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
            {prefix && (
              <span className="text-[24px] font-bold text-muted-foreground">{prefix}</span>
            )}
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              className="w-40 bg-transparent text-center text-[40px] font-extrabold tracking-tight text-foreground outline-none border-b border-transparent focus:border-[var(--primary)] transition-colors focus:ring-0"
              placeholder="0"
            />
            {suffix && (
              <span className="text-[18px] font-bold text-muted-foreground">{suffix}</span>
            )}
          </div>
        </div>

        <div className="mt-6 relative space-y-2">
          <OptionSelect
            label="From"
            value={fromWallet?.id ?? ""}
            options={fromWallets.map((wallet) => ({
              value: wallet.id,
              label: wallet.label,
              description: `Balance · ${formatUsdAsCurrency(walletBalanceUsd(wallet.label), currency)}`,
              disabled: wallet.id === toWallet?.id,
            }))}
            onChange={setFromId}
            emptyLabel="Create a wallet"
            icon={<Users className="h-5 w-5" strokeWidth={2.25} />}
          />

          <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white text-[var(--primary)] shadow-[var(--shadow-soft)]">
            <ArrowDown className="h-4 w-4" strokeWidth={2.5} />
          </div>

          <OptionSelect
            label="To"
            value={toWallet?.id ?? ""}
            options={toWallets.map((wallet) => ({
              value: wallet.id,
              label: wallet.label,
              description: wallet.sub,
              disabled: wallet.id === fromWallet?.id,
            }))}
            onChange={setToId}
            emptyLabel="Create another wallet"
            icon={<Lock className="h-5 w-5" strokeWidth={2.25} />}
          />
        </div>

        <div className="mt-5 flex gap-2">
          {presets.map((value) => {
            const val = String(value);
            return (
              <button
                key={value}
                onClick={() => setAmount(val)}
                className={`flex-1 rounded-full py-2 text-[12px] font-semibold active:scale-95 transition-all cursor-pointer ${
                  amount === val
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--muted)] text-foreground hover:bg-slate-200"
                }`}
              >
                {formatCurrencyValue(value, currency, { maximumFractionDigits: 0 })}
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
            if (!hasTransferPair || !fromWallet || !toWallet) {
              navigate("new_wallet");
              return;
            }
            if (!canTransfer) return;
            recordTransfer(amountUsd, fromWallet.label, toWallet.label, note);
            navigate("home");
          }}
          className="mt-auto w-full rounded-full bg-[oklch(0.18_0.04_265)] py-4 text-[15px] font-semibold text-white active:scale-95 transition-all cursor-pointer"
        >
          {hasTransferPair ? "Transfer funds" : "Create another wallet"}
        </button>
      </div>
    </PhoneFrame>
  );
}
