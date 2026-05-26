import { UserMinus } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { useAppNavigation } from "@/lib/navigation";

export function RemoveMemberScreen() {
  const { goBack, navigate, members, selectedMemberId, removeMember } = useAppNavigation();
  const member =
    members.find((m) => m.id === selectedMemberId) ?? members.find((m) => !m.admin) ?? members[0];
  const memberName = member?.name ?? "No member selected";

  return (
    <PhoneFrame>
      <div className="relative flex h-full flex-col">
        <div className="flex-1 px-7 pt-10 opacity-40">
          <div className="h-6 w-24 rounded-full bg-[var(--muted)]" />
          <div className="mt-4 h-20 rounded-3xl bg-white shadow-[var(--shadow-soft)]" />
          <div className="mt-3 space-y-2">
            <div className="h-14 rounded-2xl bg-white shadow-[var(--shadow-soft)]" />
            <div className="h-14 rounded-2xl bg-white shadow-[var(--shadow-soft)]" />
            <div className="h-14 rounded-2xl bg-white shadow-[var(--shadow-soft)]" />
          </div>
        </div>

        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

        <div className="absolute inset-x-4 bottom-4 rounded-3xl bg-white p-6 shadow-[var(--shadow-tile)]">
          <div className="flex flex-col items-center text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[oklch(0.96_0.04_30)] text-[var(--danger)]">
              <UserMinus className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <h3 className="mt-3 font-display text-[20px] tracking-tight text-foreground">
              {member ? `Remove ${member.name.split(" ")[0]}?` : "No member selected"}
            </h3>
            <p className="mt-1 text-[12px] text-muted-foreground">
              <span className="font-semibold text-foreground">{memberName}</span>{" "}
              {member
                ? "will lose access to shared wallets, goals and the family ledger. Their personal wallet stays intact."
                : "Create or invite a member before removing access."}
            </p>
          </div>

          <div className="mt-4 rounded-2xl bg-[var(--muted)] px-3 py-2.5 text-[11px] text-muted-foreground">
            Tip: switch role to <span className="font-semibold text-foreground">View only</span>{" "}
            instead if you just want to pause access.
          </div>

          <div className="mt-5 flex gap-3">
            <button
              onClick={goBack}
              className="flex-1 rounded-full bg-[var(--muted)] py-3 text-[13px] font-semibold text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (!member) {
                  navigate("invite_member");
                  return;
                }
                if (member) removeMember(member.id);
                navigate("family");
              }}
              className="flex-1 rounded-full bg-[var(--danger)] py-3 text-[13px] font-semibold text-white"
            >
              {member ? "Remove" : "Invite member"}
            </button>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
