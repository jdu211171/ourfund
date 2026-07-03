const META_SEPARATOR = '||'
const DAY_MS = 24 * 60 * 60 * 1000

export type ScheduleFrequency = 'weekly' | 'monthly' | 'yearly'

export type ScheduleMeta = {
  frequency: ScheduleFrequency
  nextDate: string
  category?: string
}

type ParsedSchedule = {
  display: string
  meta: ScheduleMeta | null
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function parseISODate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

export function formatISODate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

function addMonths(date: Date, months: number) {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  const day = Math.min(date.getDate(), lastDay)
  return new Date(target.getFullYear(), target.getMonth(), day)
}

function addYears(date: Date, years: number) {
  const target = new Date(date.getFullYear() + years, date.getMonth(), 1)
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  const day = Math.min(date.getDate(), lastDay)
  return new Date(target.getFullYear(), target.getMonth(), day)
}

function ordinal(n: number) {
  if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`
  switch (n % 10) {
    case 1:
      return `${n}st`
    case 2:
      return `${n}nd`
    case 3:
      return `${n}rd`
    default:
      return `${n}th`
  }
}

function formatMonthDay(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatFrequencyLabel(meta: ScheduleMeta, nextDate: Date) {
  if (meta.frequency === 'weekly') {
    return `Weekly · ${nextDate.toLocaleDateString('en-US', { weekday: 'short' })}`
  }
  if (meta.frequency === 'monthly') {
    return `Monthly · ${ordinal(nextDate.getDate())}`
  }
  return `Yearly · ${formatMonthDay(nextDate)}`
}

function parseMeta(every: string): ParsedSchedule {
  const parts = every.split(META_SEPARATOR)
  if (parts.length < 2) {
    return { display: every, meta: null }
  }
  const display = parts[0].trim()
  const json = parts.slice(1).join(META_SEPARATOR).trim()
  try {
    const meta = JSON.parse(json) as ScheduleMeta
    if (!meta?.frequency || !meta.nextDate) {
      return { display, meta: null }
    }
    return { display, meta }
  } catch {
    return { display, meta: null }
  }
}

export function buildScheduleEvery(display: string, meta: ScheduleMeta) {
  return `${display} ${META_SEPARATOR} ${JSON.stringify(meta)}`
}

export function getScheduleDisplay(every: string) {
  return parseMeta(every).display
}

export function getScheduleInfo(every: string, today = new Date()) {
  const parsed = parseMeta(every)
  if (!parsed.meta) {
    return {
      display: parsed.display,
      meta: null,
      nextDate: null,
      daysUntil: null,
      frequencyLabel: parsed.display
    }
  }
  const baseDate = parseISODate(parsed.meta.nextDate)
  if (!baseDate) {
    return {
      display: parsed.display,
      meta: parsed.meta,
      nextDate: null,
      daysUntil: null,
      frequencyLabel: parsed.display
    }
  }
  const todayStart = startOfDay(today)
  let next = startOfDay(baseDate)
  let guard = 0
  while (next < todayStart && guard < 400) {
    if (parsed.meta.frequency === 'weekly') {
      next = addDays(next, 7)
    } else if (parsed.meta.frequency === 'monthly') {
      next = addMonths(next, 1)
    } else {
      next = addYears(next, 1)
    }
    guard += 1
  }
  const daysUntil = Math.ceil((next.getTime() - todayStart.getTime()) / DAY_MS)
  return {
    display: parsed.display,
    meta: parsed.meta,
    nextDate: next,
    daysUntil,
    frequencyLabel: formatFrequencyLabel(parsed.meta, next)
  }
}

export function formatNextDateLabel(info: ReturnType<typeof getScheduleInfo>) {
  if (!info.nextDate || info.daysUntil === null) return info.display
  if (info.daysUntil <= 0) return 'Due today'
  if (info.daysUntil === 1) return 'Due tomorrow'
  if (info.daysUntil <= 5) return `Due in ${info.daysUntil} days`
  return info.frequencyLabel
}

export function formatScheduleSubtext(
  info: ReturnType<typeof getScheduleInfo>,
  opts: { includeCategory?: boolean } = {}
) {
  const base = formatNextDateLabel(info)
  if (opts.includeCategory && info.meta?.category) {
    return `${info.meta.category} · ${base}`
  }
  return base
}

export function makeScheduleMeta(input: ScheduleMeta, today = new Date()) {
  const next = parseISODate(input.nextDate) ?? startOfDay(today)
  const display = formatFrequencyLabel(input, next)
  return {
    every: buildScheduleEvery(display, input),
    display,
    nextDate: formatISODate(next)
  }
}

export function nextDateFromWeekday(weekday: string, today = new Date()) {
  const map: Record<string, number> = {
    sun: 0,
    sunday: 0,
    mon: 1,
    monday: 1,
    tue: 2,
    tuesday: 2,
    wed: 3,
    wednesday: 3,
    thu: 4,
    thursday: 4,
    fri: 5,
    friday: 5,
    sat: 6,
    saturday: 6
  }
  const key = weekday.trim().toLowerCase()
  const target = map[key] ?? today.getDay()
  const diff = (target - today.getDay() + 7) % 7
  const next = addDays(startOfDay(today), diff)
  return formatISODate(next)
}
