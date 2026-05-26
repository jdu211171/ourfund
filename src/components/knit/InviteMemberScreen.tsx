import { ArrowLeft, Mail, MessageSquare, Link2, Copy, Check } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { useState } from "react";
import { useAppNavigation } from "@/lib/navigation";

const roles = ["Admin", "Adult", "Teen", "Kid"];

export function InviteMemberScreen() {
  const { navigate, goBack, household, inviteMember } = useAppNavigation();
  const [selectedRoleIdx, setSelectedRoleIdx] = useState(2);
  const [copied, setCopied] = useState(false);
  const inviteCode = household?.inviteCode ?? "CREATE";

  const handleCopy = () => {
    if (household) void navigator.clipboard?.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendInvite = () => {
    if (!household) {
      navigate("signup");
      return;
    }
    inviteMember(roles[selectedRoleIdx] as "Admin" | "Adult" | "Teen" | "Kid");
    navigate("permissions");
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
          <h2 className="text-[17px] font-bold tracking-tight">Invite member</h2>
          <div className="w-9" />
        </header>

        <div className="mt-5 rounded-3xl bg-[var(--primary)] p-4 text-white shadow-[var(--shadow-tile)]">
          <p className="text-[11px] uppercase tracking-widest opacity-80">Household code</p>
          <div className="mt-1 flex items-center justify-between">
            <p className="font-display text-[26px] tracking-[0.2em]">{inviteCode}</p>
            <button
              onClick={handleCopy}
              className="grid h-9 w-9 place-items-center rounded-full bg-white/15 active:scale-95 transition-all cursor-pointer hover:bg-white/25"
              aria-label="Copy"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-300" strokeWidth={2.25} />
              ) : (
                <Copy className="h-4 w-4" strokeWidth={2.25} />
              )}
            </button>
          </div>
          <p className="text-[11px] opacity-80">
            {copied
              ? household
                ? "Copied code!"
                : "Create a household first"
              : household
                ? "Code expires in 7 days"
                : "Create a household to invite members"}
          </p>
        </div>

        <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Assign role
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {roles.map((r, i) => (
            <button
              key={r}
              onClick={() => setSelectedRoleIdx(i)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all cursor-pointer ${
                i === selectedRoleIdx
                  ? "bg-[var(--primary)] text-white shadow-md scale-105"
                  : "bg-white text-foreground shadow-[var(--shadow-soft)] hover:bg-slate-50 active:scale-95"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Send via
        </p>

        <div className="mt-2 space-y-2">
          {[
            { Icon: Mail, label: "Email invitation", sub: "Send to an email address" },
            { Icon: MessageSquare, label: "SMS / iMessage", sub: "Text the invite to a phone" },
            { Icon: Link2, label: "Share link", sub: "Copy a one-time invite link" },
          ].map((m) => (
            <button
              key={m.label}
              onClick={sendInvite}
              className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-3 shadow-[var(--shadow-soft)] hover:bg-slate-50 transition-colors active:scale-[0.98] cursor-pointer"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[oklch(0.95_0.04_265)] text-[var(--primary)]">
                <m.Icon className="h-4 w-4" strokeWidth={2.25} />
              </div>
              <div className="flex-1 text-left leading-tight">
                <p className="text-[12px] font-bold text-foreground">{m.label}</p>
                <p className="text-[10px] text-muted-foreground">{m.sub}</p>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={sendInvite}
          className="mt-auto w-full rounded-full bg-[oklch(0.18_0.04_265)] py-4 text-[15px] font-semibold text-white active:scale-95 transition-transform cursor-pointer"
        >
          {household ? "Send invite" : "Create household"}
        </button>
      </div>
    </PhoneFrame>
  );
}
