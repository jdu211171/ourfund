import { useState } from "react";
import { ArrowLeft, ShoppingBag, Trash2 } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { useAppNavigation } from "@/lib/navigation";

export function EditTransactionScreen() {
  const { navigate, goBack, selectedTransactionId, transactions, categories, updateTransaction } =
    useAppNavigation();

  // Find dynamic transaction
  const txn = transactions.find((t) => t.id === selectedTransactionId) || transactions[0];

  const [amount, setAmount] = useState(Math.abs(txn?.usd ?? 0).toString());
  const [description, setDescription] = useState(txn?.name ?? "");
  const [category, setCategory] = useState(
    txn?.category ?? categories[0]?.label ?? "Uncategorized",
  );
  const categoryOptions = [
    ...new Set([
      ...categories.map((item) => item.label),
      ...transactions.map((item) => item.category),
      category,
    ]),
  ].filter(Boolean);

  if (!txn) {
    return (
      <PhoneFrame>
        <div className="flex h-full flex-col px-7 pt-10 pb-7">
          <header className="flex items-center justify-between">
            <button
              className="grid h-9 w-9 place-items-center rounded-full text-foreground hover:bg-slate-50 transition-colors cursor-pointer"
              aria-label="Back"
              onClick={goBack}
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
            </button>
            <h2 className="text-[17px] font-bold tracking-tight">Edit transaction</h2>
            <span className="h-9 w-9" />
          </header>
          <button
            onClick={() => navigate("add_expense")}
            className="m-auto rounded-3xl bg-white px-5 py-6 text-center shadow-[var(--shadow-soft)]"
          >
            <p className="text-[14px] font-bold text-foreground">No transaction selected</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Add a transaction before editing.
            </p>
          </button>
        </div>
      </PhoneFrame>
    );
  }

  const handleSave = () => {
    const val = parseFloat(amount || "0");
    if (val <= 0) return;

    updateTransaction(txn.id, {
      name: description,
      usd: txn.usd < 0 ? -val : val,
      category,
    });

    navigate("home");
  };

  return (
    <PhoneFrame>
      <div className="flex h-full flex-col px-7 pt-10 pb-7">
        <header className="flex items-center justify-between">
          <button
            className="grid h-9 w-9 place-items-center rounded-full text-foreground hover:bg-slate-50 transition-colors cursor-pointer"
            aria-label="Back"
            onClick={goBack}
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
          </button>
          <h2 className="text-[17px] font-bold tracking-tight">Edit transaction</h2>
          <button
            className="grid h-9 w-9 place-items-center rounded-full text-[var(--danger)] hover:bg-slate-50 transition-colors cursor-pointer"
            aria-label="Delete"
            onClick={() => navigate("delete_confirm")}
          >
            <Trash2 className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </header>

        <div className="mt-6 flex flex-col items-center">
          <div
            className="grid h-14 w-14 place-items-center rounded-2xl text-white shadow-[var(--shadow-tile)]"
            style={{
              background: "linear-gradient(135deg, oklch(0.65 0.22 265), oklch(0.45 0.24 265))",
            }}
          >
            <ShoppingBag className="h-6 w-6" strokeWidth={2.25} />
          </div>
          <div className="mt-3 flex items-center justify-center gap-1">
            <span className="text-[20px] font-bold text-muted-foreground">$</span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              className="w-40 bg-transparent text-center text-[34px] font-extrabold tracking-tight text-foreground outline-none border-b border-transparent focus:border-[var(--primary)]"
            />
          </div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">USD</p>
        </div>

        <div className="mt-5 space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Description
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-2xl bg-white px-4 py-3 text-[13px] font-semibold text-foreground shadow-[var(--shadow-soft)] outline-none border border-transparent focus:border-[var(--primary)]"
          />
        </div>

        <div className="mt-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Category
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {categoryOptions.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all active:scale-95 cursor-pointer ${
                  category === c
                    ? "bg-[var(--primary)] text-white"
                    : "bg-white text-foreground shadow-[var(--shadow-soft)]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          className="mt-auto w-full rounded-full bg-[oklch(0.18_0.04_265)] py-4 text-[15px] font-semibold text-white active:scale-95 transition-transform cursor-pointer"
        >
          Save changes
        </button>
      </div>
    </PhoneFrame>
  );
}
