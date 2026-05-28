import { ArrowLeft, Upload, Camera, Share2 } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { useAppNavigation } from "@/lib/navigation";
import { useState } from "react";
import { Money } from "./Money";

export function ReceiptScreen() {
  const { navigate, goBack, selectedTransactionId, transactions } = useAppNavigation();
  const [status, setStatus] = useState("imported receipt");
  const txn =
    transactions.find((t) => t.id === selectedTransactionId) ?? transactions.find((t) => t.usd < 0);

  if (!txn) {
    return (
      <PhoneFrame>
        <div className="flex h-full flex-col px-7 pt-10 pb-7">
          <header className="flex items-center justify-between">
            <button
              onClick={goBack}
              className="grid h-9 w-9 place-items-center rounded-full"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
            </button>
            <h2 className="text-[17px] font-bold tracking-tight">Receipt</h2>
            <span className="h-9 w-9" />
          </header>
          <button
            onClick={() => navigate("add_expense")}
            className="m-auto rounded-3xl bg-white px-5 py-6 text-center shadow-[var(--shadow-soft)]"
          >
            <p className="text-[14px] font-bold text-foreground">No receipt yet</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Add an expense, then attach or scan its receipt.
            </p>
          </button>
        </div>
      </PhoneFrame>
    );
  }

  const total = Math.abs(txn.usd);
  const merchant = txn.name;

  return (
    <PhoneFrame>
      <div className="flex h-full flex-col px-7 pt-10 pb-7">
        <header className="flex items-center justify-between">
          <button
            onClick={goBack}
            className="grid h-9 w-9 place-items-center rounded-full"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
          </button>
          <h2 className="text-[17px] font-bold tracking-tight">Receipt</h2>
          <button
            onClick={() => setStatus("shared with family")}
            className="grid h-9 w-9 place-items-center rounded-full"
            aria-label="Share"
          >
            <Share2 className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </header>

        <div className="mt-5 rounded-3xl bg-white p-5 shadow-[var(--shadow-tile)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-[20px] tracking-tight text-foreground">{merchant}</p>
              <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
                {txn?.date ?? "today"} · {status}
              </p>
            </div>
            <span className="rounded-full bg-[var(--muted)] px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Paid
            </span>
          </div>

          <div className="my-4 h-px bg-[var(--muted)]" />

          <div className="space-y-2 text-[12px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{txn.category}</span>
              <Money usd={total} size="sm" />
            </div>
            <div className="mt-4 flex justify-between rounded-2xl bg-[var(--muted)] px-3 py-2.5 text-[13px]">
              <span className="font-bold text-foreground">Total</span>
              <Money usd={total} size="md" />
            </div>
          </div>
        </div>

        <div className="mt-auto flex gap-3">
          <button
            onClick={() => setStatus("replacement uploaded")}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--muted)] py-3 text-[13px] font-semibold text-foreground"
          >
            <Upload className="h-4 w-4" strokeWidth={2.25} /> Replace
          </button>
          <button
            onClick={() => navigate("scan_receipt")}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[oklch(0.18_0.04_265)] py-3 text-[13px] font-semibold text-white"
          >
            <Camera className="h-4 w-4" strokeWidth={2.25} /> Scan new
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}
