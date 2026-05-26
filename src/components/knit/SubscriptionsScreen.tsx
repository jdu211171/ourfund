import { ArrowLeft, Plus, Tv, Wifi, Zap, Music, Home } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { useAppNavigation } from "@/lib/navigation";

const icons = [Home, Zap, Wifi, Tv, Music];

export function SubscriptionsScreen() {
  const { goBack, addSubscription, subscriptions } = useAppNavigation();
  const total = subscriptions.reduce((sum, item) => sum + item.amountUsd, 0);

  return (
    <PhoneFrame>
      <div className="flex h-full flex-col px-7 pt-10 pb-7">
        <header className="flex items-center justify-between">
          <button
            onClick={goBack}
            className="grid h-9 w-9 place-items-center rounded-full text-foreground"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
          </button>
          <h2 className="text-[17px] font-bold tracking-tight">Recurring</h2>
          <button
            onClick={() => addSubscription()}
            className="grid h-9 w-9 place-items-center rounded-full bg-[var(--muted)]"
            aria-label="Add subscription"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </header>

        <div
          className="mt-5 rounded-3xl p-5 text-white shadow-[var(--shadow-soft)]"
          style={{
            background: "linear-gradient(135deg, oklch(0.45 0.24 265), oklch(0.65 0.22 265))",
          }}
        >
          <p className="text-[10px] uppercase tracking-widest text-white/60">Monthly recurring</p>
          <p className="mt-1 text-[28px] font-extrabold tracking-tight">
            ${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-white/70">Across {subscriptions.length} subscriptions</p>
        </div>

        <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Up next
        </p>

        <div className="mt-2 flex-1 space-y-2 overflow-hidden">
          {subscriptions.map((s, index) => {
            const Icon = icons[index % icons.length];
            const soon = s.every.includes("Due");
            return (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 shadow-[var(--shadow-soft)]"
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[oklch(0.95_0.04_265)] text-[var(--primary)]">
                  <Icon className="h-4 w-4" strokeWidth={2.25} />
                </div>
                <div className="flex-1 leading-tight">
                  <p className="text-[12px] font-bold text-foreground">{s.label}</p>
                  <p
                    className={`text-[10px] ${soon ? "text-[var(--danger)] font-semibold" : "text-muted-foreground"}`}
                  >
                    {s.every}
                  </p>
                </div>
                <p className="text-[12px] font-bold text-foreground">
                  ${s.amountUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
            );
          })}
          {subscriptions.length === 0 && (
            <button
              onClick={() => addSubscription()}
              className="w-full rounded-2xl bg-white px-4 py-5 text-center shadow-[var(--shadow-soft)]"
            >
              <p className="text-[13px] font-bold text-foreground">No recurring bills</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Add a subscription or bill to keep forecasts live.
              </p>
            </button>
          )}
        </div>
      </div>
    </PhoneFrame>
  );
}
