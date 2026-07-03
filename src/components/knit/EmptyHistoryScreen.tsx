import { ArrowLeft, Plus, Receipt, Search } from 'lucide-react'
import { useAppNavigation } from '@/lib/navigation'
import { BottomNav } from './BottomNav'
import { PhoneFrame } from './PhoneFrame'

export function EmptyHistoryScreen() {
  const { goBack, navigate, setHistoryFilters } = useAppNavigation()

  return (
    <PhoneFrame>
      <div className="flex h-full flex-col px-7 pt-10 pb-28">
        <header className="flex items-center justify-between">
          <button
            onClick={goBack}
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-slate-50 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
          </button>
          <h2 className="text-[17px] font-bold tracking-tight">History</h2>
          <button
            onClick={() => navigate('history_search')}
            className="grid h-9 w-9 place-items-center rounded-full bg-[var(--muted)]"
            aria-label="Search"
          >
            <Search className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </header>

        <div className="mt-3 flex gap-2">
          {['All', 'Expense', 'Income', 'Transfer'].map((t, i) => (
            <button
              key={t}
              onClick={() => {
                setHistoryFilters({
                  kind: t === 'Transfer' ? 'All' : (t as 'All' | 'Expense' | 'Income')
                })
                navigate('history_search')
              }}
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                i === 0
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-white text-foreground shadow-[var(--shadow-soft)]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-auto mb-auto flex flex-col items-center text-center px-4">
          <div
            className="grid h-20 w-20 place-items-center rounded-3xl text-[var(--primary)] shadow-[var(--shadow-soft)]"
            style={{ background: 'oklch(0.97 0.02 265)' }}
          >
            <Receipt className="h-8 w-8" strokeWidth={2} />
          </div>
          <h3 className="mt-5 font-display text-[20px] tracking-tight text-foreground">
            No transactions yet
          </h3>
          <p className="mt-1.5 text-[12px] text-muted-foreground max-w-[220px]">
            Tap the <span className="font-semibold text-foreground">+</span> button to log your
            first expense or income.
          </p>
          <button
            onClick={() => navigate('add_expense')}
            className="mt-5 flex items-center gap-2 rounded-full bg-[oklch(0.18_0.04_265)] px-5 py-3 text-[13px] font-semibold text-white"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Add transaction
          </button>
        </div>
      </div>
      <BottomNav active="activity" />
    </PhoneFrame>
  )
}
