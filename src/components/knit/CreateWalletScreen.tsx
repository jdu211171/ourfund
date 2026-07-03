import { ArrowLeft, Check, Lock, Users, Wallet } from 'lucide-react'
import { useState } from 'react'
import { type CurrencyCode, useAppNavigation } from '@/lib/navigation'
import { PhoneFrame } from './PhoneFrame'

export function CreateWalletScreen() {
  const { navigate, goBack, members, currentMemberId, currency, addWallet } = useAppNavigation()
  const [name, setName] = useState('')
  const [walletType, setWalletType] = useState<'shared' | 'private'>('shared')
  const [walletCurrency, setWalletCurrency] = useState<CurrencyCode>(currency)
  const [memberIds, setMemberIds] = useState(() => members.slice(0, 2).map(member => member.id))
  const ownerMemberId = currentMemberId ?? members[0]?.id ?? 'me'

  const createWallet = () => {
    const selectedMemberIds = memberIds.length > 0 ? memberIds : [ownerMemberId]
    addWallet({
      label: name.trim() || 'New wallet',
      sub:
        walletType === 'shared' ? `Shared · ${selectedMemberIds.length} members` : 'Private wallet',
      type: walletType,
      currency: walletCurrency,
      members: walletType === 'shared' ? selectedMemberIds : [ownerMemberId],
      color: walletType === 'shared' ? 'oklch(0.55 0.24 265)' : 'oklch(0.3 0.05 265)'
    })
    navigate('wallet')
  }

  return (
    <PhoneFrame>
      <div className="flex-1 overflow-y-auto flex flex-col px-7 pt-10 pb-7 min-h-0">
        <header className="flex items-center justify-between">
          <button
            onClick={goBack}
            className="grid h-9 w-9 place-items-center rounded-full text-foreground hover:bg-slate-50 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
          </button>
          <h2 className="text-[17px] font-bold tracking-tight">New wallet</h2>
          <span className="h-9 w-9" />
        </header>

        <div className="mt-6 flex flex-col items-center">
          <div
            className="grid h-14 w-14 place-items-center rounded-2xl text-white shadow-[var(--shadow-tile)]"
            style={{
              background: 'linear-gradient(135deg, oklch(0.65 0.22 265), oklch(0.45 0.24 265))'
            }}
          >
            <Wallet className="h-6 w-6" strokeWidth={2.25} />
          </div>
          <p className="mt-3 text-[11px] uppercase tracking-widest text-muted-foreground">Name</p>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Wallet name"
            className="mt-1 w-full text-center text-[24px] font-extrabold tracking-tight text-foreground bg-transparent border-b border-dashed border-slate-300 focus:border-[var(--primary)] outline-none transition-all py-0.5"
          />
        </div>

        <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Type
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            onClick={() => setWalletType('shared')}
            className={`flex flex-col items-start gap-1 rounded-2xl p-3 shadow-[var(--shadow-soft)] ${walletType === 'shared' ? 'bg-[var(--accent)]' : 'bg-white'}`}
          >
            <Users className="h-4 w-4 text-[var(--primary)]" strokeWidth={2.25} />
            <span className="text-[12px] font-bold text-foreground">Shared</span>
            <span className="text-[10px] text-muted-foreground">Visible to family</span>
          </button>
          <button
            onClick={() => setWalletType('private')}
            className={`flex flex-col items-start gap-1 rounded-2xl p-3 shadow-[var(--shadow-soft)] ${walletType === 'private' ? 'bg-[var(--accent)]' : 'bg-white'}`}
          >
            <Lock className="h-4 w-4 text-muted-foreground" strokeWidth={2.25} />
            <span className="text-[12px] font-bold text-foreground">Private</span>
            <span className="text-[10px] text-muted-foreground">Only you</span>
          </button>
        </div>

        <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Currency
        </p>
        <div className="mt-2 flex gap-2">
          {['UZS', 'USD', 'JPY', 'EUR', 'GBP'].map(c => (
            <button
              key={c}
              onClick={() => setWalletCurrency(c as CurrencyCode)}
              className={`flex-1 rounded-full py-2 text-[12px] font-semibold ${
                c === walletCurrency
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--muted)] text-foreground'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Access
        </p>
        <div className="mt-2 flex-1 space-y-2 overflow-y-auto pr-1 min-h-0">
          {members.map(m => {
            const selected = memberIds.includes(m.id)
            return (
              <button
                key={m.name}
                onClick={() =>
                  setMemberIds(prev =>
                    prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id]
                  )
                }
                className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-2 text-left shadow-[var(--shadow-soft)]"
              >
                <div
                  className="grid h-9 w-9 place-items-center rounded-full text-white text-[11px] font-bold"
                  style={{
                    background:
                      'linear-gradient(135deg, oklch(0.65 0.22 265), oklch(0.45 0.24 265))'
                  }}
                >
                  {m.initials}
                </div>
                <div className="flex-1 leading-tight">
                  <p className="text-[12px] font-bold text-foreground">{m.name}</p>
                  <p className="text-[10px] text-muted-foreground">{m.role}</p>
                </div>
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full ${
                    selected ? 'bg-[var(--primary)] text-white' : 'bg-[var(--muted)]'
                  }`}
                >
                  {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
              </button>
            )
          })}
        </div>

        <button
          onClick={createWallet}
          className="mt-3 w-full rounded-full bg-[oklch(0.18_0.04_265)] py-4 text-[15px] font-semibold text-white active:scale-95 transition-transform"
        >
          Create wallet
        </button>
      </div>
    </PhoneFrame>
  )
}
