/**
 * civilClock.test.ts
 *
 * Unit tests for the civil clock domain.
 * Run with: npm test (vitest)
 */

import { describe, it, expect } from 'vitest'
import {
  analogAngleDeg,
  minuteAngleDeg,
  secondAngleDeg,
  nowAngles,
  periodFromDate,
  periodFromHour,
  dayRelation,
  placeBlocksOnClock,
  blocksInPeriod,
} from './civilClock'
import type { Task } from './types'

// ---------------------------------------------------------------------------
// Angle helpers
// ---------------------------------------------------------------------------

describe('analogAngleDeg', () => {
  it('12:00:00 → 0°', () => {
    expect(analogAngleDeg(12, 0, 0)).toBe(0)
  })

  it('0:00:00 → 0° (midnight ≡ 12)', () => {
    expect(analogAngleDeg(0, 0, 0)).toBe(0)
  })

  it('3:00:00 → 90°', () => {
    expect(analogAngleDeg(3, 0, 0)).toBe(90)
  })

  it('6:00:00 → 180°', () => {
    expect(analogAngleDeg(6, 0, 0)).toBe(180)
  })

  it('9:00:00 → 270°', () => {
    expect(analogAngleDeg(9, 0, 0)).toBe(270)
  })

  it('15:00 (3 PM) → 90° (same as 3 AM)', () => {
    expect(analogAngleDeg(15, 0, 0)).toBe(90)
  })

  it('3:30 → 105°  (3×30 + 0.5×30 = 90+15)', () => {
    expect(analogAngleDeg(3, 30, 0)).toBeCloseTo(105, 3)
  })
})

describe('minuteAngleDeg', () => {
  it('0 min → 0°', () => {
    expect(minuteAngleDeg(0, 0)).toBe(0)
  })

  it('15 min → 90°', () => {
    expect(minuteAngleDeg(15, 0)).toBe(90)
  })

  it('30 min → 180°', () => {
    expect(minuteAngleDeg(30, 0)).toBe(180)
  })

  it('45 min → 270°', () => {
    expect(minuteAngleDeg(45, 0)).toBe(270)
  })

  it('59 min 30 s → (59 + 0.5) × 6 = 357°', () => {
    expect(minuteAngleDeg(59, 30)).toBeCloseTo(357, 3)
  })
})

describe('secondAngleDeg', () => {
  it('0 s → 0°', () => {
    expect(secondAngleDeg(0)).toBe(0)
  })

  it('15 s → 90°', () => {
    expect(secondAngleDeg(15)).toBe(90)
  })

  it('30 s → 180°', () => {
    expect(secondAngleDeg(30)).toBe(180)
  })
})

describe('nowAngles', () => {
  it('returns three non-negative angles for an arbitrary date', () => {
    const d = new Date(2026, 8, 20, 10, 30, 15)
    const angles = nowAngles(d)
    expect(angles.hour).toBeGreaterThanOrEqual(0)
    expect(angles.minute).toBeGreaterThanOrEqual(0)
    expect(angles.second).toBeGreaterThanOrEqual(0)
  })

  it('10:30:00 hour angle = (10 + 0.5) × 30 = 315°', () => {
    const d = new Date(2026, 8, 20, 10, 30, 0)
    const angles = nowAngles(d)
    expect(angles.hour).toBeCloseTo(315, 3)
  })
})

// ---------------------------------------------------------------------------
// Period & Day relation
// ---------------------------------------------------------------------------

describe('periodFromDate', () => {
  it('hour < 12 → am', () => {
    expect(periodFromDate(new Date(2026, 8, 20, 9, 0, 0))).toBe('am')
  })

  it('hour >= 12 → pm', () => {
    expect(periodFromDate(new Date(2026, 8, 20, 14, 0, 0))).toBe('pm')
  })

  it('midnight (0:00) → am', () => {
    expect(periodFromDate(new Date(2026, 8, 20, 0, 0, 0))).toBe('am')
  })

  it('noon (12:00) → pm', () => {
    expect(periodFromDate(new Date(2026, 8, 20, 12, 0, 0))).toBe('pm')
  })
})

describe('periodFromHour', () => {
  it('9 → am', () => {
    expect(periodFromHour(9)).toBe('am')
  })

  it('13 → pm', () => {
    expect(periodFromHour(13)).toBe('pm')
  })
})

describe('dayRelation', () => {
  it('past day', () => {
    expect(dayRelation('2026-01-01', '2026-09-20')).toBe('past')
  })

  it('today', () => {
    expect(dayRelation('2026-09-20', '2026-09-20')).toBe('today')
  })

  it('future day', () => {
    expect(dayRelation('2027-01-01', '2026-09-20')).toBe('future')
  })
})

