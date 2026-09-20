import { useTranslation } from 'react-i18next'
import { cx } from '@/components/ui/primitives'
import { weekDayKeys } from '@/domain/dates'

function weekdayShort(dayKey: string, localeTag: string): string {
  const date = new Date(`${dayKey}T12:00:00`)
  return new Intl.DateTimeFormat(localeTag, { weekday: 'short' }).format(date)
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
  const days = weekDayKeys(activeDay)

  return (
    <div className="flex gap-1.5 pt-1" role="list" aria-label={t('home.granularityWeek')}>
      {days.map((dayKey) => {
        const active = dayKey === activeDay
        const isToday = dayKey === todayKey
        const date = Number(dayKey.slice(8, 10))
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
            <span
              aria-hidden
              className={cx(
                'mt-0.5 size-1 rounded-full',
                isToday ? 'bg-violet' : 'bg-transparent',
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
