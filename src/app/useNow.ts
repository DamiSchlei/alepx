/**
 * useNow.ts
 *
 * React hook that ticks the current time at a rate appropriate for the context.
 *
 * - Normal mode: updates every 1 second.
 * - prefers-reduced-motion: updates every 15 seconds, no second hand.
 * - When `active` is false the interval is paused (carousel day ≠ today or day
 *   is past/future).
 */

import { useState, useEffect } from 'react'

/** Returns true when the user prefers reduced motion. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return reduced
}

export interface NowState {
  /** Current local time. */
  now: Date
  /** Whether the second hand should be rendered (false when reduced motion). */
  showSeconds: boolean
}

/**
 * Provides a reactive current time for the civil clock.
 *
 * @param active       When false, the interval is suspended (saves battery).
 *                     Pass `dayRelation === 'today'` from the call site.
 * @param reducedMotion Override from outside; if not provided, reads the
 *                     OS preference via usePrefersReducedMotion().
 */
export function useNow(active: boolean, reducedMotion?: boolean): NowState {
  const systemReduced = usePrefersReducedMotion()
  const reduced = reducedMotion ?? systemReduced

  const [now, setNow] = useState<Date>(() => new Date())

  useEffect(() => {
    if (!active) return
    const intervalMs = reduced ? 15_000 : 1_000
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [active, reduced])

  return { now, showSeconds: !reduced }
}
