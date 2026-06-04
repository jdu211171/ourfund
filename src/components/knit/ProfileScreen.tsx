import {
  ChevronRight,
  Shield,
  Bell,
  Tag,
  HelpCircle,
  LogOut,
  Settings,
  Crown,
  UserPlus,
  Check,
} from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { BottomNav } from "./BottomNav";
import { useAppNavigation } from "@/lib/navigation";
import { formatUsdAsCurrency } from "@/lib/currency";

const items = [
  { Icon: Tag, label: "Categories", hint: "Budget limits", screen: "categories" as const },
  { Icon: Shield, label: "Permissions", hint: "Roles", screen: "permissions" as const },
  { Icon: Bell, label: "Alert thresholds", hint: "80% / 100%", screen: "notif_prefs" as const },
  { Icon: HelpCircle, label: "Allowance", hint: "Kids", screen: "allowance" as const },
];

export function ProfileScreen() {
  const {
    navigate,
    household,
    members,
    currentMemberId,
    selectedMemberId,
    setSelectedMemberId,
    selectedMemberIds,
    setSelectedMemberIds,
    setBudgetMode,
    currency,
  } = useAppNavigation();

  const toggleRemoval = (memberId: string) => {
    setSelectedMemberIds(
      selectedMemberIds.includes(memberId)
        ? selectedMemberIds.filter((id) => id !== memberId)
        : [...selectedMemberIds, memberId],
    );
  };

  return (
    <PhoneFrame>
      <div className="flex-1 overflow-y-auto flex flex-col px-7 pt-10 pb-28 min-h-0">
        <header className="flex items-center justify-between">
          <h2 className="text-[18px] font-extrabold tracking-tight text-[oklch(0.2_0.08_265)]">
            Family
          </h2>
          <button
            onClick={() => navigate("settings")}
            className="grid h-9 w-9 place-items-center rounded-full bg-[var(--muted)] hover:bg-slate-200 transition-colors active:scale-95 cursor-pointer"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </header>

        <div className="rounded-2xl bg-white p-4 shadow-[var(--shadow-soft)]">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Household</p>
          <p className="mt-1 font-display text-[22px] leading-tight tracking-tight">
            {household?.name ?? "Create or join a household"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {household ? (
              <>
                {members.length} members · Invite code{" "}
                <span className="font-bold text-foreground">{household.inviteCode}</span>
              </>
            ) : (
              "Start a household to invite your family."
            )}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[13px] font-bold text-foreground">Members</p>
          <button
            onClick={() => navigate("invite_member")}
            className="grid h-8 w-8 place-items-center rounded-full bg-[var(--muted)] text-foreground"
          >
            <UserPlus className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>

        <div className="mt-1 space-y-1">
          {members.map((m) => {
            const removalSelected = selectedMemberIds.includes(m.id);
            const canRemove = m.id !== currentMemberId;
            return (
              <div
                key={m.id}
                className={`flex w-full items-center gap-3 rounded-2xl bg-white py-2.5 text-left shadow-[var(--shadow-soft)] ${selectedMemberId === m.id ? "ring-2 ring-[var(--primary)]" : ""}`}
              >
                <button
                  type="button"
                  disabled={!canRemove}
                  onClick={() => toggleRemoval(m.id)}
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${
                    removalSelected
                      ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                      : "border-slate-300 bg-white"
                  } disabled:opacity-40`}
                  aria-label={`Select ${m.name} for removal`}
                >
                  {removalSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMemberId(m.id);
                    setBudgetMode("personal");
                    navigate("wallet");
                  }}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <div
                    className="grid h-10 w-10 place-items-center rounded-full text-white text-[12px] font-bold"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.65 0.22 265), oklch(0.45 0.24 265))",
                    }}
                  >
                    {m.initials}
                  </div>
                  <div className="flex-1 leading-tight">
                    <p className="text-[12px] font-bold text-foreground">{m.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {m.role}
                      {m.allowanceUsd
                        ? ` · ${formatUsdAsCurrency(m.allowanceUsd, currency)} allowance`
                        : ""}
                    </p>
                  </div>
                </button>
                {m.admin && (
                  <Crown className="h-4 w-4 text-[oklch(0.75_0.15_85)]" strokeWidth={2.25} />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMemberId(m.id);
                    navigate("permissions");
                  }}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--muted)] text-muted-foreground"
                  aria-label={`Edit ${m.name} permissions`}
                >
                  <Shield className="h-4 w-4" strokeWidth={2.25} />
                </button>
              </div>
            );
          })}
          {members.length === 0 && (
            <button
              onClick={() => navigate("signup")}
              className="w-full rounded-2xl bg-white px-4 py-5 text-center shadow-[var(--shadow-soft)]"
            >
              <p className="text-[13px] font-bold text-foreground">No members yet</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Create a household or join one with an invite code.
              </p>
            </button>
          )}
        </div>

        <div className="mt-4 space-y-2">
          {items.map(({ Icon, label, hint, screen }) => (
            <button
              key={label}
              onClick={() => navigate(screen)}
              className="flex w-full items-center gap-3 rounded-2xl bg-white py-1 text-left shadow-[var(--shadow-soft)] hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[oklch(0.95_0.04_265)] text-[var(--primary)]">
                <Icon className="h-4 w-4" strokeWidth={2.25} />
              </div>
              <span className="flex-1 text-[13px] font-bold text-foreground">{label}</span>
              <span className="text-[11px] text-muted-foreground">{hint}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" strokeWidth={2.25} />
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate("remove_member")}
          disabled={selectedMemberIds.length === 0}
          className="mt-4 flex items-center justify-center gap-2 rounded-full bg-[var(--muted)] py-3 text-[13px] font-semibold text-[var(--danger)] disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" strokeWidth={2.25} />
          {selectedMemberIds.length > 0
            ? `Remove ${selectedMemberIds.length} selected`
            : "Select members to remove"}
        </button>
      </div>
      <BottomNav active="user" />
    </PhoneFrame>
  );
}
