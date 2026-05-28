import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Check, Plus, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { currencyAdornment, currencyValueToUsd } from "@/lib/currency";
import { useAppNavigation, type LoanDirection, type LoanEntry } from "@/lib/navigation";
import { PhoneFrame } from "./PhoneFrame";
import { Money } from "./Money";
import { OptionSelect } from "./OptionSelect";

const tabs = ["All", "Lent", "Borrowed"] as const;

export function LendBorrowScreen() {
  const { goBack, loanEntries, members, currentMemberId, currency, addLoanEntry, updateLoanEntry } =
    useAppNavigation();
  const otherMembers = members.filter((member) => member.id !== currentMemberId);
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const [showForm, setShowForm] = useState(false);
  const [direction, setDirection] = useState<LoanDirection>("lent");
  const [memberId, setMemberId] = useState(otherMembers[0]?.id ?? "");
  const [counterpartyName, setCounterpartyName] = useState("");
  const [note, setNote] = useState("");
  const [due, setDue] = useState("Due next week");
  const [amount, setAmount] = useState("0");
  const selectedMember = otherMembers.find((member) => member.id === memberId);
  const amountUsd = currencyValueToUsd(parseFloat(amount || "0"), currency);
  const { prefix, suffix } = currencyAdornment(currency);

  const filteredEntries = useMemo(() => {
    if (tab === "Lent") return loanEntries.filter((entry) => entry.direction === "lent");
    if (tab === "Borrowed") return loanEntries.filter((entry) => entry.direction === "borrowed");
    return loanEntries;
  }, [loanEntries, tab]);

  const lent = filteredEntries.filter((entry) => entry.direction === "lent");
  const borrowed = filteredEntries.filter((entry) => entry.direction === "borrowed");
  const lentTotal = loanEntries
    .filter((entry) => entry.direction === "lent" && entry.status !== "paid")
    .reduce((sum, entry) => sum + entry.amountUsd, 0);
  const owedTotal = loanEntries
    .filter((entry) => entry.direction === "borrowed" && entry.status !== "paid")
    .reduce((sum, entry) => sum + entry.amountUsd, 0);

  const saveLoan = () => {
    if (amountUsd <= 0) return;
    addLoanEntry({
      counterpartyMemberId: selectedMember?.id ?? null,
      counterpartyName: selectedMember?.name ?? (counterpartyName.trim() || "Family member"),
      note: note.trim() || (direction === "lent" ? "Money lent" : "Money borrowed"),
      due: due.trim() || "No due date",
      amountUsd,
      direction,
      status: "pending",
    });
    setAmount("0");
    setNote("");
    setShowForm(false);
  };

  return (
    <PhoneFrame>
      <div className="flex-1 overflow-y-auto flex flex-col px-7 pt-10 pb-7 min-h-0">
        <header className="flex items-center justify-between">
          <button
            onClick={goBack}
            className="grid h-9 w-9 place-items-center rounded-full text-foreground"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
          </button>
          <h2 className="text-[17px] font-bold tracking-tight">Lend & Borrow</h2>
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="grid h-9 w-9 place-items-center rounded-full bg-[var(--primary)] text-white"
            aria-label="New loan"
          >
            <Plus className="h-4 w-4" strokeWidth={2.75} />
          </button>
        </header>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <SummaryTile label="You lent" usd={lentTotal} tone="success" direction="in" />
          <SummaryTile label="You owe" usd={owedTotal} tone="danger" direction="out" />
        </div>

        <div className="mt-4 inline-flex self-start rounded-full bg-[var(--muted)] p-1">
          {tabs.map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`rounded-full px-3.5 py-1.5 text-[11px] font-semibold ${
                item === tab
                  ? "bg-white text-foreground shadow-[var(--shadow-soft)]"
                  : "text-muted-foreground"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {showForm && (
          <div className="mt-3 rounded-3xl bg-white p-4 shadow-[var(--shadow-soft)]">
            <div className="grid grid-cols-2 gap-2">
              {(["lent", "borrowed"] as LoanDirection[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setDirection(item)}
                  className={`rounded-2xl py-2 text-[12px] font-semibold capitalize ${
                    direction === item
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--muted)] text-foreground"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="mt-3">
              {otherMembers.length > 0 ? (
                <OptionSelect
                  label="Person"
                  value={selectedMember?.id ?? ""}
                  options={otherMembers.map((member) => ({
                    value: member.id,
                    label: member.name,
                    description: member.role,
                  }))}
                  onChange={setMemberId}
                  icon={<UserRound className="h-5 w-5" strokeWidth={2.25} />}
                />
              ) : (
                <input
                  value={counterpartyName}
                  onChange={(event) => setCounterpartyName(event.target.value)}
                  className="w-full rounded-2xl bg-[var(--muted)] px-4 py-3 text-[13px] font-semibold outline-none"
                  placeholder="Person name"
                />
              )}
            </div>
            <div className="mt-3 grid grid-cols-[1fr_1.1fr] gap-2">
              <div className="flex items-center gap-1 rounded-2xl bg-[var(--muted)] px-3 py-2.5">
                {prefix && (
                  <span className="text-[13px] font-bold text-muted-foreground">{prefix}</span>
                )}
                <input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ""))}
                  className="min-w-0 flex-1 bg-transparent text-[16px] font-extrabold outline-none"
                  placeholder="0"
                />
                {suffix && (
                  <span className="text-[11px] font-bold text-muted-foreground">{suffix}</span>
                )}
              </div>
              <input
                value={due}
                onChange={(event) => setDue(event.target.value)}
                className="min-w-0 rounded-2xl bg-[var(--muted)] px-3 py-2.5 text-[12px] font-semibold outline-none"
                placeholder="Due date"
              />
            </div>
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="mt-2 w-full rounded-2xl bg-[var(--muted)] px-3 py-2.5 text-[12px] font-semibold outline-none"
              placeholder="Note"
            />
            <button
              type="button"
              onClick={saveLoan}
              disabled={amountUsd <= 0}
              className="mt-3 w-full rounded-full bg-[oklch(0.18_0.04_265)] py-3 text-[13px] font-semibold text-white disabled:opacity-50"
            >
              Save entry
            </button>
          </div>
        )}

        <div className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1">
          {(tab === "All" || tab === "Lent") && (
            <Group
              title="You lent"
              rows={lent}
              direction="in"
              onMarkPaid={(id) => updateLoanEntry(id, { status: "paid" })}
            />
          )}
          {(tab === "All" || tab === "Borrowed") && (
            <Group
              title="You borrowed"
              rows={borrowed}
              direction="out"
              onMarkPaid={(id) => updateLoanEntry(id, { status: "paid" })}
            />
          )}
          {filteredEntries.length === 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full rounded-2xl bg-white px-4 py-5 text-center shadow-[var(--shadow-soft)]"
            >
              <p className="text-[13px] font-bold text-foreground">No lend or borrow entries</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Add one to track who owes what.
              </p>
            </button>
          )}
        </div>
      </div>
    </PhoneFrame>
  );
}

