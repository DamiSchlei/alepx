import { MiniDayClock, MicroDayClock } from '@/components/home/DayTaskClock'
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

  // Total tasks count and temporal progress in period
  const allPeriodTasks = dayKeys.flatMap((dk) => tasksForDay(state, dk))
  const completedPeriodTasks = allPeriodTasks.filter((t) => isTaskDone(t.status))
  const periodProgressPercent =
    allPeriodTasks.length > 0
      ? Math.round((completedPeriodTasks.length / allPeriodTasks.length) * 100)
      : 0

  // Project breakdown of completed tasks towards results
  const projectContributions: Record<string, { name: string; color: string; count: number }> = {}
  completedPeriodTasks.forEach((t) => {
    const ctx = blockContext(state, t)
    const pid = ctx.project?.id ?? 'loose'
    if (!projectContributions[pid]) {
      projectContributions[pid] = {
        name: ctx.project?.name ?? ctx.result?.name ?? 'Acciones sueltas',
        color: ctx.projectColor ?? '#7a3fe0',
        count: 0,
      }
    }
    projectContributions[pid].count += 1
  })

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

      {/* Barra de Avance Temporal hacia Resultados */}
      <div className="rounded-[16px] border border-line bg-white p-3.5 shadow-xs flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-ink">
              {mode === 'week' ? 'Avance de la Semana' : 'Avance del Mes'}
            </span>
            <span className="rounded-full bg-subtle px-2 py-0.5 text-[11px] font-semibold text-ink-3">
              {completedPeriodTasks.length} de {allPeriodTasks.length} tareas completadas
            </span>
          </div>
          <span className="text-[13px] font-bold text-ink tabular-nums">
            {periodProgressPercent}%
          </span>
        </div>

        {/* Barra de progreso temporal: cada tarea completada adopta el color del proyecto */}
        <div className="h-2.5 w-full rounded-full bg-subtle overflow-hidden flex">
          {allPeriodTasks.length === 0 ? (
            <div className="h-full w-full bg-subtle" />
          ) : (
            allPeriodTasks.map((t, idx) => {
              const done = isTaskDone(t.status)
              const ctx = blockContext(state, t)
              return (
                <div
                  key={`bar-${t.id}-${idx}`}
                  className="h-full transition-all duration-300 border-r border-white/40 last:border-r-0"
                  style={{
                    flex: 1,
                    backgroundColor: done ? (ctx.projectColor || '#7a3fe0') : '#e9ecf2',
                  }}
                  title={`${t.title} (${done ? 'Completada' : 'Pendiente'})`}
                />
              )
            })
          )}
        </div>

        {/* Proyectos activos en este período */}
        {Object.keys(projectContributions).length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pt-0.5">
            <span className="text-[11px] font-medium text-ink-4 shrink-0">Proyectos avanzando:</span>
            {Object.values(projectContributions).map((proj) => (
              <span
                key={proj.name}
                className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold shrink-0"
                style={{
                  backgroundColor: `${proj.color}15`,
                  color: proj.color,
                }}
              >
                <span className="size-1.5 rounded-full" style={{ backgroundColor: proj.color }} />
                <span>{proj.name}</span>
                <span className="opacity-80">({proj.count})</span>
              </span>
            ))}
          </div>
        )}
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

      {mode === 'week' && allPeriodTasks.length === 0 ? (
        <p className="py-4 text-center text-[14px] text-ink-3">
          No hay tareas programadas para esta semana.
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
    const doneTasks = tasks.filter((t) => isTaskDone(t.status))
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-current={today ? 'date' : undefined}
        aria-label={dayKey}
        className={cx(
          'flex min-h-[58px] flex-col items-center justify-between rounded-[12px] p-1.5 text-center transition-all hover:bg-subtle active:scale-95',
          today
            ? 'bg-[#f5f0ff] border border-[#7a3fe0] text-[#7a3fe0]'
            : 'border border-line bg-white text-ink',
          muted && 'opacity-30',
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

        {/* Micro Dial del día con las tareas */}
        <div className="my-auto flex items-center justify-center">
          <MicroDayClock tasks={tasks} />
        </div>

        {/* Mini dot count if tasks exist */}
        {tasks.length > 0 ? (
          <span className="text-[9px] font-semibold tabular-nums text-ink-3">
            {doneTasks.length}/{tasks.length}
          </span>
        ) : (
          <span className="h-[12px]" />
        )}
      </button>
    )
  }

  // Week mode: 7 celdas con Mini Reloj de Día
  const doneTasks = tasks.filter((t) => isTaskDone(t.status))
  const visible = tasks.slice(0, 3)
  const overflow = tasks.length - visible.length

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-current={today ? 'date' : undefined}
      aria-label={dayKey}
      className={cx(
        'flex min-h-[6.2rem] flex-col items-stretch gap-1 rounded-[14px] border bg-white p-2 text-left transition-all hover:border-line-strong active:scale-[0.98]',
        today ? 'bg-[#f5f0ff] border-[#7a3fe0] ring-1 ring-[#7a3fe0]/30' : 'border-line',
      )}
    >
      <div className="flex items-center justify-between pb-1 border-b border-line/50">
        <span
          className={cx(
            'text-[13px] font-bold tabular-nums',
            today ? 'text-[#7a3fe0]' : 'text-ink',
          )}
        >
          {date}
        </span>
        <div className="flex items-center gap-1">
          {tasks.length > 0 && (
            <span className="text-[10px] font-semibold text-ink-3 tabular-nums">
              {doneTasks.length}/{tasks.length}
            </span>
          )}
          <MiniDayClock tasks={tasks} />
        </div>
      </div>

      <div className="flex flex-col gap-0.5 flex-1 justify-start pt-0.5">
        {visible.map((task) => (
          <TaskBlockChip key={task.id} task={task} />
        ))}
        {overflow > 0 ? (
          <span className="text-[10px] font-medium text-ink-3">+{overflow} más</span>
        ) : null}
      </div>
    </button>
  )
}
