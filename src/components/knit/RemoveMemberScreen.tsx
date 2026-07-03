import { UserMinus } from 'lucide-react'
import { useAppNavigation } from '@/lib/navigation'
import { PhoneFrame } from './PhoneFrame'

export function RemoveMemberScreen() {
  const {
    goBack,
    navigate,
    members,
    selectedMemberId,
    selectedMemberIds,
    setSelectedMemberIds,
    removeMembers
  } = useAppNavigation()
  const targetIds =
    selectedMemberIds.length > 0 ? selectedMemberIds : selectedMemberId ? [selectedMemberId] : []
  const selectedMembers = members.filter(member => targetIds.includes(member.id))
  const memberName =
    selectedMembers.length === 1
      ? selectedMembers[0].name
      : selectedMembers.length > 1
        ? `${selectedMembers.length} members`
        : 'No member selected'

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
              {selectedMembers.length > 0 ? `Remove ${memberName}?` : 'No member selected'}
            </h3>
            <p className="mt-1 text-[12px] text-muted-foreground">
              <span className="font-semibold text-foreground">{memberName}</span>{' '}
              {selectedMembers.length > 0
                ? 'will lose access to shared wallets, goals and the family ledger. Their personal wallet stays intact.'
                : 'Create or invite a member before removing access.'}
            </p>
          </div>

          {selectedMembers.length > 1 && (
            <div className="mt-4 max-h-28 space-y-1 overflow-y-auto rounded-2xl bg-[var(--muted)] p-2">
              {selectedMembers.map(member => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-[11px]"
                >
                  <span className="font-bold text-foreground">{member.name}</span>
                  <span className="text-muted-foreground">{member.role}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 rounded-2xl bg-[var(--muted)] px-3 py-2.5 text-[11px] text-muted-foreground">
            Tip: switch role to <span className="font-semibold text-foreground">View only</span>{' '}
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
                if (selectedMembers.length === 0) {
                  navigate('invite_member')
                  return
                }
                removeMembers(selectedMembers.map(member => member.id))
                setSelectedMemberIds([])
                navigate('family')
              }}
              className="flex-1 rounded-full bg-[var(--danger)] py-3 text-[13px] font-semibold text-white"
            >
              {selectedMembers.length > 0 ? 'Remove' : 'Invite member'}
            </button>
          </div>
        </div>
      </div>
    </PhoneFrame>
  )
}
