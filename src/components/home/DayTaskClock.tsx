import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BellOff,
  Check,
  LayoutGrid,
  Play,
  Plus,
  SlidersHorizontal,
  Sun,
  Moon,
} from 'lucide-react'
import { AnalogClock, type AnalogClockSlot } from '@/components/home/AnalogClock'
import { TacticalTaskModal } from '@/components/task/TacticalTaskModal'
import { cx } from '@/components/ui/primitives'
import { useFeedback } from '@/app/FeedbackProvider'
import { captureLooseTask, completeTask, reopenTask } from '@/data/actions'
import { freeHoursForDay, plannedHoursForDay } from '@/data/dayLoad'
import { startExecution, useFocusSession } from '@/data/focusSession'
import { blockContext } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { classifyClockHour, type ClockPlacement } from '@/domain/clockHours'
import { isTaskDone } from '@/domain/economy'
import { resolveTaskViewTemplate } from '@/domain/taskView'
import { TERRENO_MAP } from '@/domain/terrenos'
import type { Task } from '@/domain/types'

export { MiniDayClock, MicroDayClock } from '@/components/home/AnalogClock'

interface DayTaskClockProps {
  tasks: Task[]
  activeDay: string
  todayKey: string
  localeTag: string
  compact?: boolean
  onOpenCanvas?: () => void
  onQuickAdd?: () => void
}

function formatDurationSeconds(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  if (minutes > 0) return `${minutes}m ${rest}s`
  return `${rest}s`
}

function taskStartHour(task: Task, isExecuting: boolean, startHour: number | null | undefined, now: Date): number | null {
  if (isExecuting) {
    return startHour ?? now.getHours() + now.getMinutes() / 60
  }
  if (isTaskDone(task.status)) {
    if (task.completedAt) {
      const completedDate = new Date(task.completedAt)
      const duration = Math.max(0.08, task.actualHours ?? task.estimatedHours ?? 0.5)
      const compHour = completedDate.getHours() + completedDate.getMinutes() / 60
      return (compHour - duration + 24) % 24
    }
    if (task.scheduledStart) {
      const parts = task.scheduledStart.split(':').map(Number)
      return (parts[0] ?? 9) + (parts[1] ?? 0) / 60
    }
    return null
  }
  if (task.scheduledStart) {
    const parts = task.scheduledStart.split(':').map(Number)
    return (parts[0] ?? 9) + (parts[1] ?? 0) / 60
  }
  return null
}

