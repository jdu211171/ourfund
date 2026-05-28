import { AlertTriangle } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { useAppNavigation } from "@/lib/navigation";
import { formatUsdAsCurrency } from "@/lib/currency";

export function ConfirmDeleteScreen() {
  const { goBack, navigate, currency, selectedTransactionId, transactions, deleteTransaction } =
    useAppNavigation();

  // Find transaction
  const txn =
    transactions.find((t) => t.id === selectedTransactionId) || transactions.find((t) => t.usd < 0);

  const handleDelete = () => {
    if (txn) {
      deleteTransaction(txn.id);
    }
    navigate("home");
  };

  return (
    <PhoneFrame>
      <div className="relative flex h-full flex-col">
        <div className="flex-1 px-7 pt-10 opacity-40">
          <div className="h-9 w-9 rounded-full bg-[var(--muted)]" />
          <div className="mt-6 h-16 w-16 rounded-2xl bg-[var(--muted)] mx-auto" />
          <div className="mt-4 mx-auto h-6 w-32 rounded-full bg-[var(--muted)]" />
          <div className="mt-3 mx-auto h-3 w-40 rounded-full bg-[var(--muted)]" />
          <div className="mt-6 h-40 rounded-3xl bg-white shadow-[var(--shadow-soft)]" />
        </div>

        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

        <div className="absolute inset-x-4 bottom-4 rounded-3xl bg-white p-6 shadow-[var(--shadow-tile)]">
          <div className="flex flex-col items-center text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[oklch(0.96_0.04_30)] text-[var(--danger)]">
              <AlertTriangle className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <h3 className="mt-3 font-display text-[20px] tracking-tight text-foreground">
              Delete transaction?
            </h3>
            <p className="mt-1 text-[12px] text-muted-foreground">
              This removes{" "}
              <span className="font-semibold text-foreground">
                {txn
                  ? `${txn.name} · ${formatUsdAsCurrency(Math.abs(txn.usd), currency)}`
                  : "this transaction"}
              </span>{" "}
              from the budget ledger. This cannot be undone.
            </p>
          </div>
          <div className="mt-5 flex gap-3">
            <button
              onClick={goBack}
              className="flex-1 rounded-full bg-[var(--muted)] py-3 text-[13px] font-semibold text-foreground cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 rounded-full bg-[var(--danger)] py-3 text-[13px] font-semibold text-white cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
