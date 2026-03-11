const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number]

const STORAGE_KEY = 'meal-plan-start-day'

export function getStartDay(): DayOfWeek {
  if (typeof window === 'undefined') return 'Monday'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && DAYS_OF_WEEK.includes(stored as DayOfWeek)) {
    return stored as DayOfWeek
  }
  return 'Monday'
}

export function setStartDay(day: DayOfWeek) {
  localStorage.setItem(STORAGE_KEY, day)
}

export function getDayIndex(day: DayOfWeek): number {
  return DAYS_OF_WEEK.indexOf(day)
}

/**
 * Get 7 dates for a week starting from `startDay`, containing `referenceDate`.
 */
export function getWeekDates(referenceDate: Date, startDay: DayOfWeek): Date[] {
  const refDay = referenceDate.getDay() // 0=Sun, 6=Sat
  const startIndex = getDayIndex(startDay)

  // How many days back from referenceDate to the start of this week
  let diff = refDay - startIndex
  if (diff < 0) diff += 7

  const weekStart = new Date(referenceDate)
  weekStart.setDate(referenceDate.getDate() - diff)

  const dates: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    dates.push(d)
  }
  return dates
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatWeekRange(dates: Date[]): string {
  if (dates.length === 0) return ''
  const first = dates[0]
  const last = dates[dates.length - 1]
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${first.toLocaleDateString('en-US', opts)} – ${last.toLocaleDateString('en-US', opts)}`
}

export function formatDayLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function isToday(date: Date): boolean {
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

export { DAYS_OF_WEEK }
