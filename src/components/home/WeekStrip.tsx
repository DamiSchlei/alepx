import { cx } from '@/components/ui/primitives'
import { weekDayKeys } from '@/domain/dates'

function weekdayShort(dayKey: string, localeTag: string): string {
  const date = new Date(`${dayKey}T12:00:00`)
  return new Intl.DateTimeFormat(localeTag, { weekday: 'short' }).format(date)
}

/** Mon–Sun strip synced to the active day on Home. Día activo: pastilla lila. */
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
  const days = weekDayKeys(activeDay)

  return (
    <div className="flex gap-1.5 pt-1" role="list" aria-label="Semana">
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
              'flex min-h-[50px] min-w-0 flex-1 flex-col items-center justify-center rounded-[14px] px-0.5 py-1.5 transition-all active:scale-95',
              active
                ? 'bg-[#f5f0ff] border border-[#7a3fe0] text-[#7a3fe0] shadow-xs'
                : 'bg-white border border-line text-ink-3 hover:border-line-strong hover:bg-subtle',
            )}
          >
            <span
              className={cx(
                'text-[10px] font-semibold tracking-wider uppercase',
                active ? 'text-[#7a3fe0]' : 'text-ink-3',
              )}
            >
              {weekdayShort(dayKey, localeTag)}
            </span>
            <span
              className={cx(
                'mt-0.5 text-[15px] font-bold tabular-nums',
                active ? 'text-[#7a3fe0]' : 'text-ink',
              )}
            >
              {date}
            </span>
            {isToday ? (
              <span
                aria-hidden
                className={cx('mt-0.5 size-1 rounded-full', active ? 'bg-[#7a3fe0]' : 'bg-[#7a3fe0]/70')}
              />
            ) : (
              <span aria-hidden className="mt-0.5 size-1" />
            )}
          </button>
        )
      })}
    </div>
  )
}