function SummaryTile({
  label,
  usd,
  tone,
  direction,
}: {
  label: string;
  usd: number;
  tone: "success" | "danger";
  direction: "in" | "out";
}) {
  const Icon = direction === "in" ? ArrowDownLeft : ArrowUpRight;
  return (
    <div className="rounded-2xl bg-white p-3.5 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-1.5">
        <span
          className="grid h-5 w-5 place-items-center rounded-full"
          style={{
            background: direction === "in" ? "oklch(0.96 0.04 145)" : "oklch(0.96 0.05 25)",
            color: direction === "in" ? "var(--success)" : "var(--danger)",
          }}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2.75} />
        </span>
        <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
      </div>
      <div className="mt-1.5">
        <Money usd={usd} size="md" tone={tone} />
      </div>
    </div>
  );
}

function Group({
  title,
  rows,
  direction,
  onMarkPaid,
}: {
  title: string;
  rows: LoanEntry[];
  direction: "in" | "out";
  onMarkPaid: (id: string) => void;
}) {
  if (rows.length === 0) return null;

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      <div className="mt-2 space-y-2">
        {rows.map((row) => (
          <div
            key={row.id}
            className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 shadow-[var(--shadow-soft)]"
          >
            <div
              className="grid h-9 w-9 place-items-center rounded-xl text-[11px] font-bold"
              style={{
                background: direction === "in" ? "oklch(0.96 0.04 145)" : "oklch(0.96 0.05 25)",
                color: direction === "in" ? "var(--success)" : "var(--danger)",
              }}
            >
              {row.counterpartyName.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[12px] font-bold text-foreground">
                {row.counterpartyName}
              </p>
              <p className="truncate text-[10px] text-muted-foreground">
                {row.note} · {row.due}
              </p>
              {row.status !== "paid" && (
                <button
                  type="button"
                  onClick={() => onMarkPaid(row.id)}
                  className="mt-1 text-[9px] font-bold uppercase tracking-wider text-[var(--primary)]"
                >
                  Mark paid
                </button>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <Money
                usd={row.amountUsd}
                size="sm"
                tone={direction === "in" ? "success" : "danger"}
                signed
              />
              <StatusPill status={row.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: LoanEntry["status"] }) {
  const map = {
    pending: { bg: "oklch(0.96 0.03 90)", fg: "oklch(0.45 0.12 75)", label: "Pending" },
    overdue: { bg: "oklch(0.96 0.05 25)", fg: "var(--danger)", label: "Overdue" },
    paid: { bg: "oklch(0.96 0.04 145)", fg: "var(--success)", label: "Paid" },
  } as const;
  const item = map[status];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
      style={{ background: item.bg, color: item.fg }}
    >
      {status === "paid" && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
      {item.label}
    </span>
  );
}
