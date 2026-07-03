import { AlertCircle, ArrowLeft, Users } from 'lucide-react'
import { useState } from 'react'
import { useAppNavigation } from '@/lib/navigation'
import { PhoneFrame } from './PhoneFrame'

export function JoinFamilyErrorScreen() {
  const { goBack, navigate, validateInviteCode } = useAppNavigation()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const tryCode = async () => {
    if (!code.trim()) return
    setLoading(true)
    try {
      const invite = await validateInviteCode(code)
      navigate(invite ? 'confirm_invite' : 'join_family_error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PhoneFrame>
      <div className="flex h-full flex-col px-7 pt-10 pb-7">
        <button
          onClick={goBack}
          className="grid h-9 w-9 place-items-center rounded-full text-foreground hover:bg-slate-50 transition-colors cursor-pointer"
          aria-label="Back"
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
          <h2 className="mt-4 font-display text-[24px] leading-tight tracking-tight text-foreground">
            Join a household
          </h2>
          <p className="mt-1 text-center text-[12px] text-muted-foreground">
            Enter the invitation code your family admin shared.
          </p>
        </div>

        <div className="mt-8">
          <label
            htmlFor="invitation-code"
            className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
          >
            Invitation code
          </label>
          <input
            id="invitation-code"
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="Enter code"
            className="mt-2 w-full rounded-2xl bg-white px-4 py-4 text-center text-[18px] font-extrabold tracking-[0.3em] text-foreground shadow-[var(--shadow-soft)] outline-none ring-2 ring-[var(--danger)]/60"
          />
          <div className="mt-2 flex items-center gap-1.5 text-[var(--danger)]">
            <AlertCircle className="h-3.5 w-3.5" strokeWidth={2.5} />
            <p className="text-[11px] font-semibold">
              Invalid or expired code. Double-check with your admin.
            </p>
          </div>
        </div>

        <button
          onClick={tryCode}
          disabled={!code.trim() || loading}
          className={`mt-auto w-full rounded-full py-4 text-[15px] font-semibold transition-opacity ${code.trim() && !loading ? 'bg-[oklch(0.18_0.04_265)] text-white' : 'bg-[var(--muted)] text-muted-foreground opacity-50'}`}
        >
          {loading ? 'Checking...' : 'Try code'}
        </button>
      </div>
    </PhoneFrame>
  )
}
