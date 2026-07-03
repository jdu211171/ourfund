import {
  ArrowLeft,
  Check,
  Home,
  Music,
  Pencil,
  Plus,
  Tag,
  Trash2,
  Tv,
  Wifi,
  X,
  Zap
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { currencyValueToUsd, formatUsdAsCurrency, usdToCurrencyValue } from '@/lib/currency'
import { useAppNavigation } from '@/lib/navigation'
import {
  formatISODate,
  formatScheduleSubtext,
  getScheduleInfo,
  makeScheduleMeta,
  type ScheduleFrequency
} from '@/lib/schedules'
import { Money } from './Money'
import { OptionSelect } from './OptionSelect'
import { PhoneFrame } from './PhoneFrame'

const icons = [Home, Zap, Wifi, Tv, Music]
const frequencyOptions: { value: ScheduleFrequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' }
]

const defaultNextScheduleDate = () => formatISODate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))

export function SubscriptionsScreen() {
  const {
    goBack,
    navigate,
    currency,
    addSubscription,
    subscriptions,
    categories,
    updateScheduleItem,
    deleteScheduleItem,
    deleteScheduleItems
  } = useAppNavigation()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<ScheduleFrequency>('monthly')
  const [nextDate, setNextDate] = useState(defaultNextScheduleDate)

  // Select mode
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const exitSelectMode = () => {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return
    deleteScheduleItems([...selectedIds])
    exitSelectMode()
  }
  const categoryOptions = useMemo(
    () => [
      ...categories.map(category => ({
        value: category.label,
        label: category.label,
        description: `${formatUsdAsCurrency(category.limitUsd, currency)} limit`
      })),
      { value: 'Uncategorized', label: 'Uncategorized' }
    ],
    [categories, currency]
  )
  const [category, setCategory] = useState(categoryOptions[0]?.value ?? 'Uncategorized')
  const amountUsd = currencyValueToUsd(Number(amount || 0), currency)
  const scheduleRows = subscriptions
    .map(item => ({ item, info: getScheduleInfo(item.every) }))
    .sort((a, b) => (a.info.daysUntil ?? 9999) - (b.info.daysUntil ?? 9999))
  const total = subscriptions.reduce((sum, item) => sum + item.amountUsd, 0)

  const resetForm = () => {
    setName('')
    setAmount('')
    setFrequency('monthly')
    setNextDate(defaultNextScheduleDate())
    setCategory(categoryOptions[0]?.value ?? 'Uncategorized')
    setEditingId(null)
  }

  const beginCreate = () => {
    resetForm()
    setShowForm(true)
  }

  const formatAmountInput = (amountUsdValue: number) => {
    const localAmount = usdToCurrencyValue(amountUsdValue, currency)
    return Number.isInteger(localAmount)
      ? String(localAmount)
      : localAmount.toFixed(2).replace(/\.?0+$/, '')
  }

  const beginEdit = (item: (typeof subscriptions)[number]) => {
    const info = getScheduleInfo(item.every)
    setEditingId(item.id)
    setName(item.label)
    setAmount(formatAmountInput(item.amountUsd))
    setFrequency(info.meta?.frequency ?? 'monthly')
    setNextDate(info.nextDate ? formatISODate(info.nextDate) : defaultNextScheduleDate())
    setCategory(info.meta?.category ?? categoryOptions[0]?.value ?? 'Uncategorized')
    setShowForm(true)
  }

  const removeSchedule = (id: string) => {
    if (editingId === id) {
      resetForm()
      setShowForm(false)
    }
    deleteScheduleItem(id)
  }

  const handleSave = () => {
    if (!name.trim() || !amountUsd || !nextDate) return
    const meta = makeScheduleMeta({ frequency, nextDate, category })
    const color = categories.find(c => c.label === category)?.color ?? 'oklch(0.65 0.22 30)'
    const payload = {
      label: name.trim(),
      amountUsd,
      every: meta.every,
      color,
      type: 'subscription' as const
    }

    if (editingId) {
      updateScheduleItem(editingId, payload)
    } else {
      addSubscription(payload)
    }

    resetForm()
    setShowForm(false)
  }

  return (
    <PhoneFrame>
      <div className="flex h-full flex-col px-7 pt-10 pb-7">
        <header className="flex items-center justify-between">
          {selectMode ? (
            <>
              <button
                onClick={exitSelectMode}
                className="grid h-9 w-9 place-items-center rounded-full text-foreground"
                aria-label="Cancel selection"
              >
                <X className="h-5 w-5" strokeWidth={2.25} />
              </button>
              <span className="text-[14px] font-bold text-foreground">
                {selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select entries'}
              </span>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedIds.size === 0}
                className="grid h-9 w-9 place-items-center rounded-full bg-red-50 text-red-500 disabled:opacity-30"
                aria-label="Delete selected"
              >
                <Trash2 className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={goBack}
                className="grid h-9 w-9 place-items-center rounded-full text-foreground"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
              </button>
              <h2 className="text-[17px] font-bold tracking-tight">Recurring</h2>
              <div className="flex items-center gap-1.5">
                {subscriptions.length > 0 && (
                  <button
                    onClick={() => {
                      setSelectMode(true)
                      setShowForm(false)
                    }}
                    className="grid h-9 w-9 place-items-center rounded-full bg-[var(--muted)] text-muted-foreground"
                    aria-label="Select entries"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={2.25} />
                  </button>
                )}
                <button
                  onClick={beginCreate}
                  className="grid h-9 w-9 place-items-center rounded-full bg-[var(--muted)]"
                  aria-label="Add subscription"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>
            </>
          )}
        </header>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Expenses
          </p>
          <button
            onClick={() => navigate('recurring_income')}
            className="text-[11px] font-bold text-[var(--primary)]"
          >
            Income schedules
          </button>
        </div>

        {showForm && (
          <div className="mt-4 space-y-3 rounded-3xl bg-white p-4 shadow-[var(--shadow-soft)]">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              {editingId ? 'Edit recurring expense' : 'New recurring expense'}
            </p>
            <div className="rounded-2xl bg-[var(--muted)] px-3 py-2">
              <p className="text-[10px] text-muted-foreground">Name</p>
              <input
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder="Rent, Electricity, Netflix"
                className="w-full bg-transparent text-[13px] font-semibold text-foreground outline-none"
              />
            </div>
            <div className="rounded-2xl bg-[var(--muted)] px-3 py-2">
              <p className="text-[10px] text-muted-foreground">Amount</p>
              <input
                value={amount}
                onChange={event => setAmount(event.target.value)}
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full bg-transparent text-[13px] font-semibold text-foreground outline-none"
              />
            </div>
            <OptionSelect
              label="Category"
              value={category}
              options={categoryOptions}
              onChange={setCategory}
              icon={<Tag className="h-5 w-5" strokeWidth={2.25} />}
              emptyLabel="Create a category first"
            />
            <OptionSelect
              label="Frequency"
              value={frequency}
              options={frequencyOptions}
              onChange={setFrequency}
              icon={<Home className="h-5 w-5" strokeWidth={2.25} />}
            />
            <div className="rounded-2xl bg-[var(--muted)] px-3 py-2">
              <p className="text-[10px] text-muted-foreground">Next date</p>
              <input
                value={nextDate}
                onChange={event => setNextDate(event.target.value)}
                type="date"
                className="w-full bg-transparent text-[13px] font-semibold text-foreground outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 rounded-full bg-[oklch(0.18_0.04_265)] py-3 text-[13px] font-semibold text-white"
              >
                {editingId ? 'Update schedule' : 'Save schedule'}
              </button>
              <button
                onClick={() => {
                  resetForm()
                  setShowForm(false)
                }}
                className="flex-1 rounded-full bg-[var(--muted)] py-3 text-[13px] font-semibold text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div
          className="mt-5 rounded-3xl p-5 text-white shadow-[var(--shadow-soft)]"
          style={{
            background: 'linear-gradient(135deg, oklch(0.45 0.24 265), oklch(0.65 0.22 265))'
          }}
        >
          <p className="text-[10px] uppercase tracking-widest text-white/60">Monthly recurring</p>
          <p className="mt-1 text-[28px] font-extrabold tracking-tight">
            {formatUsdAsCurrency(total, currency)}
          </p>
          <p className="text-[11px] text-white/70">Across {subscriptions.length} subscriptions</p>
        </div>

        <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Up next
        </p>

        <div className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {scheduleRows.map(({ item: s, info }, index) => {
            const Icon = icons[index % icons.length]
            const soon = info.daysUntil !== null && info.daysUntil <= 5
            const isSelected = selectedIds.has(s.id)
            return (
              <div
                key={s.id}
                onClick={selectMode ? () => toggleSelect(s.id) : undefined}
                className={`flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 shadow-[var(--shadow-soft)] transition-all ${
                  selectMode ? 'cursor-pointer' : ''
                } ${isSelected ? 'ring-2 ring-[var(--primary)] ring-offset-1' : ''}`}
              >
                {selectMode && (
                  <div
                    className={`flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[var(--primary)] border-[var(--primary)]'
                        : 'border-[var(--muted-foreground)] bg-transparent'
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                  </div>
                )}
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[oklch(0.95_0.04_265)] text-[var(--primary)]">
                  <Icon className="h-4 w-4" strokeWidth={2.25} />
                </div>
                <div className="flex-1 leading-tight min-w-0">
                  <p className="text-[12px] font-bold text-foreground truncate">{s.label}</p>
                  <p
                    className={`text-[10px] truncate ${soon ? 'text-[var(--danger)] font-semibold' : 'text-muted-foreground'}`}
                  >
                    {formatScheduleSubtext(info, { includeCategory: true })}
                  </p>
                </div>
                <Money usd={s.amountUsd} size="sm" />
                {!selectMode && (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => beginEdit(s)}
                      className="grid h-8 w-8 place-items-center rounded-full bg-[var(--muted)] text-foreground"
                      aria-label={`Edit ${s.label}`}
                    >
                      <Pencil className="h-3.5 w-3.5" strokeWidth={2.4} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSchedule(s.id)}
                      className="grid h-8 w-8 place-items-center rounded-full bg-[oklch(0.96_0.05_25)] text-[var(--danger)]"
                      aria-label={`Delete ${s.label}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={2.4} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
          {subscriptions.length === 0 && (
            <button
              onClick={beginCreate}
              className="w-full rounded-2xl bg-white px-4 py-5 text-center shadow-[var(--shadow-soft)]"
            >
              <p className="text-[13px] font-bold text-foreground">No recurring bills</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Add a subscription or bill to keep forecasts live.
              </p>
            </button>
          )}
        </div>

        <button
          onClick={beginCreate}
          className="mt-auto w-full rounded-full bg-[oklch(0.18_0.04_265)] py-4 text-[15px] font-semibold text-white"
        >
          Add new schedule
        </button>
      </div>
    </PhoneFrame>
  )
}
