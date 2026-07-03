import { ArrowLeft, Lock, Search, Shield } from 'lucide-react'
import { useState } from 'react'
import { useAppNavigation } from '@/lib/navigation'
import { PhoneFrame } from './PhoneFrame'

const banks = [
  { name: 'Chase', color: 'oklch(0.45 0.18 250)' },
  { name: 'Bank of America', color: 'oklch(0.55 0.22 25)' },
  { name: 'Wells Fargo', color: 'oklch(0.6 0.22 60)' },
  { name: 'Citibank', color: 'oklch(0.55 0.2 220)' },
  { name: 'Capital One', color: 'oklch(0.55 0.22 0)' },
  { name: 'Ally Bank', color: 'oklch(0.65 0.22 320)' },
  { name: 'USAA', color: 'oklch(0.4 0.1 240)' },
  { name: 'PNC', color: 'oklch(0.5 0.2 30)' }
]

export function BankConnectScreen() {
  const { goBack, navigate, selectedBankName, setSelectedBankName } = useAppNavigation()
  const [query, setQuery] = useState('')
  const filteredBanks = banks.filter(bank => bank.name.toLowerCase().includes(query.toLowerCase()))

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
          <h2 className="text-[17px] font-bold tracking-tight">Connect bank</h2>
          <div className="w-9" />
        </header>

        <div className="mt-4 flex items-center gap-2 rounded-full bg-white px-4 py-3 shadow-[var(--shadow-soft)]">
          <Search className="h-4 w-4 text-muted-foreground" strokeWidth={2.25} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search 12,000+ banks"
            className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-[oklch(0.95_0.04_265)] p-3">
          <Shield className="mt-0.5 h-4 w-4 text-[var(--primary)]" strokeWidth={2.25} />
          <p className="text-[11px] text-foreground">
            Powered by Plaid. Your credentials are encrypted end-to-end and never stored by Nest.
          </p>
        </div>

        <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Popular banks
        </p>

        <div className="mt-2 grid grid-cols-2 gap-2 overflow-hidden">
          {filteredBanks.map(b => (
            <button
              key={b.name}
              onClick={() => setSelectedBankName(b.name)}
              className={`flex items-center gap-2 rounded-2xl p-3 text-left shadow-[var(--shadow-soft)] hover:bg-slate-50 transition-colors active:scale-95 cursor-pointer ${selectedBankName === b.name ? 'bg-[var(--accent)]' : 'bg-white'}`}
            >
              <div
                className="grid h-9 w-9 place-items-center rounded-xl text-white text-[12px] font-bold"
                style={{ background: b.color }}
              >
                {b.name[0]}
              </div>
              <p className="text-[11px] font-bold text-foreground leading-tight">{b.name}</p>
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate('plaid_connecting')}
          className="mt-auto flex w-full items-center justify-center gap-2 rounded-full bg-[oklch(0.18_0.04_265)] py-4 text-[15px] font-semibold text-white active:scale-95 transition-transform cursor-pointer"
        >
          <Lock className="h-4 w-4" strokeWidth={2.25} /> Continue with {selectedBankName}
        </button>
      </div>
    </PhoneFrame>
  )
}
