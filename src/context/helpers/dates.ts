import type { Transaction } from '../../types/domain'

export function plusDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

export function firstName(name: string) {
  return name.trim().split(' ').filter(Boolean)[0] ?? 'You'
}

export function formatISODate(date: Date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function getRelativeDateString(date: string, now: Date): string {
  const parsed = transactionDate(date, now)
  if (!parsed) return date

  const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const parsedStart = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
  const diffTime = nowStart.getTime() - parsedStart.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ]
  return `${monthNames[parsed.getMonth()]} ${parsed.getDate()}`
}

export function formatTransactionWho(who: string, date: string, now: Date = new Date()): string {
  const baseWho = who.split(' · ')[0] ?? 'You'
  const relativeDate = getRelativeDateString(date, now)
  return `${baseWho} · ${relativeDate}`
}

export function transactionDate(date: string, now: Date) {
  const text = date.trim().toLowerCase()
  if (text.includes('today') || text.includes('just now')) return now
  if (text.includes('yesterday')) return plusDays(now, -1)

  const daysAgo = text.match(/^(\d+)\s+days?\s+ago/)
  if (daysAgo) return plusDays(now, -Number(daysAgo[1]))

  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))

  const monthNames = [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec'
  ]
  const monthDay = text.match(/^([a-z]{3})[a-z]*\.?\s+(\d{1,2})/)
  if (monthDay) {
    const month = monthNames.indexOf(monthDay[1])
    if (month >= 0) return new Date(now.getFullYear(), month, Number(monthDay[2]))
  }

  const parsed = new Date(date)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function isCurrentMonthTransaction(transaction: Transaction, now: Date) {
  const parsed = transactionDate(transaction.date, now)
  return (
    parsed !== null &&
    parsed.getFullYear() === now.getFullYear() &&
    parsed.getMonth() === now.getMonth()
  )
}
