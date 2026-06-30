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
  Users,
} from "lucide-react";
import { PhoneFrame, useFrameMode } from "./PhoneFrame";
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

  const mode = useFrameMode();

  const toggleRemoval = (memberId: string) => {
    setSelectedMemberIds(
      selectedMemberIds.includes(memberId)
        ? selectedMemberIds.filter((id) => id !== memberId)
        : [...selectedMemberIds, memberId],
    );
  };

  if (mode === "web") {
    return (
      <div className="space-y-6">
        {/* Title row */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[12px] uppercase tracking-widest text-muted-foreground">Household</p>
            <h1 className="font-display text-[34px] leading-none tracking-tight text-foreground">
              Family
            </h1>
            <p className="mt-1.5 text-[13px] text-muted-foreground">
              {household ? (
                <>
                  <span className="font-semibold text-[var(--primary)]">{household.name}</span>
                  {" · "}Invite code:{" "}
                  <span className="font-bold text-foreground">{household.inviteCode}</span>
                </>
              ) : (
                "Create or join a household to manage your family's finances together."
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("invite_member")}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-[12px] font-bold text-white shadow-[0_12px_30px_-12px_oklch(0.55_0.24_265/0.7)] transition hover:opacity-90 cursor-pointer"
            >
              <UserPlus className="h-4 w-4" strokeWidth={2.5} />
              Invite member
            </button>
            <button
              onClick={() => navigate("settings")}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--card)] px-3.5 py-2.5 text-[12px] font-semibold text-foreground border border-[var(--border)] transition hover:bg-[var(--muted)]/50"
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Members list */}
          <div className="lg:col-span-2 space-y-6">
            <section className="rounded-2xl bg-[var(--card)] border border-[var(--border)] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Members ({members.length})
                </p>
                {selectedMemberIds.length > 0 && (
                  <button
                    onClick={() => navigate("remove_member")}
                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--danger)] hover:opacity-80 cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Remove {selectedMemberIds.length} selected
                  </button>
                )}
              </div>
              <div className="divide-y divide-[var(--border)]">
                {members.map((m) => {
                  const removalSelected = selectedMemberIds.includes(m.id);
                  const canRemove = m.id !== currentMemberId;
                  return (
                    <div key={m.id} className="flex items-center gap-4 px-6 py-4">
                      <button
                        type="button"
                        disabled={!canRemove}
                        onClick={() => toggleRemoval(m.id)}
                        className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                          removalSelected
                            ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                            : "border-[var(--border)]"
                        } disabled:opacity-30`}
                        aria-label={`Select ${m.name} for removal`}
                      >
                        {removalSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                      </button>
                      <div
                        className="grid h-10 w-10 place-items-center rounded-full text-white text-[12px] font-bold shrink-0"
                        style={{
                          background:
                            "linear-gradient(135deg, oklch(0.65 0.22 265), oklch(0.45 0.24 265))",
                        }}
                      >
                        {m.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-foreground flex items-center gap-2">
                          {m.name}
                          {m.admin && (
                            <Crown
                              className="h-3.5 w-3.5 text-[oklch(0.75_0.15_85)]"
                              strokeWidth={2.25}
                            />
                          )}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {m.role}
                          {m.allowanceUsd
                            ? ` · ${formatUsdAsCurrency(m.allowanceUsd, currency)} allowance`
                            : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMemberId(m.id);
                            setBudgetMode("personal");
                            navigate("wallet");
                          }}
                          className="text-[11px] font-semibold text-[var(--primary)] hover:opacity-80 cursor-pointer"
                        >
                          View wallet
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMemberId(m.id);
                            navigate("permissions");
                          }}
                          className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--muted)] text-muted-foreground hover:text-foreground transition"
                          aria-label={`Edit ${m.name} permissions`}
                        >
                          <Shield className="h-4 w-4" strokeWidth={2.25} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {members.length === 0 && (
                  <div className="px-6 py-10 text-center">
                    <Users
                      className="h-8 w-8 text-muted-foreground mx-auto mb-3"
                      strokeWidth={1.5}
                    />
                    <p className="text-[13px] font-bold text-foreground">No members yet</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      Create a household or join one with an invite code.
                    </p>
                    <button
                      onClick={() => navigate("signup")}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-[12px] font-bold text-white cursor-pointer"
                    >
                      Get started
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Household tools sidebar */}
          <aside className="space-y-4">
            <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--border)]">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Household tools
                </p>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {items.map(({ Icon, label, hint, screen }) => (
                  <button
                    key={label}
                    onClick={() => navigate(screen)}
                    className="flex w-full items-center gap-3 px-6 py-3.5 text-left transition hover:bg-[var(--muted)]/40 cursor-pointer"
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-[oklch(0.95_0.04_265)] text-[var(--primary)] shrink-0">
                      <Icon className="h-4 w-4" strokeWidth={2.25} />
                    </div>
                    <span className="flex-1 text-[13px] font-bold text-foreground">{label}</span>
                    <span className="text-[11px] text-muted-foreground">{hint}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" strokeWidth={2.25} />
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <PhoneFrame>
      <div className="flex-1 overflow-y-auto px-7 pt-10 pb-28 min-h-0">
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
                  className="-m-2 flex min-w-0 flex-1 items-center gap-3 rounded-2xl p-2 text-left"
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
              className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-1 text-left shadow-[var(--shadow-soft)] hover:bg-slate-50 transition-colors cursor-pointer"
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
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--muted)] py-3 text-[13px] font-semibold text-[var(--danger)] disabled:opacity-50"
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
