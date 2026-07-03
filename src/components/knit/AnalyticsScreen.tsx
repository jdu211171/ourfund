import { ArrowLeft, TrendingUp } from 'lucide-react'
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { formatUsdAsCurrency } from '@/lib/currency'
import { useAppNavigation } from '@/lib/navigation'
import { Money } from './Money'
import { PhoneFrame } from './PhoneFrame'

export function AnalyticsScreen() {
  const {
    navigate,
    goBack,
    currentMonthTransactions,
    categories,
    currency,
    categorySpentUsd,
    incomeUsd,
    spentUsd
  } = useAppNavigation()
  const expenses = currentMonthTransactions.filter(transaction => transaction.usd < 0)
  const pieData = (
    categories.length > 0
      ? categories.map(category => ({
          name: category.label,
          value: categorySpentUsd(category.label),
          color: category.color
        }))
      : Array.from(new Set(expenses.map(transaction => transaction.category))).map(
          (category, index) => ({
            name: category,
            value: expenses
              .filter(transaction => transaction.category === category)
              .reduce((sum, transaction) => sum + Math.abs(transaction.usd), 0),
            color: [
              'oklch(0.55 0.24 265)',
              'oklch(0.65 0.22 200)',
              'oklch(0.7 0.18 150)',
              'oklch(0.65 0.22 30)',
              'oklch(0.65 0.22 320)'
            ][index % 5]
          })
        )
  ).filter(item => item.value > 0)
  const bars = ['1', '2', '3', '4', '5'].map((label, index) => {
    const txn = currentMonthTransactions[index]
    return {
      m: label,
      income: txn && txn.usd > 0 ? txn.usd : 0,
      expense: txn && txn.usd < 0 ? Math.abs(txn.usd) : 0
    }
  })
  const savedUsd = incomeUsd - spentUsd

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
          <h2 className="text-[17px] font-bold tracking-tight">Analytics</h2>
          <span className="h-9 w-9" />
        </header>

        <div className="mt-4 rounded-3xl bg-white p-4 shadow-[var(--shadow-soft)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Current spending
              </p>
              <div className="mt-0.5">
                <Money usd={spentUsd} size="lg" tone="danger" />
              </div>
              <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--success)]">
                <TrendingUp className="h-3 w-3" strokeWidth={2.5} />
                {savedUsd >= 0 ? 'Income covers spending' : 'Spending above income'}
              </p>
            </div>
            <div className="h-[110px] w-[110px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    innerRadius={32}
                    outerRadius={50}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {pieData.map(d => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-2 text-[10px]">
                <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                <span className="text-muted-foreground">{d.name}</span>
                <span className="ml-auto font-bold text-foreground">
                  {formatUsdAsCurrency(d.value, currency, { maximumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </div>
          {pieData.length === 0 && (
            <button
              onClick={() => navigate('add_expense')}
              className="mt-3 w-full rounded-2xl bg-[var(--muted)] py-3 text-[12px] font-semibold text-foreground"
            >
              Add expense to build analytics
            </button>
          )}
        </div>

        <p className="mt-5 text-[13px] font-bold text-[oklch(0.2_0.08_265)]">Income vs expense</p>
        <div className="mt-2 rounded-2xl bg-white p-3 shadow-[var(--shadow-soft)]">
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bars} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="m"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'oklch(0.55 0.02 260)' }}
                />
                <YAxis hide />
                <Bar
                  dataKey="income"
                  fill="oklch(0.7 0.18 150)"
                  radius={[4, 4, 0, 0]}
                  barSize={10}
                />
                <Bar
                  dataKey="expense"
                  fill="oklch(0.55 0.24 265)"
                  radius={[4, 4, 0, 0]}
                  barSize={10}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 flex items-center justify-center gap-4 text-[10px]">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-[oklch(0.7_0.18_150)]" /> Income
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-[oklch(0.55_0.24_265)]" /> Expense
            </span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            {
              l: 'Saved',
              v: formatUsdAsCurrency(savedUsd, currency, { maximumFractionDigits: 0 })
            },
            {
              l: 'Avg txn',
              v: formatUsdAsCurrency(spentUsd / Math.max(expenses.length, 1), currency, {
                maximumFractionDigits: 0
              })
            },
            { l: 'Entries', v: `${currentMonthTransactions.length}` }
          ].map(s => (
            <div key={s.l} className="rounded-2xl bg-white py-3 shadow-[var(--shadow-soft)]">
              <p className="text-[10px] text-muted-foreground">{s.l}</p>
              <p className="mt-0.5 text-[13px] font-extrabold text-foreground">{s.v}</p>
            </div>
          ))}
        </div>
      </div>
    </PhoneFrame>
  )
}
