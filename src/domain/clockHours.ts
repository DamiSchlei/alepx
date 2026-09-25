export type ClockSlotState = 'active' | 'inactive' | 'future_free'

export interface ClockPlacement {
  startHour: number
  endHour: number
  done: boolean
  isExecuting: boolean
  color: string
  title: string
}

export function computeEndTime(startTime?: string, durationHours: number = 1): string {
  if (!startTime || !startTime.includes(':')) return ''
  const [hStr, mStr] = startTime.split(':')
  const h = Number(hStr)
  const m = Number(mStr)
  if (isNaN(h) || isNaN(m)) return ''
  const totalMinutes = Math.round(h * 60 + m + durationHours * 60) % (24 * 60)
  const endH = Math.floor(totalMinutes / 60)
  const endM = totalMinutes % 60
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
}

export function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  }
}

export function describeArc(
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) {
  if (endAngle - startAngle >= 359.9) {
    const p1 = polarToCartesian(x, y, radius, 0)
    const p2 = polarToCartesian(x, y, radius, 180)
    return `M ${p1.x} ${p1.y} A ${radius} ${radius} 0 1 1 ${p2.x} ${p2.y} A ${radius} ${radius} 0 1 1 ${p1.x} ${p1.y}`
  }

  const start = polarToCartesian(x, y, radius, endAngle)
  const end = polarToCartesian(x, y, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
  return ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(' ')
}

export function hourOverlaps(startHour: number, endHour: number, actualHour: number): boolean {
  const hourEnd = actualHour + 1
  if (startHour <= endHour) return startHour < hourEnd && endHour > actualHour
  return startHour < hourEnd || endHour > actualHour
}

export function hourHasElapsed(
  actualHour: number,
  isPastDay: boolean,
  isToday: boolean,
  currentDecimalHour: number,
): boolean {
  return isPastDay || (isToday && actualHour + 1 <= currentDecimalHour)
}

export function classifyClockHour(
  actualHour: number,
  placements: ClockPlacement[],
  isPastDay: boolean,
  isToday: boolean,
  currentDecimalHour: number,
): { stateType: ClockSlotState; color: string; title: string | null; executing: boolean } {
  const matching = placements.filter((placement) =>
    hourOverlaps(placement.startHour, placement.endHour, actualHour),
  )
  const executing = matching.find((placement) => placement.isExecuting)
  const completed = matching.find((placement) => placement.done)

  if (executing) {
    return { stateType: 'active', color: executing.color, title: executing.title, executing: true }
  }
  if (completed) {
    return { stateType: 'active', color: completed.color, title: completed.title, executing: false }
  }
  if (hourHasElapsed(actualHour, isPastDay, isToday, currentDecimalHour)) {
    return { stateType: 'inactive', color: 'var(--color-clock-inactive)', title: null, executing: false }
  }
  return { stateType: 'future_free', color: 'var(--color-clock-free)', title: null, executing: false }
}

export function countActiveInactiveHours(
  placements: ClockPlacement[],
  isPastDay: boolean,
  isToday: boolean,
  currentDecimalHour: number,
): { activeHours: number; inactiveHours: number } {
  let activeHours = 0
  let inactiveHours = 0
  for (let hour = 0; hour < 24; hour++) {
    const slot = classifyClockHour(hour, placements, isPastDay, isToday, currentDecimalHour)
    if (slot.stateType === 'active') activeHours += 1
    else if (slot.stateType === 'inactive') inactiveHours += 1
  }
  return { activeHours, inactiveHours }
}
