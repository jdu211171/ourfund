import { ArrowLeft, Plane, Plus, MoreHorizontal } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { useAppNavigation } from "@/lib/navigation";
import { useState } from "react";

export function GoalDetailScreen() {
  const { navigate, goBack, goals, selectedGoalId, setSelectedGoalId, contributeToGoal } =
    useAppNavigation();
  const goal = goals.find((g) => g.id === selectedGoalId) ?? goals[0];
  const [contribution, setContribution] = useState("100");

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
            <h2 className="text-[17px] font-bold tracking-tight">Goal Details</h2>
            <span className="h-9 w-9" />
          </header>

          <div className="m-auto rounded-3xl bg-white px-5 py-6 text-center shadow-[var(--shadow-soft)]">
            <p className="text-[14px] font-bold text-foreground">No goal selected</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Create a savings goal to track contributions.
            </p>
            <button
              onClick={() => navigate("new_goal")}
              className="mt-4 rounded-full bg-[var(--primary)] px-5 py-2.5 text-[12px] font-semibold text-white"
            >
              Create goal
            </button>
          </div>
        </div>
      </PhoneFrame>
    );
  }

  const pct = Math.min(100, Math.round((goal.savedUsd / goal.targetUsd) * 100));
  const monthly = Math.max(1, Math.ceil((goal.targetUsd - goal.savedUsd) / 6));

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
          <h2 className="text-[17px] font-bold tracking-tight">Goal Details</h2>
          <button
            onClick={() => navigate("goal_withdraw")}
            className="grid h-9 w-9 place-items-center rounded-full text-foreground hover:bg-slate-50 transition-colors cursor-pointer"
            aria-label="Withdraw options"
          >
            <MoreHorizontal className="h-5 w-5" strokeWidth={2.25} />
          </button>
        </header>

        <div
          className="mt-5 overflow-hidden rounded-3xl p-5 text-white shadow-[var(--shadow-soft)]"
          style={{
            background: "linear-gradient(135deg, oklch(0.45 0.24 265), oklch(0.65 0.22 265))",
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/60">{goal.title}</p>
              <p className="mt-1 text-[26px] font-extrabold tracking-tight">
                ${goal.savedUsd.toLocaleString()}{" "}
                <span className="text-[14px] font-medium text-white/70">
                  of ${goal.targetUsd.toLocaleString()}
                </span>
              </p>
            </div>
            <Plane className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-white" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-white/80">
            <span>{pct}% saved</span>
            <span>Target · {goal.targetDate}</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            { l: "Monthly", v: `$${monthly.toLocaleString()}` },
            { l: "Saved", v: `$${goal.savedUsd.toLocaleString()}` },
            {
              l: "Remaining",
              v: `$${Math.max(0, goal.targetUsd - goal.savedUsd).toLocaleString()}`,
            },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl bg-white py-3 shadow-[var(--shadow-soft)]">
              <p className="text-[10px] text-muted-foreground">{s.l}</p>
              <p className="mt-0.5 text-[13px] font-extrabold text-foreground">{s.v}</p>
            </div>
          ))}
        </div>

        <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Contributions
        </p>

        <div className="mt-2 flex-1 space-y-2 overflow-hidden">
          {goal.history.map((h) => (
            <div
              key={h.id}
              className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2 shadow-[var(--shadow-soft)]"
            >
              <div
                className="grid h-9 w-9 place-items-center rounded-full text-white text-[11px] font-bold"
                style={{
                  background: "linear-gradient(135deg, oklch(0.65 0.22 265), oklch(0.45 0.24 265))",
                }}
              >
                {h.initials}
              </div>
              <div className="flex-1 leading-tight">
                <p className="text-[12px] font-bold text-foreground">{h.who}</p>
                <p className="text-[10px] text-muted-foreground">{h.date}</p>
              </div>
              <p
                className={`text-[12px] font-bold ${h.amountUsd >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}
              >
                {h.amountUsd >= 0 ? "+" : "-"} ${Math.abs(h.amountUsd).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-2xl bg-white px-4 py-3 shadow-[var(--shadow-soft)]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Add contribution
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[14px] font-bold text-muted-foreground">$</span>
            <input
              value={contribution}
              onChange={(e) => setContribution(e.target.value.replace(/[^0-9.]/g, ""))}
              className="flex-1 bg-transparent text-[18px] font-extrabold text-foreground outline-none"
            />
          </div>
        </div>

        <button
          onClick={() => {
            contributeToGoal(goal.id, parseFloat(contribution || "0"));
            setSelectedGoalId(goal.id);
            if (goal.savedUsd + parseFloat(contribution || "0") >= goal.targetUsd)
              navigate("goal_achieved");
          }}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] py-4 text-[15px] font-semibold text-white active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Add contribution
        </button>
      </div>
    </PhoneFrame>
  );
}
