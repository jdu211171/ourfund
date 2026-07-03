import { ArrowDownLeft, ArrowLeft, Download, Edit3, Share2 } from 'lucide-react'
import { useState } from 'react'
import { getRelativeDateString } from '@/context/helpers'
import { useAppNavigation } from '@/lib/navigation'
import { Money } from './Money'
import { PhoneFrame } from './PhoneFrame'

export function TransactionDetailScreen() {
  const { goBack, navigate, selectedTransactionId, transactions } = useAppNavigation()
  const [shared, setShared] = useState(false)

  // Find dynamic transaction
  const txn =
    transactions.find(t => t.id === selectedTransactionId) || transactions.find(t => t.usd < 0)

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
            <h2 className="text-[17px] font-bold tracking-tight">Expense</h2>
            <span className="h-9 w-9" />
          </header>
          <button
            onClick={() => navigate('add_expense')}
            className="m-auto rounded-3xl bg-white px-5 py-6 text-center shadow-[var(--shadow-soft)]"
          >
            <p className="text-[14px] font-bold text-foreground">No expense selected</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Add an expense to see its details.
            </p>
          </button>
        </div>
      </PhoneFrame>
    )
  }

  const rows = [
    ['Status', 'Posted'],
    ['Wallet', txn.wallet],
    ['Paid by', txn.who.split(' · ')[0] || 'You'],
    ['Category', txn.category],
    ['Merchant', txn.name],
    [
      'Date',
      (() => {
        const rel = getRelativeDateString(txn.date, new Date())
        return rel === 'today' || rel === 'yesterday' ? `${rel} 18:24` : `${rel}, 18:24`
      })()
    ]
  ]

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
          <h2 className="text-[17px] font-bold tracking-tight">Expense</h2>
          <button
            onClick={() => setShared(true)}
            className="grid h-9 w-9 place-items-center rounded-full text-foreground"
            aria-label="Share"
          >
            <Share2 className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </header>

        <div className="mt-6 flex flex-col items-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[oklch(0.96_0.05_25)] text-[var(--danger)] shadow-[var(--shadow-tile)]">
            <ArrowDownLeft className="h-6 w-6 rotate-180" strokeWidth={2.25} />
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">
            {txn.category} · {txn.name}
          </p>
          <div className="mt-2 inline-block">
            <Money usd={txn.usd} size="xl" tone="danger" signed />
          </div>
          <span className="mt-2 rounded-full bg-[oklch(0.95_0.08_150)] px-3 py-0.5 text-[10px] font-semibold text-[var(--success)]">
            {shared ? 'Shared with family' : 'Within budget'}
          </span>
        </div>

        <div className="mt-6 rounded-3xl bg-white p-4 shadow-[var(--shadow-soft)]">
          {rows.map(([k, v], i) => (
            <div
              key={k}
              className={`flex items-center justify-between py-2.5 ${
                i < rows.length - 1 ? 'border-b border-[oklch(0.94_0.01_265)]' : ''
              }`}
            >
              <span className="text-[11px] text-muted-foreground">{k}</span>
              <span className="text-[12px] font-semibold text-foreground">{v}</span>
            </div>
          ))}
        </div>

        <div className="mt-auto flex gap-3">
          <button
            onClick={() => navigate('receipt')}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--muted)] py-3 text-[13px] font-semibold text-foreground cursor-pointer"
          >
            <Download className="h-4 w-4" strokeWidth={2.25} />
            Receipt
          </button>
          <button
            onClick={() => navigate('edit_expense')}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[oklch(0.18_0.04_265)] py-3 text-[13px] font-semibold text-white cursor-pointer"
          >
            <Edit3 className="h-4 w-4" strokeWidth={2.25} />
            Edit
          </button>
        </div>
      </div>
    </PhoneFrame>
  )
}
