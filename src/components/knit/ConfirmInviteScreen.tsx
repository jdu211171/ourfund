import { ArrowLeft, Check, Users } from 'lucide-react'
import { useState } from 'react'
import { useAppNavigation } from '@/lib/navigation'
import { PhoneFrame } from './PhoneFrame'

export function ConfirmInviteScreen() {
  const { navigate, goBack, pendingInvite, acceptInvite, isAuthenticated, setSignupHouseholdMode } =
    useAppNavigation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const role = pendingInvite?.role ?? 'Adult'
  const householdName = pendingInvite?.householdName ?? 'No invite selected'
  const memberCount = pendingInvite?.memberCount ?? 0

  const join = async () => {
    if (!pendingInvite) return
    if (!isAuthenticated) {
      setSignupHouseholdMode('join')
      navigate('signup')
      return
    }

    setLoading(true)
    setError('')
    try {
      await acceptInvite()
      navigate('home')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not accept this invite.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PhoneFrame>
      <div className="flex h-full flex-col px-7 pt-10 pb-7">
        <button
          className="grid h-9 w-9 place-items-center rounded-full hover:bg-slate-50 transition-colors"
          aria-label="Back"
          onClick={goBack}
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
        </button>

        <div className="mt-4 flex flex-col items-center">
          <div
            className="grid h-14 w-14 place-items-center rounded-2xl text-white shadow-[var(--shadow-tile)]"
            style={{
              background: 'linear-gradient(135deg, oklch(0.65 0.22 265), oklch(0.45 0.24 265))'
            }}
          >
            <Users className="h-6 w-6" strokeWidth={2.25} />
          </div>
          <h2 className="mt-4 font-display text-[22px] leading-tight tracking-tight text-foreground text-center">
            {pendingInvite ? "You're joining" : 'Invite needed'}
            <br />
            {householdName}
          </h2>
          <p className="mt-2 text-center text-[12px] text-muted-foreground">
            {pendingInvite ? (
              <>
                Code <span className="font-semibold text-foreground">{pendingInvite.code}</span>{' '}
                verified
              </>
            ) : (
              'Enter a valid invite code to continue'
            )}
          </p>
        </div>

        <div className="mt-6 rounded-3xl bg-white p-5 shadow-[var(--shadow-tile)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Household</span>
            <span className="text-[12px] font-bold text-foreground">{householdName}</span>
          </div>
          <div className="my-3 h-px bg-[oklch(0.94_0.01_265)]" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Members</span>
            <span className="text-[12px] font-bold text-foreground">
              {memberCount} {memberCount === 1 ? 'person' : 'people'}
            </span>
          </div>
          <div className="my-3 h-px bg-[oklch(0.94_0.01_265)]" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">Your role</span>
            <span className="rounded-full bg-[oklch(0.95_0.04_265)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--primary)]">
              {role}
            </span>
          </div>
          <div className="my-3 h-px bg-[oklch(0.94_0.01_265)]" />
          <p className="text-[11px] text-muted-foreground">
            As a {role}, you can log expenses, view shared budgets, and use the permissions set by
            the household admin.
          </p>
        </div>

        {error && (
          <p className="mt-3 text-center text-[11px] font-semibold text-[var(--danger)]">{error}</p>
        )}

        <div className="mt-auto space-y-2">
          <button
            onClick={join}
            disabled={!pendingInvite || loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[oklch(0.18_0.04_265)] py-4 text-[15px] font-semibold text-white active:scale-95 transition-transform cursor-pointer disabled:opacity-50"
          >
            <Check className="h-4 w-4" strokeWidth={3} />{' '}
            {loading ? 'Joining...' : isAuthenticated ? 'Accept & join' : 'Create account to join'}
          </button>
          <button
            onClick={goBack}
            className="w-full rounded-full bg-[var(--muted)] py-3 text-[13px] font-semibold text-foreground active:scale-95 transition-transform cursor-pointer"
          >
            Decline
          </button>
        </div>
      </div>
    </PhoneFrame>
  )
}
