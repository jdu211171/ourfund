import { ArrowLeft, Plus, Calendar } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { useState } from "react";
import { useAppNavigation } from "@/lib/navigation";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function AllowanceScreen() {
  const { navigate, goBack, members, updateMember, scheduleAllowance } = useAppNavigation();
  const kids = members.filter((m) => m.role === "Teen" || m.role === "Kid");
  const [selectedKidId, setSelectedKidId] = useState(kids[0]?.id ?? "");
  const [newAmount, setNewAmount] = useState("15");
  const [selectedDayIdx, setSelectedDayIdx] = useState(6);

  const toggleKidAllowance = (idx: number) => {
    const kid = kids[idx];
    if (kid) updateMember(kid.id, { allowanceOn: !kid.allowanceOn });
  };

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
          <h2 className="text-[17px] font-bold tracking-tight">Allowance</h2>
          <button
            onClick={() => navigate("invite_member")}
            className="grid h-9 w-9 place-items-center rounded-full bg-[var(--muted)] hover:bg-slate-200 transition-colors cursor-pointer active:scale-95"
            aria-label="Add family member"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </header>

        <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Active
        </p>

        <div className="mt-2 space-y-2">
          {kids.map((k, idx) => (
            <button
              key={k.name}
              onClick={() => toggleKidAllowance(idx)}
              className="w-full text-left rounded-2xl bg-white p-3 shadow-[var(--shadow-soft)] hover:bg-slate-50 active:scale-[0.99] transition-all cursor-pointer block"
            >
              <div className="flex items-center gap-3">
                <div
                  className="grid h-10 w-10 place-items-center rounded-xl text-white text-[12px] font-bold"
                  style={{
                    background: idx % 2 === 0 ? "oklch(0.65 0.22 320)" : "oklch(0.65 0.22 200)",
                  }}
                >
                  {k.name[0]}
                </div>
                <div className="flex-1 leading-tight">
                  <p className="text-[12px] font-bold text-foreground">
                    {k.name.split(" ")[0]} ·{" "}
                    <span className="text-muted-foreground">{k.age ?? "child"}y</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Weekly · {k.allowanceDay ?? "Sun"} · tap to {k.allowanceOn ? "pause" : "resume"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-extrabold text-foreground">
                    ${k.allowanceUsd ?? 0}
                  </p>
                  <p
                    className={`text-[10px] font-semibold transition-colors ${k.allowanceOn ? "text-[var(--success)]" : "text-muted-foreground"}`}
                  >
                    {k.allowanceOn ? "On" : "Paused"}
                  </p>
                </div>
              </div>
            </button>
          ))}
          {kids.length === 0 && (
            <button
              onClick={() => navigate("invite_member")}
              className="w-full rounded-2xl bg-white px-4 py-5 text-center shadow-[var(--shadow-soft)]"
            >
              <p className="text-[13px] font-bold text-foreground">No kids or teens yet</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Invite a child account before scheduling allowance.
              </p>
            </button>
          )}
        </div>

        <div className="mt-5 rounded-3xl bg-white p-4 shadow-[var(--shadow-tile)] focus-within:ring-2 focus-within:ring-[var(--primary)] transition-all">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            New allowance
          </p>
          <div className="mt-2 flex gap-1">
            {kids.map((kid) => (
              <button
                key={kid.id}
                onClick={() => setSelectedKidId(kid.id)}
                className={`flex-1 rounded-xl py-1.5 text-[10px] font-semibold ${selectedKidId === kid.id ? "bg-[var(--primary)] text-white" : "bg-[var(--muted)] text-foreground"}`}
              >
                {kid.name.split(" ")[0]}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-end gap-2">
            <span className="pb-1 text-[18px] font-bold text-muted-foreground">$</span>
            <input
              type="text"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              className="w-20 bg-transparent text-[28px] font-extrabold tracking-tight text-foreground outline-none border-none p-0 focus:ring-0"
              placeholder="0"
            />
            <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
              <Calendar className="h-3 w-3" /> per week
            </span>
          </div>
          <div className="mt-3 flex justify-between gap-1">
            {days.map((d, i) => (
              <button
                key={d}
                onClick={() => setSelectedDayIdx(i)}
                className={`flex-1 rounded-xl py-1.5 text-[10px] font-semibold transition-all active:scale-90 cursor-pointer ${
                  i === selectedDayIdx
                    ? "bg-[var(--primary)] text-white shadow-sm"
                    : "bg-[var(--muted)] text-foreground hover:bg-slate-200"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            if (kids.length === 0) {
              navigate("invite_member");
              return;
            }
            const targetKidId = selectedKidId || kids[0]?.id;
            if (targetKidId)
              scheduleAllowance(targetKidId, parseFloat(newAmount || "0"), days[selectedDayIdx]);
            navigate("family");
          }}
          className="mt-auto w-full rounded-full bg-[oklch(0.18_0.04_265)] py-4 text-[15px] font-semibold text-white active:scale-95 transition-all cursor-pointer"
        >
          {kids.length === 0 ? "Invite child" : "Schedule allowance"}
        </button>
      </div>
    </PhoneFrame>
  );
}
