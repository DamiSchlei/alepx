import { useTranslation } from 'react-i18next'
import { MiniDayClock, MicroDayClock } from '@/components/home/AnalogClock'
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

function formatWeekHeadingSpec(anchorDay: string, localeTag: string, weekLabel: string): string {
  const days = weekDayKeys(anchorDay)
  const first = parseLocal(days[0])
  const last = parseLocal(days[6])
  const monthName = new Intl.DateTimeFormat(localeTag, { month: 'short' }).format(last)
  const year = last.getFullYear()
  return `${weekLabel} · ${first.getDate()}–${last.getDate()} ${monthName} ${year}`
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
  const { t } = useTranslation()
  const state = useAleph()
  const locale = state.character.locale
  const dayKeys = periodDayKeys(mode, anchorDay)
  const stats = periodStats(state, dayKeys)
  const lead = mode === 'month' ? isoWeekday(dayKeys[0] ?? anchorDay) - 1 : 0
  const monthKey = toDayKey(parseLocal(anchorDay)).slice(0, 7)

  const allPeriodTasks = dayKeys.flatMap((dayKey) => tasksForDay(state, dayKey))
  const completedPeriodTasks = allPeriodTasks.filter((task) => isTaskDone(task.status))
  const periodProgressPercent =
    allPeriodTasks.length > 0
      ? Math.round((completedPeriodTasks.length / allPeriodTasks.length) * 100)
      : null

  const projectContributions: Record<string, { name: string; color: string; count: number }> = {}
  completedPeriodTasks.forEach((task) => {
    const ctx = blockContext(state, task)
    const pid = ctx.project?.id ?? 'loose'
    if (!projectContributions[pid]) {
      projectContributions[pid] = {
        name: ctx.project?.name ?? ctx.result?.name ?? t('home.clock.loose'),
        color: ctx.projectColor ?? 'var(--color-violet)',
        count: 0,
      }
    }
    projectContributions[pid].count += 1
  })

  const title =
    mode === 'week'
      ? formatWeekHeadingSpec(anchorDay, localeTag, t('home.weekNumber', { n: isoWeekNumber(anchorDay) }))
      : new Intl.DateTimeFormat(localeTag, { month: 'long', year: 'numeric' }).format(
          parseLocal(anchorDay),
        )

  const monthStatsLabel = t('home.monthStatsLine', {
    closed: stats.closedBlocks,
    onTime: stats.onTime,
    hours: formatHours(stats.hours, locale),
  })

  return (
    <section className="flex flex-col gap-4 pb-24 pt-3">
      <div>
        <h2 className="text-[20px] font-semibold capitalize tracking-tight text-ink">{title}</h2>
        {mode === 'month' ? (
          <p className="mt-1 text-[13px] font-medium text-ink-3">{monthStatsLabel}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2.5 rounded-[20px] border border-line bg-surface p-4 shadow-paper">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="text-[13px] font-semibold text-ink">
              {mode === 'week' ? t('home.progressWeek') : t('home.progressMonth')}
            </span>
            {allPeriodTasks.length > 0 ? (
              <span className="rounded-full bg-subtle px-2 py-0.5 text-[11px] font-semibold text-ink-3">
                {t('home.tasksCompleted', {
                  done: completedPeriodTasks.length,
                  total: allPeriodTasks.length,
                })}
              </span>
            ) : null}
          </div>
          {periodProgressPercent !== null ? (
            <span className="text-[13px] font-semibold tabular-nums text-ink">{periodProgressPercent}%</span>
          ) : null}
        </div>

        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-subtle">
          {allPeriodTasks.length === 0 ? (
            <div className="h-full w-full bg-subtle" />
          ) : (
            allPeriodTasks.map((task, index) => {
              const done = isTaskDone(task.status)
              const ctx = blockContext(state, task)
              return (
                <div
                  key={`bar-${task.id}-${index}`}
                  className="h-full border-r border-white/40 last:border-r-0"
                  style={{
                    flex: 1,
                    backgroundColor: done ? ctx.projectColor || 'var(--color-violet)' : 'var(--color-line)',
                  }}
                  title={task.title}
                />
              )
            })
          )}
        </div>

        {Object.keys(projectContributions).length > 0 ? (
          <div className="flex items-center gap-2 overflow-x-auto pt-0.5">
            <span className="shrink-0 text-[11px] font-medium text-ink-4">{t('home.projectsAdvancing')}</span>
            {Object.values(projectContributions).map((project) => (
              <span
                key={project.name}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={{ backgroundColor: `${project.color}18`, color: project.color }}
              >
                <span className="size-1.5 rounded-full" style={{ backgroundColor: project.color }} />
                <span>{project.name}</span>
                <span className="opacity-80">({project.count})</span>
              </span>
            ))}
          </div>
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

      {mode === 'week' && allPeriodTasks.length === 0 ? (
        <p className="py-4 text-center text-[14px] text-ink-3">{t('home.emptyWeek')}</p>
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
  const { t } = useTranslation()
  const state = useAleph()
  const tasks = tasksForDay(state, dayKey)
  const date = Number(dayKey.slice(8, 10))
  const doneTasks = tasks.filter((task) => isTaskDone(task.status))

  if (mode === 'month') {
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-current={today ? 'date' : undefined}
        aria-label={dayKey}
        className={cx(
          'flex min-h-[58px] flex-col items-center justify-between rounded-[14px] p-1.5 text-center transition-colors hover:bg-subtle',
          today ? 'border border-violet bg-violet-soft text-violet' : 'border border-line bg-surface text-ink',
          muted && 'opacity-30',
        )}
      >
        <span className={cx('text-[13px] font-semibold tabular-nums', today ? 'text-violet' : 'text-ink')}>
          {date}
        </span>
        <div className="my-auto flex items-center justify-center">
          <MicroDayClock tasks={tasks} />
        </div>
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

  const visible = tasks.slice(0, 3)
  const overflow = tasks.length - visible.length

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-current={today ? 'date' : undefined}
      aria-label={dayKey}
      className={cx(
        'flex min-h-[6.2rem] flex-col items-stretch gap-1 rounded-[16px] border bg-surface p-2 text-left transition-colors hover:border-line-strong',
        today ? 'border-violet bg-violet-soft ring-1 ring-violet/20' : 'border-line',
      )}
    >
      <div className="flex items-center justify-between border-b border-line/60 pb-1">
        <span className={cx('text-[13px] font-semibold tabular-nums', today ? 'text-violet' : 'text-ink')}>
          {date}
        </span>
        <div className="flex items-center gap-1">
          {tasks.length > 0 ? (
            <span className="text-[10px] font-semibold tabular-nums text-ink-3">
              {doneTasks.length}/{tasks.length}
            </span>
          ) : null}
          <MiniDayClock tasks={tasks} />
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-start gap-0.5 pt-0.5">
        {visible.map((task) => (
          <TaskBlockChip key={task.id} task={task} />
        ))}
        {overflow > 0 ? (
          <span className="text-[10px] font-medium text-ink-3">{t('home.moreCount', { count: overflow })}</span>
        ) : null}
      </div>
    </button>
  )
}
