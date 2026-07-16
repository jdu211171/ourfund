import { ArrowLeft, Delete, ShoppingBag, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { formatISODate } from '@/context/helpers'
import { currencyValueToUsd, formatUsdAsCurrency, usdToCurrencyValue } from '@/lib/currency'
import { useAppNavigation } from '@/lib/navigation'
import { Money } from './Money'
import { OptionSelect } from './OptionSelect'
import { PhoneFrame } from './PhoneFrame'

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'] as const

export function SendMoneyScreen() {
  const {
    navigate,
    goBack,
    currency,
    profile,
    addTransaction,
    categories,
    activeWallets,
    selectedWalletId,
    transactions
  } = useAppNavigation()
  const [amount, setAmount] = useState('0')
  const amountUsd = currencyValueToUsd(parseFloat(amount || '0'), currency)
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const defaultWalletId =
    selectedWalletId && activeWallets.some(w => w.id === selectedWalletId)
      ? selectedWalletId
      : (activeWallets[0]?.id ?? '')
  const [walletId, setWalletId] = useState(defaultWalletId)
  const [customName, setCustomName] = useState<string | null>(null)

  const category = categories.find(item => item.id === categoryId) ?? categories[0]
  const wallet = activeWallets.find(item => item.id === walletId) ?? activeWallets[0]
  const hasWallet = Boolean(wallet)

  const expensePresets = useMemo(() => {
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    const oneMonthAgoStr = formatISODate(oneMonthAgo)

    const expenses = transactions.filter(t => t.usd < 0)
    let recentExpenses = expenses.filter(t => t.date >= oneMonthAgoStr)

    if (recentExpenses.length < 5) {
      recentExpenses = expenses
    }

    const counts = new Map<string, { count: number; lastTx: (typeof recentExpenses)[0] }>()
    for (const tx of recentExpenses) {
      const key = `${tx.name.trim().toLowerCase()}||${tx.category.trim().toLowerCase()}`
      const existing = counts.get(key)
      if (existing) {
        existing.count++
        if (tx.date > existing.lastTx.date) {
          existing.lastTx = tx
        }
      } else {
        counts.set(key, { count: 1, lastTx: tx })
      }
    }

    const sorted = Array.from(counts.values()).sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count
      return b.lastTx.date.localeCompare(a.lastTx.date)
    })

    return sorted.slice(0, 4).map(item => ({
      name: item.lastTx.name,
      category: item.lastTx.category,
      wallet: item.lastTx.wallet,
      usd: item.lastTx.usd
    }))
  }, [transactions])

  const handleApplyPreset = (preset: (typeof expensePresets)[0]) => {
    const localAmount = usdToCurrencyValue(Math.abs(preset.usd), currency)
    const digits = currency === 'JPY' || currency === 'UZS' ? 0 : 2
    const amountStr = localAmount.toFixed(digits)
    const cleanAmountStr = amountStr.endsWith('.00') ? amountStr.slice(0, -3) : amountStr
    setAmount(cleanAmountStr)

    const matchedCategory = categories.find(
      c => c.label.toLowerCase() === preset.category.toLowerCase()
    )
    if (matchedCategory) {
      setCategoryId(matchedCategory.id)
    }

    const matchedWallet = activeWallets.find(
      w => w.label.toLowerCase() === preset.wallet.toLowerCase()
    )
    if (matchedWallet) {
      setWalletId(matchedWallet.id)
    }

    setCustomName(preset.name)
  }

  const handleKeyPress = (k: (typeof keys)[number]) => {
    if (k === 'del') {
      setAmount(prev => {
        const next = prev.slice(0, -1)
        return next === '' ? '0' : next
      })
    } else if (k === '.') {
      if (!amount.includes('.')) {
        setAmount(prev => prev + '.')
      }
    } else {
      setAmount(prev => {
        if (prev === '0') return k
        return prev + k
      })
    }
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
          <h2 className="text-[17px] font-bold tracking-tight">Add Expense</h2>
          <span className="h-9 w-9" />
        </header>

        <div className="mt-8 text-center">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Amount</p>
          <div className="mt-2 inline-block">
            <Money usd={-amountUsd} size="xl" tone="danger" signed />
          </div>
        </div>

        {expensePresets.length > 0 && (
          <div className="mt-4 flex flex-col items-center shrink-0">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1.5 font-bold">
              Recent presets
            </p>
            <div className="flex flex-wrap justify-center gap-1.5 max-h-[80px] overflow-y-auto px-2">
              {expensePresets.map(preset => (
                <button
                  key={`${preset.name}-${preset.usd}-${preset.wallet}`}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="bg-white text-foreground hover:bg-slate-50 shadow-[var(--shadow-soft)] rounded-full px-2.5 py-1 text-[10px] font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1 border border-transparent hover:border-slate-100"
                >
                  <span className="truncate max-w-[80px]">{preset.name}</span>
                  <span className="text-[9px] text-muted-foreground font-semibold">
                    ({formatUsdAsCurrency(Math.abs(preset.usd), currency)})
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-7 space-y-3">
          <OptionSelect
            label="Category"
            value={category?.id ?? ''}
            options={categories.map(item => ({
              value: item.id,
              label: item.label,
              description: `${formatUsdAsCurrency(item.limitUsd, currency)} monthly limit`
            }))}
            onChange={setCategoryId}
            emptyLabel="No categories yet"
            icon={<ShoppingBag className="h-5 w-5" strokeWidth={2.25} />}
          />

          <OptionSelect
            label="Paid from"
            value={wallet?.id ?? ''}
            options={activeWallets.map(item => ({
              value: item.id,
              label: item.label,
              description: item.sub
            }))}
            onChange={setWalletId}
            emptyLabel="Create a wallet first"
            icon={<Users className="h-5 w-5" strokeWidth={2.25} />}
          />
        </div>

        <div className="mt-6 grid flex-1 grid-cols-3 place-items-center gap-y-1">
          {keys.map(k => (
            <button
              key={k}
              onClick={() => handleKeyPress(k)}
              className="grid h-12 w-12 place-items-center text-[26px] font-semibold text-foreground transition-colors active:bg-[var(--muted)] rounded-full hover:bg-slate-50 cursor-pointer"
              aria-label={k === 'del' ? 'Delete' : k}
            >
              {k === 'del' ? (
                <span className="grid h-9 w-10 place-items-center rounded-lg bg-[var(--muted)] text-muted-foreground">
                  <Delete className="h-4 w-4" strokeWidth={2.25} />
                </span>
              ) : (
                k
              )}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            if (!hasWallet) {
              navigate('new_wallet')
              return
            }
            if (amountUsd > 0) {
              addTransaction({
                name: customName ?? (category?.label ? `${category.label} expense` : 'Expense'),
                who: profile.name.split(' ').filter(Boolean)[0] ?? 'You',
                usd: -amountUsd,
                category: category?.label ?? 'Uncategorized',
                wallet: wallet.label,
                date: formatISODate(new Date())
              })
            }
            goBack()
          }}
          className="mt-4 w-full rounded-full bg-[oklch(0.18_0.04_265)] py-4 text-[15px] font-semibold text-white active:scale-95 transition-transform cursor-pointer"
        >
          {hasWallet ? 'Save expense' : 'Create a wallet first'}
        </button>
      </div>
    </PhoneFrame>
  )
}
