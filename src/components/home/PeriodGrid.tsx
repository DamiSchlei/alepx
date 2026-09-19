import { TaskBlockChip } from '@/components/home/TaskBlock'
import { cx } from '@/components/ui/primitives'
import { closedHoursForDay } from '@/data/dayLoad'
import { blockContext, tasksForDay } from '@/data/selectors'
import { useAleph } from '@/data/store'
import {
  isoWeekday,
  isoWeekNumber,
  monthDayKeys,
  parseLocal,
  toDayKey,
  weekDayKeys,
} from '@/domain/dates'
import { isTaskDone } from '@/domain/economy'
import { formatHours } from '@/i18n/format'
import type { AlephState } from '@/domain/types'

function weekdayHeaders(localeTag: string): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(2024, 0, 1 + i)
    return new Intl.DateTimeFormat(localeTag, { weekday: 'short' }).format(date)
  })
}

function periodDayKeys(mode: 'week' | 'month', anchorDay: string): string[] {
  return mode === 'week' ? weekDayKeys(anchorDay) : monthDayKeys(anchorDay)
}

function periodStats(state: AlephState, dayKeys: string[]) {
  let closedBlocks = 0
  let onTime = 0
  let hours = 0
  for (const dayKey of dayKeys) {
    hours += closedHoursForDay(state, dayKey)
    for (const task of tasksForDay(state, dayKey)) {
      if (!isTaskDone(task.status)) continue
      closedBlocks += 1
      if (task.status === 'done_on_time') onTime += 1
    }
  }
  return { closedBlocks, onTime, hours }
}

function formatWeekHeadingSpec(anchorDay: string, localeTag: string): string {
  const days = weekDayKeys(anchorDay)
  const first = parseLocal(days[0])
  const last = parseLocal(days[6])
  const wNum = isoWeekNumber(anchorDay)
  const monthName = new Intl.DateTimeFormat(localeTag, { month: 'short' }).format(last)
  const year = last.getFullYear()
  return `Semana ${wNum} · ${first.getDate()}–${last.getDate()} ${monthName} ${year}`
}

export function PeriodGrid({
  mode,
  anchorDay,
  todayKey,
  localeTag,
  onOpenDay,
}: {
  mode: 'week' | 'month'
  anchorDay: string
  todayKey: string
  localeTag: string
  onOpenDay: (dayKey: string) => void
}) {
  const state = useAleph()
  const locale = state.character.locale
  const dayKeys = periodDayKeys(mode, anchorDay)
  const stats = periodStats(state, dayKeys)
  const lead = mode === 'month' ? isoWeekday(dayKeys[0] ?? anchorDay) - 1 : 0
  const monthKey = toDayKey(parseLocal(anchorDay)).slice(0, 7)

  // Total tasks count in period
  const totalTasksInPeriod = dayKeys.reduce(
    (sum, dk) => sum + tasksForDay(state, dk).length,
    0,
  )

  const title =
    mode === 'week'
      ? formatWeekHeadingSpec(anchorDay, localeTag)
      : new Intl.DateTimeFormat(localeTag, { month: 'long', year: 'numeric' }).format(
          parseLocal(anchorDay),
        )

  // Stats for month: "3 cerradas · 3 a tiempo · 3,5 h"
  const monthStatsLabel = `${stats.closedBlocks} cerradas · ${stats.onTime} a tiempo · ${formatHours(stats.hours, locale)} h`

  return (
    <section className="flex flex-col gap-4 pb-24 pt-3">
      <div>
        <h2 className="text-[20px] font-semibold capitalize text-ink">{title}</h2>
        {mode === 'month' ? (
          <p className="mt-1 text-[13px] font-medium text-ink-3">{monthStatsLabel}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {weekdayHeaders(localeTag).map((label, index) => (
          <p
            key={`${label}-${index}`}
            className="py-1 text-center text-[11px] font-semibold tracking-[0.08em] text-ink-3 uppercase"
          >
            {label}
          </p>
        ))}
        {Array.from({ length: lead }, (_, index) => (
          <div key={`lead-${index}`} aria-hidden />
        ))}
        {dayKeys.map((dayKey) => (
          <DayCell
            key={dayKey}
            mode={mode}
            dayKey={dayKey}
            today={dayKey === todayKey}
            muted={mode === 'month' && !dayKey.startsWith(monthKey)}
            onOpen={() => onOpenDay(dayKey)}
          />
        ))}
      </div>

      {mode === 'week' && totalTasksInPeriod === 0 ? (
        <p className="py-4 text-center text-[14px] text-ink-3">
          No hay marcas esta semana.
        </p>
      ) : null}
    </section>
  )
}

function DayCell({
  mode,
  dayKey,
  today,
  muted,
  onOpen,
}: {
  mode: 'week' | 'month'
  dayKey: string
  today: boolean
  muted?: boolean
  onOpen: () => void
}) {
  const state = useAleph()
  const tasks = tasksForDay(state, dayKey)
  const date = Number(dayKey.slice(8, 10))

  if (mode === 'month') {
    // Días con marcas = puntos de color de terreno. Tap → Día.
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-current={today ? 'date' : undefined}
        aria-label={dayKey}
        className={cx(
          'flex min-h-[52px] flex-col items-center justify-start rounded-[12px] p-1 text-center transition-all hover:bg-subtle active:scale-95',
          today
            ? 'bg-[#f5f0ff] border border-[#7a3fe0] text-[#7a3fe0]'
            : 'border border-line bg-white text-ink',
          muted && 'opacity-30',
        )}
      >
        <span
          className={cx(
            'text-[13px] font-semibold tabular-nums',
            today ? 'text-[#7a3fe0]' : 'text-ink',
          )}
        >
          {date}
        </span>
        {tasks.length > 0 ? (
          <div className="mt-1 flex flex-wrap justify-center gap-1">
            {tasks.slice(0, 4).map((task) => {
              const ctx = blockContext(state, task)
              return (
                <span
                  key={task.id}
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: ctx.color }}
                  title={task.title}
                />
              )
            })}
            {tasks.length > 4 ? (
              <span className="size-1 rounded-full bg-ink-4" />
            ) : null}
          </div>
        ) : null}
      </button>
    )
  }

  // Week mode: 7 celdas. Chips: punto del color del terreno + título corto.
  const visible = tasks.slice(0, 3)
  const overflow = tasks.length - visible.length

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-current={today ? 'date' : undefined}
      aria-label={dayKey}
      className={cx(
        'flex min-h-[5.5rem] flex-col items-stretch gap-0.5 rounded-[12px] border border-line bg-white p-1.5 text-left transition-all hover:border-line-strong active:scale-[0.98]',
        today ? 'bg-[#f5f0ff] border-[#7a3fe0] ring-1 ring-[#7a3fe0]/30' : '',
      )}
    >
      <span
        className={cx(
          'text-[13px] font-bold tabular-nums',
          today ? 'text-[#7a3fe0]' : 'text-ink',
        )}
      >
        {date}
      </span>
      {visible.map((task) => (
        <TaskBlockChip key={task.id} task={task} />
      ))}
      {overflow > 0 ? (
        <span className="text-[10px] font-medium text-ink-3">+{overflow} más</span>
      ) : null}
    </button>
  )
}
