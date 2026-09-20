import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { DayTaskClock } from './DayTaskClock'
import { cx } from '@/components/ui/primitives'
import { tasksForDay } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { addDays, parseLocal, toDayKey } from '@/domain/dates'

interface DayCarouselProps {
  activeDay: string
  todayKey: string
  localeTag: string
  onSelectDay: (dayKey: string) => void
  onOpenCanvas: (dayKey: string) => void
  onQuickAdd: (dayKey: string) => void
}

const BUFFER_DAYS = 21

function dayDistance(a: string, b: string): number {
  const ms = parseLocal(a).getTime() - parseLocal(b).getTime()
  return Math.round(ms / 86_400_000)
}

export function DayCarousel({
  activeDay,
  todayKey,
  localeTag,
  onSelectDay,
  onOpenCanvas,
  onQuickAdd,
}: DayCarouselProps) {
  const { t } = useTranslation()
  const state = useAleph()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const programmatic = useRef(false)

  const days = useMemo(() => {
    const list: string[] = []
    for (let i = -BUFFER_DAYS; i <= BUFFER_DAYS; i++) {
      list.push(toDayKey(addDays(todayKey, i)))
    }
    return list
  }, [todayKey])

  useLayoutEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const el = container.querySelector<HTMLElement>(`[data-day="${activeDay}"]`)
    if (!el) return
    programmatic.current = true
    const left = el.offsetLeft - (container.clientWidth - el.offsetWidth) / 2
    container.scrollTo({ left: Math.max(0, left), behavior: 'auto' })
    const release = window.setTimeout(() => {
      programmatic.current = false
    }, 80)
    return () => window.clearTimeout(release)
  }, [activeDay])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const syncFromScroll = () => {
      if (programmatic.current) return
      const center = container.scrollLeft + container.clientWidth / 2
      let closest = activeDay
      let closestDist = Number.POSITIVE_INFINITY
      for (const node of container.querySelectorAll<HTMLElement>('[data-day]')) {
        const mid = node.offsetLeft + node.offsetWidth / 2
        const dist = Math.abs(mid - center)
        if (dist < closestDist) {
          closestDist = dist
          closest = node.dataset.day ?? closest
        }
      }
      if (closest && closest !== activeDay) onSelectDay(closest)
    }

    container.addEventListener('scrollend', syncFromScroll)
    container.addEventListener('scroll', syncFromScroll, { passive: true })
    return () => {
      container.removeEventListener('scrollend', syncFromScroll)
      container.removeEventListener('scroll', syncFromScroll)
    }
  }, [activeDay, onSelectDay])

  return (
    <div className="relative flex flex-col pt-3">
      <div
        ref={scrollContainerRef}
        className="no-scrollbar flex snap-x snap-mandatory items-start gap-3 overflow-x-auto px-[6%] py-1"
      >
        {days.map((day) => {
          const selected = day === activeDay
          const isToday = day === todayKey
          const nearby = Math.abs(dayDistance(day, activeDay)) <= 1
          const dayTasks = nearby ? tasksForDay(state, day) : []
          const dateObj = parseLocal(day)
          const weekday = new Intl.DateTimeFormat(localeTag, { weekday: 'short' }).format(dateObj)
          const dayNum = dateObj.getDate()

          return (
            <article
              key={day}
              data-day={day}
              onClick={() => onSelectDay(day)}
              className={cx(
                'w-[92%] max-w-[400px] shrink-0 snap-center rounded-[28px] border bg-surface p-5 transition-all',
                selected
                  ? 'relative z-10 border-violet shadow-[var(--shadow-day)] ring-4 ring-violet/10'
                  : 'z-0 border-line opacity-70 shadow-paper',
              )}
            >
              <header className="mb-3 flex items-baseline gap-2">
                <h3 className="text-[20px] font-semibold capitalize tracking-tight text-ink">
                  {weekday} {dayNum}
                </h3>
                {isToday ? (
                  <span className="rounded-full bg-violet-soft px-2 py-0.5 text-[11px] font-semibold text-violet">
                    {t('common.today')}
                  </span>
                ) : null}
              </header>

              {nearby ? (
                <div className={selected ? undefined : 'pointer-events-none'}>
                  <DayTaskClock
                    tasks={dayTasks}
                    activeDay={day}
                    todayKey={todayKey}
                    localeTag={localeTag}
                    compact={!selected}
                    onOpenCanvas={selected ? () => onOpenCanvas(day) : undefined}
                    onQuickAdd={selected ? () => onQuickAdd(day) : undefined}
                  />
                </div>
              ) : (
                <div className="h-[236px]" />
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
