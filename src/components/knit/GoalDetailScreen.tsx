import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowDownLeft,
  ArrowLeft,
  Check,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  X
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { currencyAdornment, currencyValueToUsd, formatUsdAsCurrency } from '@/lib/currency'
import { useAppNavigation } from '@/lib/navigation'
import { GoalIcon, normalizeGoalIconName } from './goalIconOptions'
import { OptionSelect } from './OptionSelect'
import { PhoneFrame } from './PhoneFrame'

function ContributionItem({
  h,
  currency,
  canDelete,
  selectMode,
  isSelected,
  onToggleSelect
}: {
  h: any
  currency: any
  canDelete: boolean
  onDelete: () => void
  selectMode?: boolean
  isSelected?: boolean
  onToggleSelect?: () => void
}) {
  return (
    <div
      className={`relative mb-2 w-full overflow-hidden rounded-2xl bg-white px-3 py-2 flex items-center gap-3 shadow-[var(--shadow-soft)] text-left transition-all ${
        selectMode && canDelete ? 'cursor-pointer' : ''
      } ${isSelected ? 'ring-2 ring-[var(--primary)] ring-offset-1' : ''}`}
      onClick={selectMode && canDelete ? onToggleSelect : undefined}
    >
      {/* Checkbox — only shown for deletable rows in select mode */}
      {selectMode && (
        <div
          className={`flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
            canDelete
              ? isSelected
                ? 'bg-[var(--primary)] border-[var(--primary)]'
                : 'border-muted-foreground bg-transparent'
              : 'border-muted-foreground/30 bg-transparent opacity-30'
          }`}
        >
          {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
        </div>
      )}
      <div
        className="grid h-9 w-9 place-items-center rounded-full text-white text-[11px] font-bold flex-shrink-0"
        style={{
          background: 'linear-gradient(135deg, oklch(0.65 0.22 265), oklch(0.45 0.24 265))'
        }}
      >
        {h.initials}
      </div>
      <div className="flex-1 leading-tight min-w-0">
        <p className="truncate text-[12px] font-bold text-foreground">{h.who}</p>
        <p className="truncate text-[10px] text-muted-foreground">{h.date}</p>
      </div>
      <p
        className={`text-[12px] font-bold flex-shrink-0 ${h.amountUsd >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}
      >
        {formatUsdAsCurrency(h.amountUsd, currency, { signed: true })}
      </p>
    </div>
  )
}

export function GoalDetailScreen() {
  const {
    navigate,
    goBack,
    currency,
    goals,
    members,
    currentMemberId,
    selectedGoalId,
    setSelectedGoalId,
    contributeToGoal,
    deleteContributionFromGoal,
    deleteContributionsFromGoal,
    activeWallets,
    walletBalanceUsd
  } = useAppNavigation()
  const goal = goals.find(g => g.id === selectedGoalId) ?? goals[0]
  const [contribution, setContribution] = useState('0')
  const contributionHistoryRef = useRef<HTMLDivElement>(null)
  const contributionInputRef = useRef<HTMLInputElement>(null)
  const [selectedContributionId, _setSelectedContributionId] = useState<string | null>(null)
  const [selectedWalletId, setSelectedWalletId] = useState(activeWallets[0]?.id ?? '')
  const contributionAmount = Number.parseFloat(contribution || '0')
  const contributionUsd = currencyValueToUsd(
    Number.isFinite(contributionAmount) ? contributionAmount : 0,
    currency
  )
  const { prefix, suffix } = currencyAdornment(currency)
  const currentMember = members.find(member => member.id === currentMemberId)
  const currentMemberFirstName = currentMember?.name.split(' ')[0]?.trim().toLowerCase() ?? ''
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) newSet.delete(id)
      else newSet.add(id)
      return newSet
    })
  }

  const exitSelectMode = () => {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return
    deleteContributionsFromGoal(goal.id, [...selectedIds])
    exitSelectMode()
  }

  const canDeleteContribution = (entry: (typeof goal.history)[number]) => {
    if (entry.memberId) return entry.memberId === currentMemberId
    if (!currentMemberFirstName) return false
    return entry.who.trim().toLowerCase() === currentMemberFirstName
  }
  const selectedContribution = goal?.history?.find(entry => entry.id === selectedContributionId)
  const _canDeleteSelectedContribution =
    selectedContribution && canDeleteContribution(selectedContribution)

  useEffect(() => {
    if (!goal) return
    const frame = window.requestAnimationFrame(() => {
      contributionInputRef.current?.focus()
      contributionInputRef.current?.select()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [goal?.id, goal])

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
            <h2 className="text-[17px] font-bold tracking-tight">Goal Details</h2>
            <span className="h-9 w-9" />
          </header>

          <div className="m-auto rounded-3xl bg-white px-5 py-6 text-center shadow-[var(--shadow-soft)]">
            <p className="text-[14px] font-bold text-foreground">No goal selected</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Create a savings goal to track contributions.
            </p>
            <button
              onClick={() => navigate('new_goal')}
              className="mt-4 rounded-full bg-[var(--primary)] px-5 py-2.5 text-[12px] font-semibold text-white"
            >
              Create goal
            </button>
          </div>
        </div>
      </PhoneFrame>
    )
  }

  const pct = Math.min(100, Math.round((goal.savedUsd / goal.targetUsd) * 100))

  // Parse "YYYY-MM" target date and compute months remaining from today
  const monthsRemaining = (() => {
    if (!goal.targetDate || goal.targetDate === 'No deadline') return null
    const match = goal.targetDate.match(/^(\d{4})-(\d{2})$/)
    if (!match) return null
    const targetYear = parseInt(match[1], 10)
    const targetMonth = parseInt(match[2], 10) - 1 // 0-indexed
    const now = new Date()
    const months = (targetYear - now.getFullYear()) * 12 + (targetMonth - now.getMonth())
    return Math.max(1, months)
  })()

  const monthly =
    monthsRemaining != null ? Math.ceil((goal.targetUsd - goal.savedUsd) / monthsRemaining) : null

  // Format stored "YYYY-MM" into a human-readable label like "Aug 2026"
  const targetDateLabel = (() => {
    if (!goal.targetDate || goal.targetDate === 'No deadline') return 'No deadline'
    const match = goal.targetDate.match(/^(\d{4})-(\d{2})$/)
    if (!match) return goal.targetDate
    const d = new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, 1)
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  })()

  const goalIconName = normalizeGoalIconName(goal.icon)

  if (goal.savedUsd >= goal.targetUsd) {
    navigate('goal_achieved')
    return
  }


  return (
    <PhoneFrame>
      <div className="flex-1 overflow-y-auto flex flex-col px-7 pt-10 pb-7 min-h-0">
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
                className="grid h-9 w-9 place-items-center rounded-full text-foreground hover:bg-slate-50 transition-colors cursor-pointer"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5" strokeWidth={2.25} />
              </button>
              <h2 className="text-[17px] font-bold tracking-tight">Goal Details</h2>
              <div className="flex items-center gap-2">
                {goal.history.length > 0 && (
                  <button
                    onClick={() => {
                      setSelectMode(true)
                      setSelectedIds(new Set())
                    }}
                    className="grid h-9 w-9 place-items-center rounded-full bg-[var(--muted)] text-muted-foreground hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label="Select contributions"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={2.25} />
                  </button>
                )}
                <button
                  onClick={() => navigate('edit_goal')}
                  className="grid h-9 w-9 place-items-center rounded-full text-foreground hover:bg-slate-50 transition-colors cursor-pointer"
                  aria-label="Edit goal"
                >
                  <Pencil className="h-4 w-4" strokeWidth={2.25} />
                </button>
                <button
                  onClick={() => navigate('goal_withdraw')}
                  className="grid h-9 w-9 place-items-center rounded-full text-foreground hover:bg-slate-50 transition-colors cursor-pointer"
                  aria-label="Withdraw options"
                >
                  <MoreHorizontal className="h-5 w-5" strokeWidth={2.25} />
                </button>
              </div>
            </>
          )}
        </header>

        <div
          className="mt-5 overflow-hidden rounded-3xl p-5 text-white shadow-[var(--shadow-soft)]"
          style={{
            background: 'linear-gradient(135deg, oklch(0.45 0.24 265), oklch(0.65 0.22 265))'
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/60">{goal.title}</p>
              <p className="mt-1 text-[26px] font-extrabold tracking-tight">
                {formatUsdAsCurrency(goal.savedUsd, currency)}{' '}
                <span className="text-[14px] font-medium text-white/70">
                  of {formatUsdAsCurrency(goal.targetUsd, currency)}
                </span>
              </p>
            </div>
            <GoalIcon name={goalIconName} className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-white" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-white/80">
            <span>{pct}% saved</span>
            <span>Target · {targetDateLabel}</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            {
              l: 'Monthly',
              v: monthly != null ? formatUsdAsCurrency(monthly, currency) : '—',
              sub:
                monthly != null && monthsRemaining != null
                  ? `${monthsRemaining} mo left`
                  : 'No deadline'
            },
            { l: 'Saved', v: formatUsdAsCurrency(goal.savedUsd, currency), sub: null },
            {
              l: 'Remaining',
              v: formatUsdAsCurrency(Math.max(0, goal.targetUsd - goal.savedUsd), currency),
              sub: null
            }
          ].map(s => (
            <div key={s.l} className="rounded-2xl bg-white py-3 shadow-[var(--shadow-soft)]">
              <p className="text-[10px] text-muted-foreground">{s.l}</p>
              <p className="mt-0.5 text-[13px] font-extrabold text-foreground">{s.v}</p>
              {s.sub && <p className="text-[9px] text-muted-foreground mt-0.5">{s.sub}</p>}
            </div>
          ))}
        </div>

        <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Contributions
        </p>

        <div
          ref={contributionHistoryRef}
          className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1"
        >
          <AnimatePresence>
            {goal.history.map(h => (
              <motion.div
                key={h.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ContributionItem
                  h={h}
                  currency={currency}
                  canDelete={canDeleteContribution(h)}
                  onDelete={() => deleteContributionFromGoal(goal.id, h.id)}
                  selectMode={selectMode}
                  isSelected={selectedIds.has(h.id)}
                  onToggleSelect={() => toggleSelect(h.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-3 rounded-2xl bg-white py-3 shadow-[var(--shadow-soft)]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Add contribution
          </p>
          <div className="mt-1 flex items-center gap-2">
            {prefix && (
              <span className="text-[14px] font-bold text-muted-foreground">{prefix}</span>
            )}
            <input
              ref={contributionInputRef}
              type="text"
              inputMode="decimal"
              value={contribution}
              onChange={e => setContribution(e.target.value.replace(/[^0-9.]/g, ''))}
              onFocus={e => e.currentTarget.select()}
              autoFocus
              className="flex-1 bg-transparent text-[18px] font-extrabold text-foreground outline-none"
            />
            {suffix && (
              <span className="text-[11px] font-bold text-muted-foreground">{suffix}</span>
            )}
          </div>
          <div className="mt-3">
            <OptionSelect
              label="From wallet"
              value={selectedWalletId}
              options={activeWallets.map(wallet => ({
                value: wallet.id,
                label: wallet.label,
                description: `${wallet.sub} · ${formatUsdAsCurrency(walletBalanceUsd(wallet.label), currency)}`
              }))}
              onChange={setSelectedWalletId}
              emptyLabel="No wallet available"
              icon={<ArrowDownLeft className="h-5 w-5" strokeWidth={2.25} />}
            />
          </div>
        </div>

        <button
          onClick={() => {
            if (contributionUsd <= 0) return
            const reachedGoal = goal.savedUsd + contributionUsd >= goal.targetUsd
            contributeToGoal(goal.id, contributionUsd, undefined, selectedWalletId || undefined)
            setSelectedGoalId(goal.id)
            setContribution('0')

            if (reachedGoal) {
              navigate('goal_achieved')
              return
            }

            window.requestAnimationFrame(() => {
              contributionHistoryRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
              contributionInputRef.current?.focus()
              contributionInputRef.current?.select()
            })
          }}
          disabled={contributionUsd <= 0}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] py-4 text-[15px] font-semibold text-white active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Add contribution
        </button>
      </div>
    </PhoneFrame>
  )
}
