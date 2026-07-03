import { ArrowLeft, Delete, Fingerprint } from 'lucide-react'
import { useState } from 'react'
import { useAppNavigation } from '@/lib/navigation'
import { PhoneFrame } from './PhoneFrame'

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']

export function PasscodeScreen() {
  const { goBack, navigate, setPasscode, faceIdEnabled, setFaceIdEnabled } = useAppNavigation()
  const [draft, setDraft] = useState('')
  const filled = draft.length
  const press = (key: string) => {
    if (key === 'del') {
      setDraft(prev => prev.slice(0, -1))
      return
    }
    const next = `${draft}${key}`.slice(0, 4)
    setDraft(next)
    if (next.length === 4) {
      setPasscode(next)
      navigate('settings')
    }
  }

  return (
    <PhoneFrame>
      <div className="flex h-full flex-col px-7 pt-10 pb-7">
        <button
          onClick={goBack}
          className="grid h-9 w-9 place-items-center rounded-full"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
        </button>

        <div className="mt-4 flex flex-col items-center">
          <h2 className="font-display text-[24px] leading-tight tracking-tight text-foreground">
            Set passcode
          </h2>
          <p className="mt-1 text-center text-[12px] text-muted-foreground">
            Choose a 4-digit PIN to lock your Nest app.
          </p>
        </div>

        <div className="mt-6 flex justify-center gap-4">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`h-4 w-4 rounded-full ${i < filled ? 'bg-[var(--primary)]' : 'border border-[oklch(0.85_0.02_265)] bg-white'}`}
            />
          ))}
        </div>

        <div className="mt-8 grid grid-cols-3 gap-3">
          {keys.map((k, i) => {
            if (k === '') return <div key={i} />
            if (k === 'del')
              return (
                <button
                  key={i}
                  onClick={() => press(k)}
                  className="grid h-14 place-items-center rounded-2xl text-foreground"
                >
                  <Delete className="h-5 w-5" strokeWidth={2.25} />
                </button>
              )
            return (
              <button
                key={i}
                onClick={() => press(k)}
                className="grid h-14 place-items-center rounded-2xl bg-white text-[22px] font-bold text-foreground shadow-[var(--shadow-soft)]"
              >
                {k}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => setFaceIdEnabled(!faceIdEnabled)}
          className="mt-auto flex w-full items-center justify-center gap-2 rounded-full bg-[var(--muted)] py-3 text-[12px] font-semibold text-foreground"
        >
          <Fingerprint className="h-4 w-4" strokeWidth={2.25} />{' '}
          {faceIdEnabled ? 'Disable' : 'Enable'} Face ID
        </button>
      </div>
    </PhoneFrame>
  )
}
