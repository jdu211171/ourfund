import { ArrowLeft } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { useAppNavigation } from "@/lib/navigation";

const groups: { title: string; items: [string, string, boolean][] }[] = [
  {
    title: "Budget alerts",
    items: [
      ["Category at 80%", "When any category hits 80% of limit", true],
      ["Category over budget", "When a category exceeds 100%", true],
      ["Large transaction", "Expenses above $200", false],
    ],
  },
  {
    title: "Family activity",
    items: [
      ["New member expense", "When a family member logs spending", true],
      ["Transfer requests", "Kids requesting money transfers", true],
      ["Goal contributions", "When someone contributes to a goal", false],
    ],
  },
  {
    title: "Reminders & digests",
    items: [
      ["Daily digest", "Morning summary at 8:00am", true],
      ["Weekly report", "Sunday evening recap", true],
      ["Bill reminders", "3 days before recurring bills", true],
    ],
  },
];

export function NotificationPreferencesScreen() {
  const { goBack, notificationPrefs, toggleNotificationPref } = useAppNavigation();

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
          <h2 className="text-[17px] font-bold tracking-tight">Notifications</h2>
          <div className="w-9" />
        </header>

        <div className="mt-5 flex-1 space-y-4 overflow-hidden">
          {groups.map((g) => (
            <div key={g.title}>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                {g.title}
              </p>
              <div className="mt-2 rounded-2xl bg-white shadow-[var(--shadow-soft)]">
                {g.items.map(([k, d, on], i) => {
                  const enabled = notificationPrefs[k] ?? on;
                  return (
                    <button
                      key={k}
                      onClick={() => toggleNotificationPref(k)}
                      className={`flex w-full items-center justify-between px-4 py-2.5 text-left ${i < g.items.length - 1 ? "border-b border-[oklch(0.94_0.01_265)]" : ""}`}
                    >
                      <div className="leading-tight">
                        <p className="text-[12px] font-bold text-foreground">{k}</p>
                        <p className="text-[10px] text-muted-foreground">{d}</p>
                      </div>
                      <div
                        className={`h-5 w-9 rounded-full p-0.5 ${enabled ? "bg-[var(--primary)]" : "bg-[var(--muted)]"}`}
                      >
                        <div
                          className={`h-4 w-4 rounded-full bg-white shadow ${enabled ? "ml-4" : ""}`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PhoneFrame>
  );
}
