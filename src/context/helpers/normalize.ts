import { defaultHistoryFilters } from '../../lib/seed'
import type { BudgetMode, ReportPeriod, TxnKind } from '../../types/core'
import type { HistoryFilters } from '../../types/filters'
import type { Goal } from '../../types/goal'

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

export function normalizeBudgetModeInput(value: unknown): BudgetMode {
  return value === 'family' ? 'family' : 'personal'
}

export function normalizeReportPeriodInput(value: unknown): ReportPeriod {
  return value === 'Week' || value === 'Year' ? value : 'Month'
}

export function normalizeHistoryFiltersInput(value: unknown): HistoryFilters {
  const filters = asRecord(value)
  const kind = ['All', 'Expense', 'Income', 'Goals', 'Transfer'].includes(String(filters.kind))
    ? (filters.kind as TxnKind)
    : defaultHistoryFilters.kind
  const sort = ['Newest', 'Oldest', 'Highest amount', 'Lowest amount'].includes(
    String(filters.sort)
  )
    ? String(filters.sort)
    : defaultHistoryFilters.sort

  return {
    ...defaultHistoryFilters,
    kind,
    member: typeof filters.member === 'string' ? filters.member : defaultHistoryFilters.member,
    categories: Array.isArray(filters.categories)
      ? filters.categories.filter((category): category is string => typeof category === 'string')
      : defaultHistoryFilters.categories,
    sort,
    minUsd: Number.isFinite(Number(filters.minUsd))
      ? Number(filters.minUsd)
      : defaultHistoryFilters.minUsd,
    maxUsd: Number.isFinite(Number(filters.maxUsd))
      ? Number(filters.maxUsd)
      : defaultHistoryFilters.maxUsd
  }
}

export function canMemberSeeGoal(goal: Pick<Goal, 'contributors'>, memberId: string | null) {
  if (!memberId || goal.contributors.length === 0) return true
  return goal.contributors.includes(memberId)
}
