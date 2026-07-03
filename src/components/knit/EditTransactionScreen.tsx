import { ArrowDownLeft, ArrowLeft, Trash2 } from 'lucide-react'
import { useState } from 'react'
import {
  currencyAdornment,
  currencyInputLabel,
  currencyValueToUsd,
  usdToCurrencyValue
} from '@/lib/currency'
import { useAppNavigation } from '@/lib/navigation'
import { PhoneFrame } from './PhoneFrame'

export function EditTransactionScreen() {
  const {
    navigate,
    goBack,
    selectedTransactionId,
    transactions,
    categories,
    currency,
    updateTransaction
  } = useAppNavigation()

  // Find dynamic transaction
  const txn = transactions.find(t => t.id === selectedTransactionId) || transactions[0]

  const [amount, setAmount] = useState(
    usdToCurrencyValue(Math.abs(txn?.usd ?? 0), currency).toFixed(
      currency === 'UZS' || currency === 'JPY' ? 0 : 2
    )
  )
  const [description, setDescription] = useState(txn?.name ?? '')
  const [category, setCategory] = useState(txn?.category ?? categories[0]?.label ?? 'Uncategorized')
  const categoryOptions = [
    ...new Set([
      ...categories.map(item => item.label),
      ...transactions.map(item => item.category),
      category
    ])
  ].filter(Boolean)
  const { prefix: amountPrefix, suffix: amountSuffix } = currencyAdornment(currency)

  if (!txn) {
    return (
      <PhoneFrame>
        <div className="flex h-full flex-col px-7 pt-10 pb-7">
          <header className="flex items-center justify-between">
            <button
              className="grid h-9 w-9 place-items-center rounded-full text-foreground hover:bg-slate-50 transition-colors cursor-pointer"
              aria-label="Back"
              onClick={goBack}
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
            </button>
            <h2 className="text-[17px] font-bold tracking-tight">Edit transaction</h2>
            <span className="h-9 w-9" />
          </header>
          <button
            onClick={() => navigate('add_expense')}
            className="m-auto rounded-3xl bg-white px-5 py-6 text-center shadow-[var(--shadow-soft)]"
          >
            <p className="text-[14px] font-bold text-foreground">No transaction selected</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Add a transaction before editing.
            </p>
          </button>
        </div>
      </PhoneFrame>
    )
  }

  const handleSave = () => {
    const val = parseFloat(amount || '0')
    if (val <= 0) return
    const usdValue = currencyValueToUsd(val, currency)

    updateTransaction(txn.id, {
      name: description,
      usd: txn.usd < 0 ? -usdValue : usdValue,
      category
    })

    navigate('home')
  }

  return (
    <PhoneFrame>
      <div className="flex h-full flex-col px-7 pt-10 pb-7">
        <header className="flex items-center justify-between">
          <button
            className="grid h-9 w-9 place-items-center rounded-full text-foreground hover:bg-slate-50 transition-colors cursor-pointer"
            aria-label="Back"
            onClick={goBack}
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
          </button>
          <h2 className="text-[17px] font-bold tracking-tight">Edit transaction</h2>
          <button
            className="grid h-9 w-9 place-items-center rounded-full text-[var(--danger)] hover:bg-slate-50 transition-colors cursor-pointer"
            aria-label="Delete"
            onClick={() => navigate('delete_confirm')}
          >
            <Trash2 className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </header>

        <div className="mt-6 flex flex-col items-center">
          <div
            className={`grid h-14 w-14 place-items-center rounded-2xl shadow-[var(--shadow-tile)] ${
              txn.usd < 0
                ? 'bg-[oklch(0.96_0.05_25)] text-[var(--danger)]'
                : 'bg-[oklch(0.95_0.08_150)] text-[var(--success)]'
            }`}
          >
            <ArrowDownLeft
              className={`h-6 w-6 ${txn.usd < 0 ? 'rotate-180' : ''}`}
              strokeWidth={2.25}
            />
          </div>
          <div className="mt-3 flex items-center justify-center gap-1">
            {amountPrefix && (
              <span className="text-[20px] font-bold text-muted-foreground">{amountPrefix}</span>
            )}
            <input
              value={amount}
              onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              className="w-40 bg-transparent text-center text-[34px] font-extrabold tracking-tight text-foreground outline-none border-b border-transparent focus:border-[var(--primary)]"
            />
            {amountSuffix && (
              <span className="text-[20px] font-bold text-muted-foreground">{amountSuffix}</span>
            )}
          </div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
            {currencyInputLabel(currency)}
          </p>
        </div>

        <div className="mt-5 space-y-2">
          <label
            htmlFor="transaction-description"
            className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
          >
            Description
          </label>
          <input
            id="transaction-description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full rounded-2xl bg-white px-4 py-3 text-[13px] font-semibold text-foreground shadow-[var(--shadow-soft)] outline-none border border-transparent focus:border-[var(--primary)]"
          />
        </div>

        <div className="mt-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Category
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {categoryOptions.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all active:scale-95 cursor-pointer ${
                  category === c
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-white text-foreground shadow-[var(--shadow-soft)]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          className="mt-auto w-full rounded-full bg-[oklch(0.18_0.04_265)] py-4 text-[15px] font-semibold text-white active:scale-95 transition-transform cursor-pointer"
        >
          Save changes
        </button>
      </div>
    </PhoneFrame>
  )
}
