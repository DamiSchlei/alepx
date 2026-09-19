import { useEffect, useMemo, useState } from 'react'
import { Composer } from '@/components/home/Composer'
import { TaskBlock } from '@/components/home/TaskBlock'
import { TaskFormSheet } from '@/components/planning/TaskForm'
import { SortableList } from '@/components/ui/SortableList'
import { completeTask, reopenTask, reorderTasks } from '@/data/actions'
import { freeHoursForDay, plannedHoursForDay } from '@/data/dayLoad'
import { blockContext, tasksForDay } from '@/data/selectors'
import { getState, useAleph } from '@/data/store'
import { useFeedback } from '@/app/FeedbackProvider'
import { parseLocal } from '@/domain/dates'
import { isTaskDone } from '@/domain/economy'
import { formatHours } from '@/i18n/format'
import type { Task } from '@/domain/types'

const DEFAULT_CAP = 5

function weekdayDateLabel(dayKey: string, localeTag: string): string {
  const date = parseLocal(dayKey)
  const weekday = new Intl.DateTimeFormat(localeTag, { weekday: 'long' }).format(date)
  return `${weekday} ${date.getDate()}`
}

/**
 * Visor de tareas de Home Día:
 * ▾ Tareas · hoy          3/5 h · 2 libres
 * Grupo: "Primer producto listo para vender"
 * Piezas de 2 líneas (~56px): título | check + handle, meta: Terreno · horas · etapa
 * NUNCA repetir el nombre del Resultado en cada card.
 * Nunca "Sin objetivo" ni "El día está abierto".
 * ▸ Agregar tarea → input "Anotá un bloque…", horas, terreno, Anotar (cae en el día activo).
 */
export function DayTaskViewer({
  activeDay,
  todayKey,
  localeTag,
}: {
  activeDay: string
  todayKey: string
  localeTag: string
}) {
  const state = useAleph()
  const { celebrate } = useFeedback()
  const locale = state.character.locale
  const cap = state.character.dailyHourCap ?? DEFAULT_CAP
  const tasks = tasksForDay(state, activeDay)
  const planned = plannedHoursForDay(state, activeDay)
  const free = freeHoursForDay(cap, planned)
  const isToday = activeDay === todayKey
  const empty = tasks.length === 0

  const [open, setOpen] = useState(true)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Task | undefined>()

  useEffect(() => {
    // Keep visor open when selecting a day with tasks or today
    const hasTasks = tasksForDay(getState(), activeDay).length > 0
    setOpen(activeDay === todayKey || hasTasks)
    setAdding(false)
  }, [activeDay, todayKey])

  const toggle = (task: Task) => {
    if (isTaskDone(task.status)) {
      reopenTask(task.id)
      return
    }
    const outcome = completeTask(task.id)
    if (outcome?.paid) celebrate(outcome)
  }

  const titleLabel = isToday
    ? 'Tareas · hoy'
    : `Tareas · ${weekdayDateLabel(activeDay, localeTag)}`

  const plannedStr = formatHours(planned, locale)
  const capStr = formatHours(cap, locale)
  const freeStr = formatHours(free, locale)
  const hoursRightLabel = `${plannedStr}/${capStr} h · ${freeStr} libres`

  // Group tasks by their Result (Obra)
  const groupedTasks = useMemo(() => {
    const groups: Array<{ resultId: string; resultName: string; tasks: Task[] }> = []
    const groupMap = new Map<string, { resultId: string; resultName: string; tasks: Task[] }>()

    for (const task of tasks) {
      const ctx = blockContext(state, task)
      const res = ctx.result || state.results.find((r) => r.id === task.resultId)
      const resId = res?.id ?? 'loose'
      const resName = res?.name ?? 'Otras tareas'

      let g = groupMap.get(resId)
      if (!g) {
        g = { resultId: resId, resultName: resName, tasks: [] }
        groupMap.set(resId, g)
        groups.push(g)
      }
      g.tasks.push(task)
    }

    return groups
  }, [tasks, state])

  return (
    <section className="mt-3">
      {/* Header colapsable con indicador y balance de horas */}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-[44px] w-full items-center justify-between rounded-[12px] px-1 py-1.5 text-left transition-colors hover:bg-subtle"
      >
        <div className="flex items-center gap-2">
          <span aria-hidden className="w-3.5 text-[14px] text-ink-3">
            {open ? '▾' : '▸'}
          </span>
          <span className="text-[15px] font-semibold text-ink">
            {titleLabel}
          </span>
        </div>
        <span className="text-[13px] font-medium tabular-nums text-ink-3">
          {hoursRightLabel}
        </span>
      </button>

      {open ? (
        <div className="flex flex-col gap-3 pt-2">
          {empty ? (
            <p className="px-2 py-3 text-[14px] leading-relaxed text-ink-3">
              Sin tareas para este día.
            </p>
          ) : (
            <div className="space-y-4">
              {groupedTasks.map((group) => (
                <div key={group.resultId} className="space-y-2">
                  {/* Grupo: Nombre de la obra / resultado (NUNCA repetido en cada card) */}
                  <h3 className="px-1 text-[13px] font-semibold tracking-wide text-ink-2">
                    {group.resultName}
                  </h3>

                  <SortableList
                    ids={group.tasks.map((task) => task.id)}
                    handleLabel="Reordenar"
                    onReorder={(ids) => {
                      const otherIds = tasks
                        .filter((t) => !group.tasks.some((gt) => gt.id === t.id))
                        .map((t) => t.id)
                      reorderTasks([...ids, ...otherIds], 'dayOrder')
                    }}
                  >
                    {(id, handle) => {
                      const task = group.tasks.find((item) => item.id === id)
                      if (!task) return null
                      return (
                        <TaskBlock
                          task={task}
                          handle={handle}
                          onToggle={() => toggle(task)}
                          onOpen={() => setEditing(task)}
                        />
                      )
                    }}
                  </SortableList>
                </div>
              ))}
            </div>
          )}

          {/* ▸ Agregar tarea → input "Anotá un bloque…", horas, terreno, Anotar */}
          <div className="pt-1">
            <button
              type="button"
              aria-expanded={adding}
              onClick={() => setAdding((value) => !value)}
              className="flex min-h-[44px] w-full items-center gap-2 rounded-[12px] px-1 text-left text-ink hover:text-ink-2 transition-colors"
            >
              <span aria-hidden className="w-3.5 text-[14px] text-ink-3">
                {adding ? '▾' : '▸'}
              </span>
              <span className="text-[14px] font-medium text-ink">Agregar tarea</span>
            </button>
            {adding ? (
              <div className="pt-2">
                <Composer dayKey={activeDay} />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <TaskFormSheet
        open={Boolean(editing)}
        task={editing}
        onClose={() => setEditing(undefined)}
      />
    </section>
  )
}
