import { useLayoutEffect, useMemo, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cx } from '@/components/ui/primitives'
import { blockContext, tasksForDay } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { addDays, daysBetween, parseLocal, toDayKey } from '@/domain/dates'
import type { AlephState } from '@/domain/types'

function weekdayShort(dayKey: string, localeTag: string): string {
  const date = parseLocal(dayKey)
  return new Intl.DateTimeFormat(localeTag, { weekday: 'short' })
    .format(date)
    .replace('.', '')
}

function monthShort(dayKey: string, localeTag: string): string {
  const date = parseLocal(dayKey)
  return new Intl.DateTimeFormat(localeTag, { month: 'short' })
    .format(date)
    .replace('.', '')
}

function projectDotsForDay(state: AlephState, dayKey: string, max = 3): string[] {
  const colors: string[] = []
  for (const task of tasksForDay(state, dayKey)) {
    const color = blockContext(state, task).projectColor || 'var(--color-violet)'
    if (!colors.includes(color)) colors.push(color)
    if (colors.length >= max) break
  }
  return colors
}

interface ContinuousDayCarouselProps {
  activeDay: string
  todayKey: string
  localeTag: string
  onSelectDay: (dayKey: string) => void
  onToday?: () => void
}

/**
 * Continuous Day Carousel spanning at least 25 days backwards and 25 days forwards.
 * Auto-centers on activeDay and allows smooth horizontal swipe/scroll.
 */
export function ContinuousDayCarousel({
  activeDay,
  todayKey,
  localeTag,
  onSelectDay,
  onToday: _onToday,
}: ContinuousDayCarouselProps) {
  const state = useAleph()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const isFirstRender = useRef(true)

  // Generate continuous range: at least 25 days before and 25 days after both today and activeDay
  const days = useMemo(() => {
    const activeDate = parseLocal(activeDay)
    const todayDate = parseLocal(todayKey)
    const minTime = Math.min(activeDate.getTime(), todayDate.getTime())
    const maxTime = Math.max(activeDate.getTime(), todayDate.getTime())

    const span = 25
    const startDate = addDays(new Date(minTime), -span)
    const endDate = addDays(new Date(maxTime), span)

    const totalCount = daysBetween(startDate, endDate) + 1
    return Array.from({ length: totalCount }, (_, i) => toDayKey(addDays(startDate, i)))
  }, [activeDay, todayKey])

  // Center active day on mount and when activeDay changes
  useLayoutEffect(() => {
    const el = itemRefs.current.get(activeDay)
    const container = scrollContainerRef.current
    if (!el || !container) return

    if (isFirstRender.current) {
      // Direct positioning on initial load without animation delay
      const left = el.offsetLeft - container.clientWidth / 2 + el.clientWidth / 2
      container.scrollLeft = Math.max(0, left)
      isFirstRender.current = false
    } else {
      el.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      })
    }
  }, [activeDay])

  const scrollByAmount = (offset: number) => {
    if (!scrollContainerRef.current) return
    scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' })
  }

  return (
    <div className="relative w-full select-none">
      {/* Scroll navigation arrows for desktop / convenience */}
      <button
        type="button"
        onClick={() => scrollByAmount(-220)}
        aria-label="Días anteriores"
        className="absolute -left-2 top-1/2 z-10 -translate-y-1/2 flex size-7 items-center justify-center rounded-full border border-line bg-surface/90 text-ink-3 shadow-xs hover:text-ink hover:bg-surface active:scale-95 transition-all opacity-0 hover:opacity-100 sm:opacity-70"
      >
        <ChevronLeft className="size-4" />
      </button>

      <button
        type="button"
        onClick={() => scrollByAmount(220)}
        aria-label="Días siguientes"
        className="absolute -right-2 top-1/2 z-10 -translate-y-1/2 flex size-7 items-center justify-center rounded-full border border-line bg-surface/90 text-ink-3 shadow-xs hover:text-ink hover:bg-surface active:scale-95 transition-all opacity-0 hover:opacity-100 sm:opacity-70"
      >
        <ChevronRight className="size-4" />
      </button>

      {/* Horizontal Continuous Scroll Strip */}
      <div
        ref={scrollContainerRef}
        role="list"
        aria-label="Carrusel continuo de días"
        className="no-scrollbar flex w-full items-center gap-1.5 overflow-x-auto py-1 px-1 scroll-smooth snap-x"
        style={{
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {days.map((dayKey, index) => {
          const isActive = dayKey === activeDay
          const isToday = dayKey === todayKey
          const dateNum = Number(dayKey.slice(8, 10))
          const dots = projectDotsForDay(state, dayKey)
          const isFirstOfMonth = dateNum === 1
          const prevDayKey = index > 0 ? days[index - 1] : null
          const monthChanged = prevDayKey && prevDayKey.slice(5, 7) !== dayKey.slice(5, 7)

          return (
            <button
              key={dayKey}
              type="button"
              role="listitem"
              ref={(node) => {
                if (node) itemRefs.current.set(dayKey, node)
                else itemRefs.current.delete(dayKey)
              }}
              onClick={() => onSelectDay(dayKey)}
              aria-current={isActive ? 'date' : undefined}
              className={cx(
                'group relative flex min-w-[50px] sm:min-w-[54px] flex-col items-center justify-between rounded-[18px] px-1 py-1.5 transition-all shrink-0 active:scale-95 snap-center',
                isActive
                  ? 'bg-violet text-white shadow-paper ring-2 ring-violet/25 font-bold scale-[1.04]'
                  : isToday
                    ? 'border border-violet/40 bg-violet-soft/40 text-violet hover:bg-violet-soft'
                    : 'border border-line/80 bg-surface text-ink hover:border-violet/30 hover:bg-subtle/70',
              )}
              style={{ height: '62px' }}
            >
              {/* Month label for month beginnings */}
              {(isFirstOfMonth || monthChanged) && !isActive && (
                <span className="absolute -top-2 rounded-full bg-ink px-1.5 py-0.2 text-[8.5px] font-bold uppercase text-white shadow-2xs">
                  {monthShort(dayKey, localeTag)}
                </span>
              )}

              {/* Weekday abbreviation */}
              <span
                className={cx(
                  'text-[10px] font-semibold tracking-wider uppercase',
                  isActive ? 'text-white/80' : isToday ? 'text-violet font-bold' : 'text-ink-3',
                )}
              >
                {weekdayShort(dayKey, localeTag)}
              </span>

              {/* Day number */}
              <span
                className={cx(
                  'text-[16px] font-bold tabular-nums leading-none',
                  isActive ? 'text-white' : isToday ? 'text-violet' : 'text-ink',
                )}
              >
                {dateNum}
              </span>

              {/* Indicators: Today dot / Project dots */}
              <div className="flex h-1.5 items-center justify-center gap-0.5" aria-hidden>
                {isToday ? (
                  <span
                    className={cx(
                      'size-1.5 rounded-full',
                      isActive ? 'bg-amber-300' : 'bg-violet',
                    )}
                    title="Hoy"
                  />
                ) : null}
                {dots.map((color, dotIdx) => (
                  <span
                    key={`${dayKey}-dot-${dotIdx}`}
                    className={cx('size-1 rounded-full', isActive && 'opacity-90')}
                    style={{ backgroundColor: isActive ? '#ffffff' : color }}
                  />
                ))}
                {!isToday && dots.length === 0 ? (
                  <span className="size-1 bg-transparent" />
                ) : null}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
