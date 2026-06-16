import {
  ArrowLeft,
  Moon,
  Bell,
  Globe,
  Fingerprint,
  ChevronRight,
  Camera,
  Banknote,
} from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { ComingSoonBadge } from "./ComingSoonBadge";
import { useState } from "react";
import { useAppNavigation } from "@/lib/navigation";

export function SettingsScreen() {
  const {
    navigate,
    goBack,
    profile,
    household,
    currencies,
    setCurrencyTarget,
    faceIdEnabled,
    compactMoneyMode,
    setCompactMoneyMode,
    logout,
    theme,
    setTheme,
  } = useAppNavigation();
  const themes = ["light", "dark", "system"] as const;
  const themeIdx = themes.indexOf(theme);
  const [quietHours, setQuietHours] = useState(false);

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
          <h2 className="text-[17px] font-bold tracking-tight">Settings</h2>
          <span className="h-9 w-9" />
        </header>

        <div className="mt-5 flex flex-col items-center">
          <div className="relative">
            <div
              onClick={() => navigate("edit_profile")}
              className="grid h-20 w-20 place-items-center rounded-full text-white text-[22px] font-bold shadow-[var(--shadow-tile)] cursor-pointer active:scale-95 transition-transform"
              style={{
                background: "linear-gradient(135deg, oklch(0.65 0.22 265), oklch(0.45 0.24 265))",
              }}
            >
              {profile.initials}
            </div>
            <button
              onClick={() => navigate("edit_profile")}
              className="absolute bottom-0 right-0 grid h-7 w-7 place-items-center rounded-full bg-white text-[var(--primary)] shadow-[var(--shadow-soft)] hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
              aria-label="Change photo"
            >
              <Camera className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
          </div>
          <p
            onClick={() => navigate("edit_profile")}
            className="mt-3 text-[15px] font-bold text-foreground cursor-pointer hover:text-[var(--primary)] transition-colors"
          >
            {profile.name}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {household ? `${household.role} · ${household.name}` : "No household yet"}
          </p>
        </div>

        <p className="mt-6 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Appearance
        </p>
        <div className="mt-2 rounded-2xl bg-white p-1 shadow-[var(--shadow-soft)]">
          <div className="flex">
            {["Light", "Dark", "System"].map((m, i) => (
              <button
                key={m}
                onClick={() => setTheme(themes[i])}
                className={`flex-1 rounded-xl py-2 text-[12px] font-semibold active:scale-95 transition-all cursor-pointer ${
                  i === themeIdx
                    ? "bg-[var(--primary)] text-white shadow-sm"
                    : "text-muted-foreground hover:bg-slate-50"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Preferences
        </p>
        <div className="mt-2 space-y-2">
          {[
            {
              Icon: Globe,
              label: "Personal currency",
              value: currencies.personal,
              screen: "currency" as const,
              target: "personal" as const,
              comingSoon: false,
            },
            {
              Icon: Globe,
              label: "Family currency",
              value: currencies.family,
              screen: "currency" as const,
              target: "family" as const,
              comingSoon: false,
            },
            {
              Icon: Banknote,
              label: "Compact Money Mode",
              value: compactMoneyMode ? "On" : "Off",
              screen: "settings" as const,
              comingSoon: false,
              toggle: true,
            },
            {
              Icon: Bell,
              label: "Notifications",
              value: "All admins",
              screen: "notif_prefs" as const,
              comingSoon: false,
            },
            {
              Icon: Fingerprint,
              label: "Passcode & Face ID",
              value: faceIdEnabled ? "Enabled" : "PIN only",
              screen: "passcode" as const,
              comingSoon: true,
            },
            {
              Icon: Moon,
              label: "Quiet hours",
              value: quietHours ? "22:00 - 07:00" : "Off",
              screen: "settings" as const,
              comingSoon: true,
            },
          ].map((r) => (
            <div key={r.label} className="relative">
              <button
                onClick={() => {
                  if (r.comingSoon) return;
                  if ("toggle" in r) {
                    setCompactMoneyMode(!compactMoneyMode);
                    return;
                  }
                  if (r.label === "Quiet hours") {
                    setQuietHours((prev) => !prev);
                    return;
                  }
                  if ("target" in r && r.target) setCurrencyTarget(r.target as any);
                  navigate(r.screen);
                }}
                disabled={r.comingSoon}
                className={`w-full flex items-center gap-3 rounded-2xl px-3 py-3 text-left shadow-[var(--shadow-soft)] transition-colors active:scale-[0.99] ${
                  r.comingSoon
                    ? "bg-white/70 cursor-not-allowed"
                    : "bg-white hover:bg-slate-50 cursor-pointer"
                }`}
              >
                <div
                  className={`grid h-9 w-9 place-items-center rounded-xl ${
                    r.comingSoon
                      ? "bg-red-50 text-red-500"
                      : "bg-[oklch(0.95_0.04_265)] text-[var(--primary)]"
                  }`}
                >
                  <r.Icon className="h-4 w-4" strokeWidth={2.25} />
                </div>
                <div className="flex-1 leading-tight">
                  <p
                    className={`text-[12px] font-bold ${
                      r.comingSoon ? "text-red-500" : "text-foreground"
                    }`}
                  >
                    {r.label}
                  </p>
                  <p
                    className={`text-[10px] ${
                      r.comingSoon ? "text-red-400" : "text-muted-foreground"
                    }`}
                  >
                    {r.comingSoon ? "Coming soon" : r.value}
                  </p>
                </div>
                {"toggle" in r ? (
                  <span
                    className={`relative h-5 w-9 rounded-full transition-colors ${
                      compactMoneyMode ? "bg-[var(--primary)]" : "bg-input"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                        compactMoneyMode ? "translate-x-[18px]" : "translate-x-0.5"
                      }`}
                    />
                  </span>
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" strokeWidth={2.25} />
                )}
              </button>
              {r.comingSoon && <ComingSoonBadge />}
            </div>
          ))}
        </div>

        <button
          onClick={() => void logout()}
          className="mt-auto w-full rounded-full bg-[var(--muted)] py-3.5 text-[13px] font-semibold text-[var(--danger)] active:scale-95 transition-all hover:bg-red-50 cursor-pointer"
        >
          Log out
        </button>
      </div>
    </PhoneFrame>
  );
}
