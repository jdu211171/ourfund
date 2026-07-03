import { ArrowDownLeft, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { currencyAdornment, currencyValueToUsd, formatUsdAsCurrency } from '@/lib/currency'
import { useAppNavigation } from '@/lib/navigation'
import { GoalIcon, normalizeGoalIconName } from './goalIconOptions'
import { OptionSelect } from './OptionSelect'
import { PhoneFrame } from './PhoneFrame'

export function GoalWithdrawScreen() {
  const { navigate, goBack, currency, goals, selectedGoalId, activeWallets, withdrawFromGoal } =
    useAppNavigation()
  const goal = goals.find(g => g.id === selectedGoalId) ?? goals[0]
  const [amount, setAmount] = useState('0')
  const [selectedWalletId, setSelectedWalletId] = useState(activeWallets[0]?.id ?? '')
  const wallet = activeWallets.find(item => item.id === selectedWalletId) ?? activeWallets[0]
  const amountUsd = currencyValueToUsd(parseFloat(amount || '0'), currency)
  const { prefix, suffix } = currencyAdornment(currency)
  const goalIconName = normalizeGoalIconName(goal?.icon ?? 'plane')

  if (!goal) {
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
            <h2 className="text-[17px] font-bold tracking-tight">Withdraw</h2>
            <span className="h-9 w-9" />
          </header>
          <button
            onClick={() => navigate('new_goal')}
            className="m-auto rounded-3xl bg-white px-5 py-6 text-center shadow-[var(--shadow-soft)]"
          >
            <p className="text-[14px] font-bold text-foreground">No goal selected</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Create a goal before making withdrawals.
            </p>
          </button>
        </div>
      </PhoneFrame>
    )
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
          <h2 className="text-[17px] font-bold tracking-tight">Withdraw</h2>
          <div className="w-9" />
        </header>

        <div className="mt-5 flex items-center gap-3 rounded-3xl bg-white p-4 shadow-[var(--shadow-soft)]">
          <div
            className="grid h-12 w-12 place-items-center rounded-2xl text-white"
            style={{
              background: 'linear-gradient(135deg, oklch(0.65 0.22 200), oklch(0.45 0.24 200))'
            }}
          >
            <GoalIcon name={goalIconName} className="h-6 w-6" />
          </div>
          <div className="flex-1 leading-tight">
            <p className="text-[12px] font-bold text-foreground">{goal.title}</p>
            <p className="text-[10px] text-muted-foreground">
              Saved {formatUsdAsCurrency(goal.savedUsd, currency)} of{' '}
              {formatUsdAsCurrency(goal.targetUsd, currency)}
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col items-center">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Amount to withdraw
          </p>
          <div className="mt-2 flex items-center justify-center gap-1">
            {prefix && (
              <span className="text-[20px] font-bold text-muted-foreground">{prefix}</span>
            )}
            <input
              type="text"
              value={amount}
              onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              className="w-40 bg-transparent text-center text-[44px] font-extrabold tracking-tight text-foreground outline-none border-b border-transparent focus:border-[var(--primary)] transition-colors focus:ring-0"
              placeholder="0"
            />
            {suffix && (
              <span className="text-[14px] font-bold text-muted-foreground">{suffix}</span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Remaining after: {formatUsdAsCurrency(Math.max(0, goal.savedUsd - amountUsd), currency)}
          </p>
        </div>

        <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Send to
        </p>
        <div className="mt-2">
          <OptionSelect
            label="Wallet"
            value={wallet?.id ?? ''}
            options={activeWallets.map(item => ({
              value: item.id,
              label: item.label,
              description: item.sub
            }))}
            onChange={setSelectedWalletId}
            emptyLabel="No wallet available"
            icon={<ArrowDownLeft className="h-5 w-5" strokeWidth={2.25} />}
          />
        </div>

        <p className="mt-4 text-[11px] text-muted-foreground">
          Withdrawing reduces your goal progress. Admins will be notified.
        </p>

        <button
          onClick={() => {
            if (!wallet) {
              navigate('new_wallet')
              return
            }
            withdrawFromGoal(goal.id, amountUsd, wallet.label)
            navigate('goal_detail')
          }}
          className="mt-auto w-full rounded-full bg-[oklch(0.18_0.04_265)] py-4 text-[15px] font-semibold text-white active:scale-95 transition-all cursor-pointer"
        >
          {wallet ? 'Confirm withdrawal' : 'Create wallet'}
        </button>
      </div>
    </PhoneFrame>
  )
}
