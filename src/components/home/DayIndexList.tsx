import { closedHoursForDay, lostHoursForDay } from '@/data/dayLoad'
import { tasksForDay } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { addDays, parseLocal, toDayKey, weekDayKeys } from '@/domain/dates'
import { formatHours } from '@/i18n/format'

function dayRowLabel(dayKey: string, localeTag: string): string {
  const date = parseLocal(dayKey)
  const weekday = new Intl.DateTimeFormat(localeTag, { weekday: 'long' }).format(date)
  return `${weekday} ${date.getDate()}`
}

/**
 * ÍNDICE de otros días (una sola fila por día):
 * Domingo 20    Sin tareas
 * Lunes 21      Sin tareas
 * Tap = ese día al visor. Pasado con hueco: “5 h sin cerrar” (una sola frase).
 */
export function DayIndexList({
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
  const state = useAleph()
  const locale = state.character.locale
  const cap = state.character.dailyHourCap ?? 5

  // Show the other days of the current week plus surrounding 7 days, excluding activeDay
  const weekDays = weekDayKeys(activeDay)
  // Also next week start days so the user has immediate access to upcoming days
  const nextDays = [1, 2, 3].map((offset) => toDayKey(addDays(weekDays[6], offset)))
  const candidateDays = Array.from(new Set([...weekDays, ...nextDays]))
  const otherDays = candidateDays.filter((d) => d !== activeDay)

  return (
    <section className="mt-6 border-t border-line pt-4 pb-20">
      <h3 className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-wider text-ink-3">
        Otros días
      </h3>
      <div className="divide-y divide-line overflow-hidden rounded-[16px] border border-line bg-white">
        {otherDays.map((dayKey) => {
          const tasks = tasksForDay(state, dayKey)
          const isPast = dayKey < todayKey
          const isToday = dayKey === todayKey
          const closed = closedHoursForDay(state, dayKey)
          const lost = lostHoursForDay(cap, closed)

          let statusText: string
          if (tasks.length === 0) {
            if (isPast && lost > 0) {
              statusText = `${formatHours(lost, locale)} h sin cerrar`
            } else {
              statusText = 'Sin tareas'
            }
          } else {
            const totalHours = tasks.reduce(
              (sum, tk) => sum + (tk.actualHours ?? tk.estimatedHours),
              0,
            )
            const countLabel = tasks.length === 1 ? '1 tarea' : `${tasks.length} tareas`
            statusText = `${countLabel} · ${formatHours(totalHours, locale)} h`
          }

          return (
            <button
              key={dayKey}
              type="button"
              onClick={() => onSelectDay(dayKey)}
              className="flex min-h-[48px] w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-subtle active:bg-subtle/80"
            >
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-medium capitalize text-ink">
                  {dayRowLabel(dayKey, localeTag)}
                </span>
                {isToday ? (
                  <span className="rounded-full bg-[#f5f0ff] px-2 py-0.5 text-[11px] font-medium text-[#7a3fe0]">
                    Hoy
                  </span>
                ) : null}
              </div>

              <span
                className={`text-[13px] tabular-nums ${
                  tasks.length === 0 && isPast && lost > 0
                    ? 'text-amber-600 font-medium'
                    : tasks.length > 0
                      ? 'text-ink-2 font-medium'
                      : 'text-ink-4'
                }`}
              >
                {statusText}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
