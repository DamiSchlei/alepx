/**
 * civilClock.ts
 *
 * Pure, testable domain for the daily civil clock shown in DayTaskClock.
 * No React, no side-effects, no imports from other layers.
 *
 * Geometry convention: 12 o'clock = 0°, angles grow clockwise.
 *   3:00  → 90°
 *   6:00  → 180°
 *   9:00  → 270°
 *  12:00  → 0° / 360°
 *
 * The clock face always represents 12 civil hours (AM or PM).
 * The daily "work window" (cap) is informational only — it never compresses the dial.
 */

import type { Task, TaskStatus } from './types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DayPeriod = 'am' | 'pm'
export type DayRelation = 'past' | 'today' | 'future'

export interface ClockBlock {
  taskId: string
  title: string
  status: TaskStatus
  /** Degrees from 12 o'clock (start of the arc). */
  startAngle: number
  /** Degrees from 12 o'clock (end of the arc). */
  endAngle: number
  /** Color derived from terreno / result; caller provides it. */
  color: string
  period: DayPeriod
}

export interface NowAngles {
  /** Hour hand angle in degrees. */
  hour: number
  /** Minute hand angle in degrees. */
  minute: number
  /** Second hand angle in degrees (very subtle). */
  second: number
}

// ---------------------------------------------------------------------------
// Angle helpers
// ---------------------------------------------------------------------------

/**
 * Hour hand angle for a given local time.
 * Formula: ((h % 12) + m/60 + s/3600) × 30
 */
export function analogAngleDeg(hours: number, minutes: number, seconds = 0): number {
  return ((hours % 12) + minutes / 60 + seconds / 3600) * 30
}

/**
 * Minute hand angle for a given local time.
 * Formula: (m + s/60) × 6
 */
export function minuteAngleDeg(minutes: number, seconds = 0): number {
  return (minutes + seconds / 60) * 6
}

/**
 * Second hand angle.
 * Formula: s × 6
 */
export function secondAngleDeg(seconds: number): number {
  return seconds * 6
}

/**
 * All three hand angles for a given Date.
 */
export function nowAngles(date: Date): NowAngles {
  const h = date.getHours()
  const m = date.getMinutes()
  const s = date.getSeconds()
  return {
    hour: analogAngleDeg(h, m, s),
    minute: minuteAngleDeg(m, s),
    second: secondAngleDeg(s),
  }
}

// ---------------------------------------------------------------------------
// Period & Day relation
// ---------------------------------------------------------------------------

/** Returns 'am' or 'pm' for the given local Date. */
export function periodFromDate(date: Date): DayPeriod {
  return date.getHours() < 12 ? 'am' : 'pm'
}

/**
 * Returns the period that a given hour (0-23) falls in.
 * Midnight (0) is 'am'.
 */
export function periodFromHour(hour: number): DayPeriod {
  return hour < 12 ? 'am' : 'pm'
}

/**
 * Compares a day key (YYYY-MM-DD) against today's key.
 */
export function dayRelation(dayKey: string, todayKey: string): DayRelation {
  if (dayKey < todayKey) return 'past'
  if (dayKey === todayKey) return 'today'
  return 'future'
}

// ---------------------------------------------------------------------------
// HH:mm parsing
// ---------------------------------------------------------------------------

/** Returns { hours, minutes } from a "HH:mm" string. */
function parseHHmm(hhMM: string): { hours: number; minutes: number } {
  const [hStr, mStr] = hhMM.split(':')
  return { hours: Number(hStr), minutes: Number(mStr) }
}

/** Civil hour as a decimal fraction.  e.g. 10:30 → 10.5 */
function hhmmToDecimal(hhMM: string): number {
  const { hours, minutes } = parseHHmm(hhMM)
  return hours + minutes / 60
}

/** Angle on the 12-hour dial for a civil time (hours can be 0-23). */
function civilTimeToAngle(civilHours: number, civilMinutes = 0): number {
  return analogAngleDeg(civilHours, civilMinutes)
}

