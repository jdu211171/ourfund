import { ArrowLeft, Users, Pencil, Plus, Minus, Trash2, DollarSign, Lock, PiggyBank, Check } from "lucide-react";
import { useState } from "react";
import { PhoneFrame } from "./PhoneFrame";
import { Money } from "./Money";
import { useAppNavigation } from "@/lib/navigation";
import { currencyFractionDigits, currencyValueToUsd, formatUsdAsCurrency, usdToCurrencyValue } from "@/lib/currency";

const COLOR_OPTIONS = [
  { name: "Purple", value: "oklch(0.55 0.24 265)" },
  { name: "Emerald", value: "oklch(0.62 0.18 145)" },
  { name: "Rose", value: "oklch(0.6 0.22 25)" },
  { name: "Blue", value: "oklch(0.5 0.2 240)" },
  { name: "Orange", value: "oklch(0.7 0.2 70)" },
  { name: "Dark", value: "oklch(0.3 0.05 265)" },
];

export function WalletDetailScreen() {
  const {
    selectedDetailWalletId,
    activeWallets,
    walletBalanceUsd,
    updateWallet,
    deleteWallet,
    addTransaction,
    goBack,
    currency,
  } = useAppNavigation();

  const wallet = activeWallets.find((w) => w.id === selectedDetailWalletId);
  const walletCurrency = wallet?.currency ?? currency;
  const formatBalanceInput = (usd: number) =>
    usdToCurrencyValue(usd, walletCurrency).toFixed(currencyFractionDigits(walletCurrency));

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(wallet?.label ?? "");
  const [editColor, setEditColor] = useState(wallet?.color ?? COLOR_OPTIONS[0].value);
  const [editStartingBalance, setEditStartingBalance] = useState(formatBalanceInput(wallet?.startingBalanceUsd ?? 0));

  // Adjust balance state
  const [adjustType, setAdjustType] = useState<"topup" | "withdraw" | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustNote, setAdjustNote] = useState("");

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!wallet) {
    return (
      <PhoneFrame>
        <div className="flex h-full flex-col items-center justify-center p-7 text-center">
          <p className="text-muted-foreground font-semibold">Wallet not found</p>
          <button
            onClick={goBack}
            className="mt-4 rounded-full bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-white cursor-pointer"
          >
            Go back
          </button>
        </div>
      </PhoneFrame>
    );
  }

  const currentBalance = walletBalanceUsd(wallet.label);

  const handleSaveEdit = () => {
    if (!editName.trim()) return;
    const balanceNum = parseFloat(editStartingBalance) || 0;
    updateWallet(wallet.id, {
      label: editName.trim(),
      color: editColor,
      startingBalanceUsd: currencyValueToUsd(balanceNum, wallet.currency),
    });
    setIsEditing(false);
  };

  const handleAdjustBalance = () => {
    const amountNum = parseFloat(adjustAmount) || 0;
    if (amountNum <= 0) return;

    const amountUsd = currencyValueToUsd(amountNum, wallet.currency);
    const usdVal = adjustType === "topup" ? amountUsd : -amountUsd;
    const defaultNote = adjustType === "topup" ? "Top up" : "Withdrawal";

    addTransaction({
      name: adjustNote.trim() || defaultNote,
      who: "Balance adjust",
      usd: usdVal,
      category: "Transfer",
      wallet: wallet.label,
      date: "today",
    });

    setAdjustType(null);
    setAdjustAmount("");
    setAdjustNote("");
  };

  const handleDelete = () => {
    deleteWallet(wallet.id);
    goBack();
  };

  return (
    <PhoneFrame>
      <div className="flex h-full flex-col px-7 pt-10 pb-7 overflow-y-auto">
        <header className="flex items-center justify-between">
          <button
            onClick={goBack}
            className="grid h-9 w-9 place-items-center rounded-full text-foreground hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
          </button>
          <h2 className="text-[17px] font-bold tracking-tight">Wallet details</h2>
          <button
            onClick={() => {
              if (isEditing) {
                handleSaveEdit();
              } else {
                setEditName(wallet.label);
                setEditColor(wallet.color);
                setEditStartingBalance(formatBalanceInput(wallet.startingBalanceUsd ?? 0));
                setIsEditing(true);
              }
            }}
            className={`grid h-9 w-9 place-items-center rounded-full transition-colors cursor-pointer ${
              isEditing ? "bg-[var(--primary)] text-white" : "bg-[var(--muted)] hover:bg-slate-100"
            }`}
            aria-label={isEditing ? "Save" : "Edit"}
          >
            {isEditing ? (
              <Check className="h-4 w-4" strokeWidth={2.5} />
            ) : (
              <Pencil className="h-4 w-4" strokeWidth={2.25} />
            )}
          </button>
        </header>

          {/* Wallet Summary Card */}
          <div className="mt-5 rounded-3xl bg-white p-5 shadow-[var(--shadow-soft)] border border-slate-100/50">
            <div className="flex items-center gap-3">
              <div
                className="grid h-12 w-12 place-items-center rounded-2xl transition-colors"
                style={{ background: "oklch(0.96 0.05 265)", color: wallet.color }}
              >
                {wallet.type === "private" ? (
                  <Lock className="h-5 w-5" strokeWidth={2.25} />
                ) : wallet.type === "connected" ? (
                  <PiggyBank className="h-5 w-5" strokeWidth={2.25} />
                ) : (
                  <Users className="h-5 w-5" strokeWidth={2.25} />
                )}
              </div>
              <div className="leading-tight min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                  {wallet.sub}
                </p>
                <p className="text-[16px] font-bold text-foreground truncate">{wallet.label}</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Current balance</p>
              <Money usd={currentBalance} size="xl" />
            </div>
          </div>

          {isEditing ? (
            /* Editing form block */
            <div className="mt-5 space-y-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Edit details</p>
              
              <div className="space-y-3 rounded-2xl bg-white p-4 shadow-[var(--shadow-soft)] border border-slate-100/50">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold block mb-1">
                    Wallet Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 px-3 py-2 text-[13px] font-semibold outline-none focus:ring-2 focus:ring-[var(--primary)] border-transparent"
                    placeholder="Wallet name"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold block mb-1">
                    Starting Balance ({wallet.currency})
                  </label>
                  <input
                    type="number"
                    value={editStartingBalance}
                    onChange={(e) => setEditStartingBalance(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 px-3 py-2 text-[13px] font-semibold outline-none focus:ring-2 focus:ring-[var(--primary)] border-transparent"
                    placeholder="0.00"
                    step="any"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold block mb-2">
                    Theme Color
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setEditColor(c.value)}
                        className="h-8 w-8 rounded-full cursor-pointer relative flex items-center justify-center transition-transform hover:scale-110"
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      >
                        {editColor === c.value && (
                          <Check className="h-4 w-4 text-white drop-shadow" strokeWidth={3} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 rounded-2xl bg-slate-100 py-3 text-[13px] font-bold text-foreground cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 rounded-2xl bg-[var(--primary)] py-3 text-[13px] font-bold text-white cursor-pointer hover:opacity-90 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            /* Regular details view */
            <>
              <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Wallet details</p>
              <div className="mt-2 space-y-2">
                <Row label="Name" value={wallet.label} />
                <Row label="Currency" value={wallet.currency} icon={<DollarSign className="h-4 w-4" strokeWidth={2.25} />} />
                <Row label="Type" value={wallet.sub} />
                <Row label="Starting balance" value={formatUsdAsCurrency(wallet.startingBalanceUsd ?? 0, wallet.currency)} />
              </div>

              {/* Adjust Balance Forms */}
              <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Adjust balance</p>
              {adjustType ? (
                <div className="mt-2 rounded-2xl bg-white p-4 shadow-[var(--shadow-soft)] border border-slate-100/50 animate-in slide-in-from-top-4 duration-200">
                  <h3 className="text-[12px] font-bold text-foreground mb-3">
                    {adjustType === "topup" ? "Top up wallet" : "Withdraw from wallet"}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold block mb-1">
                        Amount ({wallet.currency})
                      </label>
                      <input
                        type="number"
                        value={adjustAmount}
                        onChange={(e) => setAdjustAmount(e.target.value)}
                        className="w-full rounded-xl bg-slate-50 px-3 py-2 text-[13px] font-semibold outline-none focus:ring-2 focus:ring-[var(--primary)] border-transparent"
                        placeholder="0.00"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold block mb-1">
                        Note / Description
                      </label>
                      <input
                        type="text"
                        value={adjustNote}
                        onChange={(e) => setAdjustNote(e.target.value)}
                        className="w-full rounded-xl bg-slate-50 px-3 py-2 text-[13px] font-semibold outline-none focus:ring-2 focus:ring-[var(--primary)] border-transparent"
                        placeholder={adjustType === "topup" ? "e.g. Deposit" : "e.g. Cash out"}
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => setAdjustType(null)}
                        className="flex-1 rounded-xl bg-slate-100 py-2 text-[12px] font-semibold text-foreground cursor-pointer hover:bg-slate-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAdjustBalance}
                        className={`flex-1 rounded-xl py-2 text-[12px] font-semibold text-white cursor-pointer transition-colors ${
                          adjustType === "topup" ? "bg-[var(--success)]" : "bg-[var(--danger)]"
                        }`}
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAdjustType("topup")}
                    className="flex flex-col items-start gap-1 rounded-2xl bg-white p-3 shadow-[var(--shadow-soft)] hover:bg-slate-50 active:scale-[0.98] transition-all cursor-pointer border border-slate-100/50 text-left"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-full" style={{ background: "oklch(0.96 0.04 145)", color: "var(--success)" }}>
                      <Plus className="h-4 w-4" strokeWidth={2.5} />
                    </span>
                    <span className="text-[12px] font-bold text-foreground mt-1">Top up</span>
                    <span className="text-[10px] text-muted-foreground">Add money to wallet</span>
                  </button>
                  <button
                    onClick={() => setAdjustType("withdraw")}
                    className="flex flex-col items-start gap-1 rounded-2xl bg-white p-3 shadow-[var(--shadow-soft)] hover:bg-slate-50 active:scale-[0.98] transition-all cursor-pointer border border-slate-100/50 text-left"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-full" style={{ background: "oklch(0.96 0.05 25)", color: "var(--danger)" }}>
                      <Minus className="h-4 w-4" strokeWidth={2.5} />
                    </span>
                    <span className="text-[12px] font-bold text-foreground mt-1">Withdraw</span>
                    <span className="text-[10px] text-muted-foreground">Take money out</span>
                  </button>
                </div>
              )}

              {/* Deletion block */}
              {showDeleteConfirm ? (
                <div className="mt-6 rounded-2xl bg-[oklch(0.97_0.02_25)] p-4 border border-[var(--danger)]/20 animate-in zoom-in-95 duration-200">
                  <h3 className="text-[13px] font-bold text-[var(--danger)] mb-1">Delete this wallet?</h3>
                  <p className="text-[11px] text-muted-foreground mb-4">
                    This will permanently delete the wallet and all transactions recorded under it. This action cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 rounded-xl bg-white border border-slate-200 py-2 text-[12px] font-semibold text-foreground cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex-1 rounded-xl bg-[var(--danger)] py-2 text-[12px] font-semibold text-white cursor-pointer hover:opacity-90 transition-colors"
                    >
                      Delete Permanently
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-[oklch(0.97_0.02_25)] py-3 text-[12px] font-bold text-[var(--danger)] hover:bg-[oklch(0.94_0.03_25)] transition-colors cursor-pointer w-full"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={2.25} />
                  Delete wallet
                </button>
              )}
            </>
          )}
      </div>
    </PhoneFrame>
  );
}

function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white px-3 py-3 shadow-[var(--shadow-soft)] border border-slate-100/50">
      {icon && (
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--muted)] text-muted-foreground shrink-0">
          {icon}
        </div>
      )}
      <div className="flex-1 leading-tight min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{label}</p>
        <p className="text-[13px] font-bold text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}
