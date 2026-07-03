import { ArrowLeft, Check, Copy, Link2, Mail, MessageSquare } from 'lucide-react'
import { useState } from 'react'
import { useAppNavigation } from '@/lib/navigation'
import { InviteeEmailField, isValidEmail } from './InviteeEmailField'
import { PhoneFrame } from './PhoneFrame'

const roles = ['Admin', 'Adult', 'Teen', 'Kid']

export function InviteMemberScreen() {
  const { navigate, goBack, household, inviteMember } = useAppNavigation()
  const [selectedRoleIdx, _setSelectedRoleIdx] = useState(2)
  const [copied, setCopied] = useState(false)
  const [inviteMethod, setInviteMethod] = useState<'email' | 'sms' | 'link'>('email')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const inviteCode = household?.inviteCode ?? 'CREATE'

  const handleCopy = () => {
    if (household) void navigator.clipboard?.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sendInvite = () => {
    if (!household) {
      navigate('signup')
      return
    }
    if (inviteMethod !== 'email') return
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Enter an email address to send the invite.')
      return
    }
    if (!isValidEmail(trimmedEmail)) {
      setError('Enter a valid email address before sending.')
      return
    }
    setError('')
    inviteMember(roles[selectedRoleIdx] as 'Admin' | 'Adult' | 'Teen' | 'Kid', trimmedEmail)
    navigate('permissions')
  }

  const canSendEmail = inviteMethod === 'email' && isValidEmail(email)

  return (
    <PhoneFrame>
      <div className="flex-1 overflow-y-auto flex flex-col px-7 pt-10 pb-7 min-h-0">
        <header className="flex items-center justify-between">
          <button
            onClick={goBack}
            className="grid h-9 w-9 place-items-center rounded-full text-foreground hover:bg-[var(--muted)] transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
          </button>
          <h2 className="text-[17px] font-bold tracking-tight">Invite member</h2>
          <div className="w-9" />
        </header>

        <div className="mt-5 rounded-3xl bg-[var(--primary)] p-4 text-[var(--primary-foreground)] shadow-[var(--shadow-tile)]">
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
                ? 'Copied code!'
                : 'Create a household first'
              : household
                ? 'Code expires in 7 days'
                : 'Create a household to invite members'}
          </p>
        </div>

        {/* <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground"> */}
        {/*   Assign role */}
        {/* </p> */}
        {/* <div className="mt-2 flex flex-wrap gap-2"> */}
        {/*   {roles.map((r, i) => ( */}
        {/*     <button */}
        {/*       key={r} */}
        {/*       onClick={() => setSelectedRoleIdx(i)} */}
        {/*       className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all cursor-pointer ${ */}
        {/*         i === selectedRoleIdx */}
        {/*           ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md scale-105" */}
        {/*           : "bg-[var(--card)] text-foreground shadow-[var(--shadow-soft)] hover:bg-[var(--muted)] active:scale-95" */}
        {/*       }`} */}
        {/*     > */}
        {/*       {r} */}
        {/*     </button> */}
        {/*   ))} */}
        {/* </div> */}
        {/**/}

        <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Send via
        </p>

        <div className="mt-2 space-y-2">
          {[
            {
              key: 'email' as const,
              Icon: Mail,
              label: 'Email invitation',
              sub: 'Send to an email address',
              enabled: true
            },
            {
              key: 'sms' as const,
              Icon: MessageSquare,
              label: 'SMS / iMessage',
              sub: 'Text the invite to a phone',
              enabled: false
            },
            {
              key: 'link' as const,
              Icon: Link2,
              label: 'Share link',
              sub: 'Copy a one-time invite link',
              enabled: false
            }
          ].map(m => (
            <button
              key={m.label}
              onClick={() => {
                if (!m.enabled) return
                setInviteMethod(m.key)
                setError('')
              }}
              disabled={!m.enabled}
              className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 shadow-[var(--shadow-soft)] transition-colors ${
                m.enabled
                  ? inviteMethod === m.key
                    ? 'bg-[var(--accent)] ring-2 ring-[var(--primary)]'
                    : 'bg-[var(--card)] hover:bg-[var(--muted)] active:scale-[0.98] cursor-pointer'
                  : 'bg-[var(--card)]/70 cursor-not-allowed'
              }`}
            >
              <div
                className={`grid h-10 w-10 place-items-center rounded-xl ${
                  m.enabled
                    ? 'bg-[var(--muted)] text-[var(--primary)]'
                    : 'bg-[var(--danger)]/15 text-[var(--danger)]'
                }`}
              >
                <m.Icon className="h-4 w-4" strokeWidth={2.25} />
              </div>
              <div className="flex-1 text-left leading-tight">
                <p
                  className={`text-[12px] font-bold ${m.enabled ? 'text-foreground' : 'text-[var(--danger)]'}`}
                >
                  {m.label}
                </p>
                <p
                  className={`text-[10px] ${m.enabled ? 'text-muted-foreground' : 'text-[var(--danger)]/80'}`}
                >
                  {m.enabled ? m.sub : 'Coming soon'}
                </p>
              </div>
            </button>
          ))}
        </div>

        {inviteMethod === 'email' && (
          <div className="mt-3">
            <InviteeEmailField
              value={email}
              onChange={next => {
                setEmail(next)
                if (error) setError('')
              }}
              externalError={error || null}
            />
          </div>
        )}

        <button
          onClick={sendInvite}
          disabled={household ? !canSendEmail : false}
          className="mt-auto w-full rounded-full bg-[var(--primary)] py-4 text-[15px] font-semibold text-[var(--primary-foreground)] active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {household ? 'Send invite' : 'Create household'}
        </button>
      </div>
    </PhoneFrame>
  )
}