export function DayTaskClock({
  tasks,
  activeDay,
  todayKey,
  localeTag,
  compact = false,
  onOpenCanvas,
}: DayTaskClockProps) {
  const { t } = useTranslation()
  const state = useAleph()
  const feedback = useFeedback()
  const focusSession = useFocusSession()

  const [now, setNow] = useState(() => new Date())
  const isToday = activeDay === todayKey
  const isPastDay = activeDay < todayKey
  const isCurrentAm = now.getHours() < 12
  const [period, setPeriod] = useState<'AM' | 'PM'>(isCurrentAm ? 'AM' : 'PM')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [hoveredHour, setHoveredHour] = useState<number | null>(null)
  const [selectedTacticalTaskId, setSelectedTacticalTaskId] = useState<string | null>(null)

  useEffect(() => {
    if (!isToday) return
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [isToday])

  const currentDecimalHour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600

  const cap = state.character.dailyHourCap ?? 5
  const plannedHours = plannedHoursForDay(state, activeDay)
  const freeHours = freeHoursForDay(cap, plannedHours)

  const placements = useMemo<ClockPlacement[]>(() => {
    const next: ClockPlacement[] = []
    for (const task of tasks) {
      const isExecuting = focusSession.activeTaskId === task.id
      const ctx = blockContext(state, task)
      const startHour = taskStartHour(task, isExecuting, focusSession.startHour, now)
      if (startHour === null) continue
      const duration = isExecuting
        ? Math.max(0.05, focusSession.elapsedSeconds / 3600)
        : Math.max(0.08, task.actualHours ?? task.estimatedHours ?? 0.5)
      next.push({
        startHour,
        endHour: (startHour + duration) % 24,
        done: isTaskDone(task.status),
        isExecuting,
        color: ctx.projectColor || ctx.color || 'var(--color-violet)',
        title: task.title,
      })
    }
    return next
  }, [tasks, state, focusSession.activeTaskId, focusSession.elapsedSeconds, focusSession.startHour, now])

  const hourlySlots = useMemo(() => {
    const baseHour = period === 'AM' ? 0 : 12
    return Array.from({ length: 12 }, (_, index) => {
      const actualHour = baseHour + index
      const classified = classifyClockHour(
        actualHour,
        placements,
        isPastDay,
        isToday,
        currentDecimalHour,
      )
      return {
        index,
        actualHour,
        clockNum: index === 0 ? 12 : index,
        ...classified,
      }
    })
  }, [period, placements, isPastDay, isToday, currentDecimalHour])

  const analogSlots: AnalogClockSlot[] = hourlySlots.map((slot) => ({
    index: slot.index,
    actualHour: slot.actualHour,
    color: slot.color,
    stateType: slot.stateType,
    executing: slot.executing,
  }))

  const isPeriodCurrent = (isCurrentAm && period === 'AM') || (!isCurrentAm && period === 'PM')
  const currentHour12 = (now.getHours() % 12) + now.getMinutes() / 60 + now.getSeconds() / 3600
  const hourHandAngle = (currentHour12 / 12) * 360
  const minuteHandAngle = ((now.getMinutes() + now.getSeconds() / 60) / 60) * 360
  const hovered = hourlySlots.find((slot) => slot.actualHour === hoveredHour)
  const showCivilClock = isToday && isPeriodCurrent
  const civilTime = isToday
    ? new Intl.DateTimeFormat(localeTag, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(now)
    : undefined

  const hoveredLabel = hovered
    ? hovered.executing
      ? t('home.clock.inProgress', { title: hovered.title })
      : hovered.title
        ? hovered.title
        : hovered.stateType === 'inactive'
          ? t('home.clock.inactive')
          : t('home.clock.available')
    : null

  const handleToggle = (task: Task) => {
    if (isTaskDone(task.status)) {
      reopenTask(task.id)
    } else {
      const outcome = completeTask(task.id)
      if (outcome) feedback.celebrate(outcome)
    }
  }

  const handleQuickAdd = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = newTaskTitle.trim()
    if (!trimmed) return
    captureLooseTask(trimmed, { scheduledFor: activeDay })
    setNewTaskTitle('')
  }

  return (
    <div className="flex w-full min-w-0 flex-col items-center select-none">
      <div className="mb-3 flex w-full items-center justify-center">
        <div className="flex items-center rounded-full border border-line bg-subtle p-0.5">
          {(['AM', 'PM'] as const).map((value) => {
            const active = period === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => setPeriod(value)}
                className={cx(
                  'inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold transition-colors',
                  active
                    ? value === 'AM'
                      ? 'bg-amber-soft text-amber shadow-sm'
                      : 'bg-violet-soft text-violet shadow-sm'
                    : 'text-ink-3 hover:text-ink',
                )}
              >
                {value === 'AM' ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
                <span>{value === 'AM' ? t('home.clock.amHours') : t('home.clock.pmHours')}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="relative flex items-center justify-center">
        <AnalogClock
          slots={analogSlots}
          showHands={showCivilClock}
          hourAngle={hourHandAngle}
          minuteAngle={minuteHandAngle}
          period={period}
          hoveredHour={hoveredHour}
          onHoverHour={compact ? undefined : setHoveredHour}
          civilTime={civilTime}
        />
        {!compact && hoveredHour !== null && hoveredLabel ? (
          <div className="pointer-events-none absolute bottom-1 rounded-full bg-ink/90 px-2.5 py-1 text-[10px] font-semibold text-white shadow-paper">
            {t('home.clock.hourRange', { start: hoveredHour, end: hoveredHour + 1 })} · {hoveredLabel}
          </div>
        ) : null}
      </div>

      <p className="mt-3 text-center text-[13px] font-medium text-ink-2">
        {t('home.workload', { planned: plannedHours, cap })}
        {' · '}
        {freeHours > 0 ? t('home.freeForWork', { n: freeHours }) : t('home.capFull')}
      </p>

      {compact ? (
        <p className="mt-3 text-[13px] font-medium text-ink-3">
          {t('home.clock.taskCount', { count: tasks.length })}
        </p>
      ) : (
        <div className="mt-4 flex w-full min-w-0 flex-col gap-2.5" onClick={(event) => event.stopPropagation()}>
          <form onSubmit={handleQuickAdd} className="flex w-full min-w-0 items-center gap-1">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(event) => setNewTaskTitle(event.target.value)}
              placeholder={t('home.clock.newTaskPlaceholder')}
              className="min-h-11 min-w-0 flex-1 rounded-2xl border border-line bg-subtle px-3 text-[13px] text-ink placeholder:text-ink-4 outline-none transition-colors focus:border-violet focus:bg-white focus:ring-2 focus:ring-violet/20"
            />
            <button
              type="submit"
              disabled={!newTaskTitle.trim()}
              className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-2xl bg-ink px-3 text-[13px] font-semibold text-white transition-colors hover:bg-ink-2 disabled:pointer-events-none disabled:opacity-40"
            >
              <Plus className="size-4 stroke-[2.5]" />
              {t('home.clock.addTask')}
            </button>
          </form>

          <div className="flex max-h-[210px] flex-col gap-1.5 overflow-y-auto pr-0.5">
            {tasks.length === 0 ? (
              <p className="px-2 py-5 text-center text-[14px] leading-relaxed text-ink-3">
                {t('home.clock.emptyTasks')}
              </p>
            ) : (
              tasks.map((task) => {
                const ctx = blockContext(state, task)
                const done = isTaskDone(task.status)
                const isExecuting = focusSession.activeTaskId === task.id
                const color = ctx.projectColor || ctx.color || 'var(--color-violet)'
                const terrenoInfo = TERRENO_MAP[ctx.terreno ?? 'literatura']
                const viewTemplate = resolveTaskViewTemplate(task)
                const dedicatedText = task.actualHours
                  ? t('home.clock.minutesDedicated', { count: Math.round(task.actualHours * 60) })
                  : isExecuting
                    ? t('home.clock.elapsed', { time: formatDurationSeconds(focusSession.elapsedSeconds) })
                    : null

                return (
                  <div
                    key={task.id}
                    className={cx(
                      'flex items-center gap-2 rounded-2xl border px-2 py-2 transition-colors',
                      isExecuting
                        ? 'border-amber/30 bg-amber-soft'
                        : 'border-line bg-white hover:border-line-strong',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggle(task)}
                      className={cx(
                        'flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-transform active:scale-90',
                        done ? 'border-transparent text-white' : 'border-line bg-white hover:border-line-strong',
                      )}
                      style={{ backgroundColor: done ? color : undefined }}
                      title={done ? t('home.clock.reopen') : t('home.clock.complete')}
                    >
                      {done ? <Check className="size-3.5 stroke-[3]" /> : null}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedTacticalTaskId(task.id)}
                      className="min-w-0 flex-1 text-left"
                      title={t('home.clock.openTactical')}
                    >
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-ink-3">
                        {t('common.task')}
                      </span>
                      <span
                        className={cx(
                          'block truncate text-[13px] font-semibold leading-tight',
                          done ? 'text-ink-3 line-through' : 'text-ink',
                        )}
                      >
                        {task.title}
                      </span>
                      <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] text-ink-3">
                        <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                        <span className="truncate">
                          {ctx.objective
                            ? `${t('common.objective')} · ${ctx.objective.name}`
                            : ctx.result
                              ? `${t('common.result')} · ${ctx.result.name}`
                              : ctx.project?.name ?? t('home.clock.loose')}
                        </span>
                        {ctx.terreno ? (
                          <span
                            className="shrink-0 rounded-full px-1.5 py-px text-[10px] font-medium"
                            style={{ backgroundColor: `${terrenoInfo.color}18`, color: terrenoInfo.color }}
                          >
                            {t(`terrenos.${ctx.terreno}`)}
                          </span>
                        ) : null}
                        {viewTemplate ? (
                          <span className="shrink-0 rounded-full bg-violet-soft px-1.5 py-px text-[10px] font-medium text-violet">
                            {t(`taskView.templates.${viewTemplate}.name`)}
                          </span>
                        ) : null}
                        {dedicatedText ? (
                          <span
                            className={cx(
                              'shrink-0 rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums',
                              isExecuting ? 'bg-amber-soft text-amber' : 'bg-mint-soft text-mint',
                            )}
                          >
                            {dedicatedText}
                          </span>
                        ) : null}
                      </span>
                    </button>

                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => setSelectedTacticalTaskId(task.id)}
                        className="flex size-9 items-center justify-center rounded-xl text-ink-3 hover:bg-violet-soft hover:text-violet"
                        title={t('home.clock.openTactical')}
                      >
                        <SlidersHorizontal className="size-3.5" />
                      </button>
                      {!done ? (
                        <button
                          type="button"
                          onClick={() => startExecution(task, activeDay)}
                          className={cx(
                            'inline-flex min-h-8 items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold text-white shadow-sm',
                            isExecuting ? 'bg-amber' : 'bg-ink hover:bg-ink-2',
                          )}
                        >
                          {isExecuting ? <BellOff className="size-3" /> : <Play className="size-3 fill-current" />}
                          {isExecuting ? t('home.clock.executing') : t('home.clock.execute')}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 pr-1 text-[11px] font-medium text-mint">
                          <Check className="size-3" />
                          {t('home.clock.done')}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {onOpenCanvas ? (
            <button
              type="button"
              onClick={onOpenCanvas}
              className="mt-1 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-violet px-4 text-[15px] font-semibold text-white shadow-[0_10px_24px_rgb(122_63_224/0.22)] transition hover:bg-violet/90 active:scale-[0.99]"
            >
              <LayoutGrid className="size-4" />
              {t('home.clock.planDay')}
            </button>
          ) : null}
        </div>
      )}

      {selectedTacticalTaskId ? (
        <TacticalTaskModal
          key={selectedTacticalTaskId}
          taskId={selectedTacticalTaskId}
          onClose={() => setSelectedTacticalTaskId(null)}
        />
      ) : null}
    </div>
  )
}