// ---------------------------------------------------------------------------
// Block placement
// ---------------------------------------------------------------------------

const DEFAULT_WORK_START_HOUR = 9   // 09:00
const MIN_BLOCK_DURATION_HOURS = 0.25 // 15 minutes

/**
 * Converts a list of tasks scheduled on a single day into clock blocks
 * positioned on the 12-hour dial.
 *
 * Rules:
 * - Cancelled tasks are excluded.
 * - Tasks with scheduledStart are anchored to that civil time.
 * - Tasks without scheduledStart are stacked from workWindowStart (default 09:00),
 *   sorted by dayOrder ascending.
 * - Duration = (scheduledEnd − scheduledStart) if both exist;
 *   otherwise (actualHours ?? estimatedHours ?? 1), minimum 15 min.
 * - A block whose civil start is in [0,12) lives in the 'am' period;
 *   [12,24) lives in 'pm'.
 * - The arc angle maps the civil start/end times to the 12-hour dial of the
 *   corresponding period (0° = start of that 12-hour half).
 */
export function placeBlocksOnClock(
  tasks: Task[],
  taskColors: Record<string, string>,
  workWindowStart = DEFAULT_WORK_START_HOUR,
): ClockBlock[] {
  const visible = tasks.filter((t) => t.status !== 'cancelled')

  // Split into anchored (have scheduledStart) and floating (no scheduledStart).
  const anchored = visible.filter((t) => t.scheduledStart)
  const floating = visible
    .filter((t) => !t.scheduledStart)
    .sort((a, b) => (a.dayOrder ?? 999) - (b.dayOrder ?? 999))

  const blocks: ClockBlock[] = []

  // -- Anchored blocks --
  for (const task of anchored) {
    const startDecimal = hhmmToDecimal(task.scheduledStart!)
    let endDecimal: number

    if (task.scheduledEnd) {
      endDecimal = hhmmToDecimal(task.scheduledEnd)
    } else {
      const durationH = Math.max(
        task.actualHours ?? task.estimatedHours ?? 1,
        MIN_BLOCK_DURATION_HOURS,
      )
      endDecimal = startDecimal + durationH
    }

    const period = periodFromHour(Math.floor(startDecimal))
    const periodOffset = period === 'am' ? 0 : 12

    const startAngle = civilTimeToAngle(startDecimal - periodOffset)
    let endAngle = civilTimeToAngle(endDecimal - periodOffset)
    if (endAngle <= startAngle && endDecimal > startDecimal) {
      endAngle += 360
    }

    blocks.push({
      taskId: task.id,
      title: task.title,
      status: task.status,
      startAngle: Math.min(startAngle, 355),
      endAngle: Math.min(endAngle, 359),
      color: taskColors[task.id] ?? '#7a3fe0',
      period,
    })
  }

  // -- Floating blocks: stack from workWindowStart --
  let cursor = workWindowStart
  for (const task of floating) {
    const durationH = Math.max(
      task.actualHours ?? task.estimatedHours ?? 1,
      MIN_BLOCK_DURATION_HOURS,
    )
    const startDecimal = cursor
    const endDecimal = cursor + durationH

    const period = periodFromHour(Math.floor(startDecimal))
    const periodOffset = period === 'am' ? 0 : 12

    const startAngle = civilTimeToAngle(startDecimal - periodOffset)
    let endAngle = civilTimeToAngle(endDecimal - periodOffset)
    if (endAngle <= startAngle && endDecimal > startDecimal) {
      endAngle += 360
    }

    blocks.push({
      taskId: task.id,
      title: task.title,
      status: task.status,
      startAngle: Math.min(startAngle, 355),
      endAngle: Math.min(endAngle, 359),
      color: taskColors[task.id] ?? '#7a3fe0',
      period,
    })

    cursor = endDecimal
  }

  return blocks
}

/**
 * Filters blocks to those belonging to a given period.
 */
export function blocksInPeriod(blocks: ClockBlock[], period: DayPeriod): ClockBlock[] {
  return blocks.filter((b) => b.period === period)
}
