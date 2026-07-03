import {
  ArrowLeft,
  Briefcase,
  Car,
  ChevronRight,
  Coffee,
  Home,
  ShoppingBag,
  TrendingDown,
  TrendingUp
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { formatTransactionWho } from '@/context/helpers'
import { formatUsdAsCurrency } from '@/lib/currency'
import { type Transaction, transactionDate, useAppNavigation } from '@/lib/navigation'
import { Money } from './Money'
import { PhoneFrame } from './PhoneFrame'

// ─── helpers ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`
}

function iconFor(txn: Transaction) {
  const text = `${txn.category} ${txn.name}`.toLowerCase()
  if (txn.usd > 0) return Briefcase
  if (text.includes('rent') || text.includes('housing') || text.includes('electric')) return Home
  if (text.includes('dining') || text.includes('coffee')) return Coffee
  if (text.includes('transport') || text.includes('gas')) return Car
  return ShoppingBag
}

// ─── types ───────────────────────────────────────────────────────────────────

type MonthData = {
  year: number
  month: number // 0-indexed
  label: string
  incomeUsd: number
  expenseUsd: number
  transactions: Transaction[]
}

// ─── component ───────────────────────────────────────────────────────────────

export function MonthlyHistoryScreen() {
  const { goBack, navigate, activeTransactions, setSelectedTransactionId, currency } =
    useAppNavigation()

  const now = useMemo(() => new Date(), [])

  // Opened month: null = list view, defined = detail view
  const [openMonth, setOpenMonth] = useState<{ year: number; month: number } | null>(null)

  // Build per-month summaries from real transactions (newest first)
  const monthRows = useMemo<MonthData[]>(() => {
    const map = new Map<string, MonthData>()

    for (const txn of activeTransactions) {
      const d = transactionDate(txn.date, now)
      if (!d) continue
      const year = d.getFullYear()
      const month = d.getMonth()
      const key = monthKey(year, month)
      if (!map.has(key)) {
        map.set(key, {
          year,
          month,
          label: `${MONTH_NAMES[month]} ${year}`,
          incomeUsd: 0,
          expenseUsd: 0,
          transactions: []
        })
      }
      const row = map.get(key)!
      row.transactions.push(txn)
      if (txn.usd > 0) row.incomeUsd += txn.usd
      else row.expenseUsd += Math.abs(txn.usd)
    }

    return Array.from(map.values()).sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year
      return b.month - a.month
    })
  }, [activeTransactions, now])

  const currentMonthData = monthRows[0] ?? null
  const netBalance = currentMonthData ? currentMonthData.incomeUsd - currentMonthData.expenseUsd : 0

  // ── Detail view ────────────────────────────────────────────────────────────
  if (openMonth) {
    const data = monthRows.find(r => r.year === openMonth.year && r.month === openMonth.month)
    if (data) {
      const net = data.incomeUsd - data.expenseUsd
      const isCurrentMonth = data.year === now.getFullYear() && data.month === now.getMonth()

      // Group by day label
      const groups: Record<string, Transaction[]> = {}
      for (const txn of [...data.transactions].sort((a, b) => b.id.localeCompare(a.id))) {
        const d = transactionDate(txn.date, now)
        const dayLabel = d
          ? d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
          : txn.date
        groups[dayLabel] = [...(groups[dayLabel] ?? []), txn]
      }

      return (
        <PhoneFrame>
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="px-7 pt-10">
              <header className="flex items-center justify-between">
                <button
                  onClick={() => setOpenMonth(null)}
                  className="grid h-9 w-9 place-items-center rounded-full text-foreground hover:bg-slate-50 transition-colors cursor-pointer"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
                </button>
                <h2 className="text-[17px] font-bold tracking-tight">
                  {data.label}
                  {isCurrentMonth && (
                    <span className="ml-2 text-[9px] font-bold uppercase tracking-widest text-[var(--primary)]">
                      · now
                    </span>
                  )}
                </h2>
                <span className="w-9" />
              </header>

              {/* Summary card */}
              <div className="mt-4 rounded-3xl bg-white p-4 shadow-[var(--shadow-soft)]">
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      Income
                    </p>
                    <p className="mt-1 text-[15px] font-extrabold text-[var(--success)]">
                      {formatUsdAsCurrency(data.incomeUsd, currency)}
                    </p>
                  </div>
                  <div className="w-px h-8 bg-[var(--muted)]" />
                  <div className="text-center flex-1">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      Expenses
                    </p>
                    <p className="mt-1 text-[15px] font-extrabold text-[var(--danger)]">
                      {formatUsdAsCurrency(data.expenseUsd, currency)}
                    </p>
                  </div>
                  <div className="w-px h-8 bg-[var(--muted)]" />
                  <div className="text-center flex-1">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      Net
                    </p>
                    <p
                      className={`mt-1 text-[15px] font-extrabold ${
                        net >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                      }`}
                    >
                      {net >= 0 ? '+' : ''}
                      {formatUsdAsCurrency(net, currency)}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] text-muted-foreground font-semibold">
                      Spent vs earned
                    </span>
                    <span className="text-[9px] text-muted-foreground font-semibold">
                      {data.incomeUsd > 0
                        ? Math.round((data.expenseUsd / data.incomeUsd) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--muted)]">
                    <div
                      className={`h-full rounded-full transition-all ${
                        data.expenseUsd > data.incomeUsd
                          ? 'bg-[var(--danger)]'
                          : 'bg-[var(--success)]'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          data.incomeUsd > 0 ? (data.expenseUsd / data.incomeUsd) * 100 : 0
                        )}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction list */}
            <div className="mt-4 flex-1 overflow-y-auto px-7 pb-7">
              {Object.keys(groups).length === 0 ? (
                <div className="mt-12 rounded-2xl bg-white px-4 py-8 text-center shadow-[var(--shadow-soft)]">
                  <p className="text-[13px] font-bold text-foreground">No transactions</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    No activity recorded for this month.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groups).map(([day, items]) => (
                    <div key={day}>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {day}
                      </p>
                      <div className="mt-2 space-y-2">
                        {items.map(txn => {
                          const Icon = iconFor(txn)
                          return (
                            <button
                              key={txn.id}
                              onClick={() => {
                                setSelectedTransactionId(txn.id)
                                navigate(txn.usd < 0 ? 'expense_detail' : 'income_detail')
                              }}
                              className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-2.5 text-left shadow-[var(--shadow-soft)] hover:shadow-md transition-shadow cursor-pointer"
                            >
                              <div
                                className={`grid h-9 w-9 place-items-center rounded-xl ${
                                  txn.usd >= 0
                                    ? 'bg-[oklch(0.95_0.06_145)] text-[var(--success)]'
                                    : 'bg-[oklch(0.95_0.04_265)] text-[var(--primary)]'
                                }`}
                              >
                                <Icon className="h-4 w-4" strokeWidth={2.25} />
                              </div>
                              <div className="flex-1 min-w-0 leading-tight">
                                <p className="text-[12px] font-bold text-foreground truncate">
                                  {txn.name}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {formatTransactionWho(txn.who, txn.date)}
                                </p>
                              </div>
                              <Money
                                usd={txn.usd}
                                size="sm"
                                tone={txn.usd < 0 ? 'danger' : 'success'}
                                signed
                              />
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </PhoneFrame>
      )
    }
  }

  // ── List view ──────────────────────────────────────────────────────────────
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
          <h2 className="text-[17px] font-bold tracking-tight">Monthly history</h2>
          <span className="w-9" />
        </header>

        {/* Net balance card */}
        <div className="mt-4 rounded-3xl bg-white p-5 shadow-[var(--shadow-soft)]">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {currentMonthData ? `${currentMonthData.label} net` : 'Net balance this month'}
          </p>
          <div className="mt-1">
            <Money
              usd={netBalance}
              size="lg"
              tone={netBalance >= 0 ? 'success' : 'danger'}
              signed
            />
          </div>
          {currentMonthData && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              <span className="font-semibold text-[var(--success)]">
                {formatUsdAsCurrency(currentMonthData.incomeUsd, currency)}
              </span>{' '}
              in ·{' '}
              <span className="font-semibold text-[var(--danger)]">
                {formatUsdAsCurrency(currentMonthData.expenseUsd, currency)}
              </span>{' '}
              out this month
            </p>
          )}
        </div>

        <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          {monthRows.length === 0 ? 'No data yet' : 'All months'}
        </p>

        {monthRows.length === 0 ? (
          <div className="mt-3 rounded-2xl bg-white px-4 py-8 text-center shadow-[var(--shadow-soft)]">
            <p className="text-[13px] font-bold text-foreground">No transactions yet</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Add transactions to see monthly history.
            </p>
          </div>
        ) : (
          <div className="mt-2 flex-1 space-y-2 overflow-y-auto">
            {monthRows.map((m, i) => {
              const net = m.incomeUsd - m.expenseUsd
              const positive = net >= 0
              const isCurrentMonth = m.year === now.getFullYear() && m.month === now.getMonth()
              return (
                <button
                  key={monthKey(m.year, m.month)}
                  onClick={() => setOpenMonth({ year: m.year, month: m.month })}
                  className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-3 text-left shadow-[var(--shadow-soft)] hover:shadow-md active:scale-[0.98] transition-all cursor-pointer"
                >
                  <div
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
                    style={{
                      background: positive ? 'oklch(0.96 0.06 145)' : 'oklch(0.96 0.06 25)',
                      color: positive ? 'var(--success)' : 'var(--danger)'
                    }}
                  >
                    {positive ? (
                      <TrendingUp className="h-4 w-4" strokeWidth={2.5} />
                    ) : (
                      <TrendingDown className="h-4 w-4" strokeWidth={2.5} />
                    )}
                  </div>
                  <div className="flex-1 leading-tight min-w-0">
                    <p className="text-[12px] font-bold text-foreground">
                      {m.label}
                      {isCurrentMonth && (
                        <span className="ml-1.5 text-[9px] font-bold uppercase tracking-widest text-[var(--primary)]">
                          · now
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      In{' '}
                      <span className="font-semibold text-[var(--success)]">
                        {formatUsdAsCurrency(m.incomeUsd, currency)}
                      </span>
                      {'  ·  '}
                      Out{' '}
                      <span className="font-semibold text-[var(--danger)]">
                        {formatUsdAsCurrency(m.expenseUsd, currency)}
                      </span>
                      {'  ·  '}
                      <span className="text-muted-foreground">
                        {m.transactions.length} txn{m.transactions.length !== 1 ? 's' : ''}
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Money usd={net} size="sm" tone={positive ? 'success' : 'danger'} signed />
                    <ChevronRight className="h-4 w-4 text-muted-foreground" strokeWidth={2.25} />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </PhoneFrame>
  )
}
