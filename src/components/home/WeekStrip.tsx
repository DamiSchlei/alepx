import { useTranslation } from 'react-i18next'
import { cx } from '@/components/ui/primitives'
import { blockContext, tasksForDay } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { weekDayKeys } from '@/domain/dates'
import type { AlephState } from '@/domain/types'

function weekdayShort(dayKey: string, localeTag: string): string {
  const date = new Date(`${dayKey}T12:00:00`)
  return new Intl.DateTimeFormat(localeTag, { weekday: 'short' }).format(date)
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

/** Mon–Sun strip synced to the active day on Home. */
export function WeekStrip({
  activeDay,
  todayKey,
  localeTag,
  onSelectDay,
}: {
  activeDay: string
  todayKey: string
  localeTag: string
  onSelectDay: (dayKey: string) => void
}) {
  const { t } = useTranslation()
  const state = useAleph()
  const days = weekDayKeys(activeDay)

  return (
    <div className="flex gap-1.5 pt-1" role="list" aria-label={t('home.granularityWeek')}>
      {days.map((dayKey) => {
        const active = dayKey === activeDay
        const isToday = dayKey === todayKey
        const date = Number(dayKey.slice(8, 10))
        const dots = projectDotsForDay(state, dayKey)
        return (
          <button
            key={dayKey}
            type="button"
            role="listitem"
            onClick={() => onSelectDay(dayKey)}
            aria-current={active ? 'date' : undefined}
            className={cx(
              'flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center rounded-[16px] px-0.5 py-1.5 transition-colors',
              active
                ? 'border border-violet bg-violet-soft text-violet'
                : 'border border-line bg-surface text-ink-3 hover:border-line-strong hover:bg-subtle',
            )}
          >
            <span
              className={cx(
                'text-[10px] font-semibold tracking-[0.12em] uppercase',
                active ? 'text-violet' : 'text-ink-3',
              )}
            >
              {weekdayShort(dayKey, localeTag)}
            </span>
            <span
              className={cx(
                'mt-0.5 text-[15px] font-semibold tabular-nums',
                active ? 'text-violet' : 'text-ink',
              )}
            >
              {date}
            </span>
            <span className="mt-0.5 flex h-1.5 items-center justify-center gap-0.5" aria-hidden>
              {isToday ? <span className="size-1 rounded-full bg-violet" /> : null}
              {dots.map((color) => (
                <span
                  key={color}
                  className="size-1 rounded-full"
                  style={{ backgroundColor: color }}
                />
              ))}
              {!isToday && dots.length === 0 ? <span className="size-1 bg-transparent" /> : null}
            </span>
          </button>
        )
      })}
    </div>
  )
}
