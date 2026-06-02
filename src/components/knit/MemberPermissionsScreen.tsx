import { ArrowLeft, Shield } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { useState } from "react";
import { useAppNavigation } from "@/lib/navigation";

const roles = [
  { name: "Admin", desc: "Full control" },
  { name: "Adult", desc: "Manage wallets & goals" },
  { name: "Teen", desc: "Log expenses, view shared budgets" },
  { name: "Kid", desc: "Read-only access" },
];

const initialPerms = [
  { name: "Approve children's requests", on: true },
  { name: "Edit budget limits", on: true },
  { name: "Add or remove members", on: false },
  { name: "View private wallets", on: false },
];

export function MemberPermissionsScreen() {
  const { navigate, goBack, members, selectedMemberId, updateMember, updateMemberPermission } =
    useAppNavigation();
  const member = members.find((m) => m.id === selectedMemberId) ?? members[1] ?? members[0];
  const [selectedRoleIdx, setSelectedRoleIdx] = useState(
    Math.max(
      0,
      roles.findIndex((r) => r.name === member?.role),
    ),
  );
  const [perms, setPerms] = useState(
    initialPerms.map((perm) => ({ ...perm, on: member?.permissions[perm.name] ?? perm.on })),
  );

  const togglePerm = (idx: number) => {
    setPerms((prev) => prev.map((p, i) => (i === idx ? { ...p, on: !p.on } : p)));
    if (member) updateMemberPermission(member.id, perms[idx].name, !perms[idx].on);
  };

  if (!member) {
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
            <h2 className="text-[17px] font-bold tracking-tight">Permissions</h2>
            <span className="h-9 w-9" />
          </header>
          <button
            onClick={() => navigate("invite_member")}
            className="m-auto rounded-3xl bg-white px-5 py-6 text-center shadow-[var(--shadow-soft)]"
          >
            <p className="text-[14px] font-bold text-foreground">No member selected</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Invite a member before editing permissions.
            </p>
          </button>
        </div>
      </PhoneFrame>
    );
  }

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
          <h2 className="text-[17px] font-bold tracking-tight">Permissions</h2>
          <div className="w-9" />
        </header>

        <div className="mt-5 flex items-center gap-3 rounded-3xl bg-white p-4 shadow-[var(--shadow-soft)]">
          <div className="h-12 w-12 rounded-2xl bg-[oklch(0.92_0.06_30)] flex items-center justify-center font-display font-extrabold text-[var(--danger)]">
            {member.initials}
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-bold text-foreground">{member.name}</p>
            <p className="text-[10px] text-muted-foreground">{member.email}</p>
          </div>
          <span className="rounded-full bg-[oklch(0.95_0.04_265)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--primary)]">
            {roles[selectedRoleIdx].name}
          </span>
        </div>

        <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Role
        </p>
        <div className="mt-2 space-y-1.5">
          {roles.map((r, i) => {
            const isSelected = i === selectedRoleIdx;
            return (
              <button
                key={r.name}
                onClick={() => {
                  setSelectedRoleIdx(i);
                  updateMember(member.id, {
                    role: r.name as "Admin" | "Adult" | "Teen" | "Kid",
                    admin: r.name === "Admin",
                  });
                }}
                className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left transition-all active:scale-[0.99] cursor-pointer ${
                  isSelected
                    ? "bg-[var(--primary)] text-white shadow-md"
                    : "bg-white shadow-[var(--shadow-soft)] hover:bg-slate-50"
                }`}
              >
                <div className="leading-tight">
                  <p
                    className={`text-[12px] font-bold ${isSelected ? "text-white" : "text-foreground"}`}
                  >
                    {r.name}
                  </p>
                  <p
                    className={`text-[10px] ${isSelected ? "text-white/80" : "text-muted-foreground"}`}
                  >
                    {r.desc}
                  </p>
                </div>
                <div
                  className={`grid h-5 w-5 place-items-center rounded-full border ${isSelected ? "border-white bg-white" : "border-[oklch(0.85_0.02_265)]"}`}
                >
                  {isSelected && <div className="h-2 w-2 rounded-full bg-[var(--primary)]" />}
                </div>
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Permissions
        </p>
        <div className="mt-2 rounded-2xl bg-white shadow-[var(--shadow-soft)]">
          {perms.map((p, i) => (
            <button
              key={p.name}
              onClick={() => togglePerm(i)}
              className={`flex w-full items-center justify-between px-4 py-3 text-left active:bg-slate-50 cursor-pointer ${i < perms.length - 1 ? "border-b border-[oklch(0.94_0.01_265)]" : ""}`}
            >
              <span className="flex items-center gap-2 text-[12px] font-semibold text-foreground">
                <Shield className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2.25} />
                {p.name}
              </span>
              <div
                className={`h-5 w-9 rounded-full p-0.5 transition-colors duration-250 ${p.on ? "bg-[var(--primary)]" : "bg-[var(--muted)]"}`}
              >
                <div
                  className={`h-4 w-4 rounded-full bg-white shadow transition-transform duration-250 ${p.on ? "translate-x-4" : ""}`}
                />
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 border-t border-[oklch(0.94_0.01_265)] pt-5">
          <button
            onClick={() => navigate("family")}
            className="w-full rounded-full bg-[oklch(0.18_0.04_265)] py-4 text-[15px] font-semibold text-white shadow-[var(--shadow-soft)] active:scale-95 transition-all cursor-pointer"
          >
            Save changes
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}
