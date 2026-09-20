import { describe, expect, it } from 'vitest'
import {
  classifyClockHour,
  countActiveInactiveHours,
  hourHasElapsed,
  hourOverlaps,
  type ClockPlacement,
} from './clockHours'

const done: ClockPlacement = {
  startHour: 9,
  endHour: 11,
  done: true,
  isExecuting: false,
  color: '#7a3fe0',
  title: 'Write brief',
}

describe('hourOverlaps', () => {
  it('detects a task sitting inside an hour', () => {
    expect(hourOverlaps(9.25, 10.5, 9)).toBe(true)
    expect(hourOverlaps(9.25, 10.5, 10)).toBe(true)
    expect(hourOverlaps(9.25, 10.5, 11)).toBe(false)
  })

  it('wraps overnight tasks', () => {
    expect(hourOverlaps(23, 1, 23)).toBe(true)
    expect(hourOverlaps(23, 1, 0)).toBe(true)
    expect(hourOverlaps(23, 1, 2)).toBe(false)
  })
})

describe('hourHasElapsed', () => {
  it('marks every hour elapsed on a past day', () => {
    expect(hourHasElapsed(3, true, false, 18)).toBe(true)
  })

  it('uses the live clock on today', () => {
    expect(hourHasElapsed(8, false, true, 10.2)).toBe(true)
    expect(hourHasElapsed(11, false, true, 10.2)).toBe(false)
  })
})

describe('classifyClockHour', () => {
  it('prefers an executing task over a completed one', () => {
    const executing: ClockPlacement = {
      ...done,
      isExecuting: true,
      done: false,
      title: 'Live',
      color: '#c47a00',
    }
    const slot = classifyClockHour(9, [done, executing], false, true, 10)
    expect(slot.stateType).toBe('active')
    expect(slot.title).toBe('Live')
    expect(slot.executing).toBe(true)
  })

  it('marks idle elapsed hours without a task', () => {
    const slot = classifyClockHour(7, [done], false, true, 10)
    expect(slot.stateType).toBe('inactive')
  })

  it('keeps future hours free', () => {
    const slot = classifyClockHour(18, [done], false, true, 10)
    expect(slot.stateType).toBe('future_free')
  })
})

describe('countActiveInactiveHours', () => {
  it('counts painted hours across the full day', () => {
    expect(countActiveInactiveHours([done], false, true, 12)).toEqual({
      activeHours: 2,
      inactiveHours: 10,
    })
  })
})
