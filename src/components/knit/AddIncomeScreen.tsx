import { useState } from "react";
import { ArrowLeft, Briefcase, Users, Delete } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { Money } from "./Money";
import { currencyValueToUsd } from "@/lib/currency";
import { useAppNavigation } from "@/lib/navigation";
import { formatISODate } from "@/context/helpers";
import { OptionSelect } from "./OptionSelect";

const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"] as const;

export function AddIncomeScreen() {
  const { navigate, goBack, currency, addTransaction, activeWallets, selectedWalletId } =
    useAppNavigation();
  const [amount, setAmount] = useState("0");
  const amountUsd = currencyValueToUsd(parseFloat(amount || "0"), currency);
  const sources = ["Monthly salary", "Freelance invoice", "Allowance", "Gift"];
  const [source, setSource] = useState(sources[0]);
  const defaultWalletId =
    selectedWalletId && activeWallets.some((w) => w.id === selectedWalletId)
      ? selectedWalletId
      : (activeWallets[0]?.id ?? "");
  const [walletId, setWalletId] = useState(defaultWalletId);
  const wallet = activeWallets.find((item) => item.id === walletId) ?? activeWallets[0];
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
          <h2 className="text-[17px] font-bold tracking-tight">Add Income</h2>
          <span className="h-9 w-9" />
        </header>

        <div className="mt-8 text-center">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Amount</p>
          <div className="mt-2 inline-block text-center">
            <Money usd={amountUsd} size="xl" tone="success" signed />
          </div>
        </div>

        <div className="mt-7 space-y-3">
          <OptionSelect
            label="Source"
            value={source}
            options={sources.map((item) => ({ value: item, label: item }))}
            onChange={setSource}
            icon={<Briefcase className="h-5 w-5" strokeWidth={2.25} />}
          />

          <OptionSelect
            label="Deposit to"
            value={wallet?.id ?? ""}
            options={activeWallets.map((item) => ({
              value: item.id,
              label: item.label,
              description: item.sub,
            }))}
            onChange={setWalletId}
            emptyLabel="Create a wallet first"
            icon={<Users className="h-5 w-5" strokeWidth={2.25} />}
          />
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
            if (amountUsd > 0) {
              addTransaction({
                name: source,
                who: "Income",
                usd: amountUsd,
                category: "Salary",
                wallet: wallet.label,
                date: formatISODate(new Date()),
              });
            }
            goBack();
          }}
          className="mt-4 w-full rounded-full bg-[var(--primary)] py-4 text-[15px] font-semibold text-white active:scale-95 transition-transform cursor-pointer"
        >
          {hasWallet ? "Add income" : "Create a wallet first"}
        </button>
      </div>
    </PhoneFrame>
  );
}