// ---------------------------------------------------------------------------
// Block placement
// ---------------------------------------------------------------------------

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: 'task-1',
    title: 'Test task',
    stage: 'execution',
    estimatedHours: 1,
    difficulty: 'medium',
    importance: 1,
    status: 'pending',
    rewardApplied: false,
    createdAt: '2026-09-20T00:00:00.000Z',
    ...overrides,
  }
}

describe('placeBlocksOnClock', () => {
  it('excludes cancelled tasks', () => {
    const t = makeTask({ status: 'cancelled' })
    const blocks = placeBlocksOnClock([t], {})
    expect(blocks).toHaveLength(0)
  })

  it('10:00–11:00 AM → period=am, startAngle≈300°, endAngle≈330°', () => {
    // 10:00 on AM dial: h=10, period offset=0
    // analogAngleDeg(10, 0) = 10 × 30 = 300°
    // 11:00: analogAngleDeg(11, 0) = 11 × 30 = 330°
    const t = makeTask({
      id: 'task-am',
      scheduledStart: '10:00',
      scheduledEnd: '11:00',
    })
    const blocks = placeBlocksOnClock([t], { 'task-am': '#7a3fe0' })
    expect(blocks).toHaveLength(1)
    expect(blocks[0].period).toBe('am')
    expect(blocks[0].startAngle).toBeCloseTo(300, 1)
    expect(blocks[0].endAngle).toBeCloseTo(330, 1)
  })

  it('14:00–15:00 PM → period=pm, startAngle≈60°, endAngle≈90°', () => {
    // 14:00 on PM dial: h=14-12=2, analogAngleDeg(2,0) = 60°
    // 15:00: analogAngleDeg(3,0) = 90°
    const t = makeTask({
      id: 'task-pm',
      scheduledStart: '14:00',
      scheduledEnd: '15:00',
    })
    const blocks = placeBlocksOnClock([t], { 'task-pm': '#0f9f6e' })
    expect(blocks).toHaveLength(1)
    expect(blocks[0].period).toBe('pm')
    expect(blocks[0].startAngle).toBeCloseTo(60, 1)
    expect(blocks[0].endAngle).toBeCloseTo(90, 1)
  })

  it('floating task stacks from default workWindowStart (9:00)', () => {
    const t = makeTask({ id: 'task-float', dayOrder: 1, estimatedHours: 1 })
    const blocks = placeBlocksOnClock([t], {})
    expect(blocks).toHaveLength(1)
    expect(blocks[0].period).toBe('am')
    // 09:00 on AM dial: analogAngleDeg(9,0) = 270°
    expect(blocks[0].startAngle).toBeCloseTo(270, 1)
    // 10:00: 300°
    expect(blocks[0].endAngle).toBeCloseTo(300, 1)
  })

  it('two floating tasks stack sequentially', () => {
    const t1 = makeTask({ id: 't1', dayOrder: 1, estimatedHours: 1 })
    const t2 = makeTask({ id: 't2', dayOrder: 2, estimatedHours: 2 })
    const blocks = placeBlocksOnClock([t1, t2], {})
    expect(blocks[0].startAngle).toBeCloseTo(270, 1) // 09:00
    expect(blocks[0].endAngle).toBeCloseTo(300, 1)   // 10:00
    expect(blocks[1].startAngle).toBeCloseTo(300, 1) // 10:00
    // 12:00 on a 12-hour dial = 0°/360°; we cap to 359 to avoid SVG full-circle edge case
    expect(blocks[1].endAngle).toBeLessThanOrEqual(359)
    expect(blocks[1].endAngle).toBeGreaterThanOrEqual(355)
  })
})

describe('blocksInPeriod', () => {
  const amBlock = {
    taskId: 'a',
    title: 'A',
    status: 'pending' as const,
    startAngle: 270,
    endAngle: 300,
    color: '#7a3fe0',
    period: 'am' as const,
  }
  const pmBlock = {
    taskId: 'b',
    title: 'B',
    status: 'done_on_time' as const,
    startAngle: 60,
    endAngle: 90,
    color: '#0f9f6e',
    period: 'pm' as const,
  }

  it('filters to am only', () => {
    expect(blocksInPeriod([amBlock, pmBlock], 'am')).toHaveLength(1)
    expect(blocksInPeriod([amBlock, pmBlock], 'am')[0].taskId).toBe('a')
  })

  it('filters to pm only', () => {
    expect(blocksInPeriod([amBlock, pmBlock], 'pm')).toHaveLength(1)
    expect(blocksInPeriod([amBlock, pmBlock], 'pm')[0].taskId).toBe('b')
  })
})
