import { Loader2, Lock, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAppNavigation } from '@/lib/navigation'
import { PhoneFrame } from './PhoneFrame'

export function PlaidConnectingScreen() {
  const { currentScreen, navigate, selectedBankName, connectSelectedBank } = useAppNavigation()
  const [step, setStep] = useState(2)

  useEffect(() => {
    if (currentScreen !== 'plaid_connecting') return
    const timers = [
      window.setTimeout(() => setStep(3), 700),
      window.setTimeout(() => {
        connectSelectedBank()
        navigate('plaid_success')
      }, 1400)
    ]
    return () => timers.forEach(window.clearTimeout)
  }, [connectSelectedBank, currentScreen, navigate])

  return (
    <PhoneFrame>
      <div className="flex h-full flex-col items-center px-7 pt-16 pb-7">
        <div className="relative grid h-24 w-24 place-items-center">
          <span
            className="absolute inset-0 rounded-full"
            style={{ background: 'oklch(0.95 0.04 265)' }}
          />
          <span className="absolute inset-2 rounded-full border-[3px] border-[var(--primary)]/20 border-t-[var(--primary)] animate-spin" />
          <div
            className="relative grid h-12 w-12 place-items-center rounded-2xl text-white text-[14px] font-extrabold shadow-[var(--shadow-tile)]"
            style={{ background: 'oklch(0.45 0.18 250)' }}
          >
            {selectedBankName[0]}
          </div>
        </div>

        <p className="mt-8 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Plaid
        </p>
        <h2 className="mt-1 font-display text-[22px] tracking-tight text-foreground">
          Connecting to {selectedBankName}...
        </h2>
        <p className="mt-1.5 text-center text-[12px] text-muted-foreground max-w-[240px]">
          Verifying your credentials and syncing the last 90 days of activity.
        </p>

        <div className="mt-8 w-full space-y-2">
          {[
            { label: 'Authenticate' },
            { label: 'Verify identity' },
            { label: 'Sync accounts' },
            { label: 'Import transactions' }
          ].map((s, index) => {
            const done = index < step
            const loading = index === step
            return (
              <div
                key={s.label}
                className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 shadow-[var(--shadow-soft)]"
              >
                <div
                  className={`grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold ${
                    done
                      ? 'bg-[oklch(0.92_0.1_150)] text-[oklch(0.4_0.18_150)]'
                      : loading
                        ? 'bg-[oklch(0.95_0.04_265)] text-[var(--primary)]'
                        : 'bg-[var(--muted)] text-muted-foreground'
                  }`}
                >
                  {done ? '✓' : loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : ''}
                </div>
                <p
                  className={`text-[12px] font-semibold ${done || loading ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                  {s.label}
                </p>
              </div>
            )
          })}
        </div>

        <div className="mt-auto flex items-center gap-2 text-[10px] text-muted-foreground">
          <Shield className="h-3.5 w-3.5" strokeWidth={2.25} />
          256-bit encryption
          <span className="opacity-40">·</span>
          <Lock className="h-3.5 w-3.5" strokeWidth={2.25} />
          Read-only access
        </div>
      </div>
    </PhoneFrame>
  )
}
