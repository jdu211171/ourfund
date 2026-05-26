import { ArrowLeft, AlertTriangle, Target, Calendar, Users } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { useAppNavigation, type NotificationTone } from "@/lib/navigation";

const toneClass: Record<NotificationTone, string> = {
  success: "bg-[oklch(0.95_0.08_150)] text-[var(--success)]",
  danger: "bg-[oklch(0.96_0.05_20)] text-[var(--danger)]",
  warn: "bg-[oklch(0.96_0.08_85)] text-[oklch(0.55_0.15_75)]",
  primary: "bg-[oklch(0.95_0.04_265)] text-[var(--primary)]",
};

const iconFor: Record<NotificationTone, typeof AlertTriangle> = {
  success: Target,
  danger: AlertTriangle,
  warn: Calendar,
  primary: Users,
};

export function NotificationsScreen() {
  const { goBack, navigate, notifications, markAllNotificationsRead, markNotificationRead } =
    useAppNavigation();
  const groups = notifications.reduce<Record<string, typeof notifications>>((acc, notification) => {
    acc[notification.group] = [...(acc[notification.group] ?? []), notification];
    return acc;
  }, {});

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
          <h2 className="text-[17px] font-bold tracking-tight">Alerts</h2>
          <button
            onClick={markAllNotificationsRead}
            className="text-[11px] font-semibold text-[var(--primary)]"
          >
            Mark all
          </button>
        </header>

        <div className="mt-5 flex-1 space-y-5 overflow-y-auto">
          {Object.entries(groups).map(([label, items]) => (
            <div key={label}>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                {label}
              </p>
              <div className="mt-2 space-y-2">
                {items.map((n) => {
                  const Icon = iconFor[n.tone];
                  return (
                    <button
                      key={n.id}
                      onClick={() => {
                        markNotificationRead(n.id);
                        navigate(n.screen);
                      }}
                      className={`flex w-full items-start gap-3 rounded-2xl bg-white px-3 py-3 text-left shadow-[var(--shadow-soft)] ${n.read ? "opacity-70" : ""}`}
                    >
                      <div
                        className={`grid h-10 w-10 place-items-center rounded-xl ${toneClass[n.tone]}`}
                      >
                        <Icon className="h-4 w-4" strokeWidth={2.25} />
                      </div>
                      <div className="flex-1 leading-tight">
                        <p className="text-[12px] font-bold text-foreground">{n.title}</p>
                        <p className="text-[10px] text-muted-foreground">{n.desc}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{n.time}</span>
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
