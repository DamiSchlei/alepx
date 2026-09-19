import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { cx } from '@/components/ui/primitives'
import { RowMenu } from '@/components/ui/RowMenu'
import { updateTask } from '@/data/actions'
import { useAleph } from '@/data/store'
import { blockContext, objectiveById, resultById } from '@/data/selectors'
import { toDayKey } from '@/domain/dates'
import { isTaskDone } from '@/domain/economy'
import { STAGE_LABELS } from '@/domain/stage'
import { TERRENO_MAP } from '@/domain/terrenos'
import { formatDate, formatHours } from '@/i18n/format'
import type { Task } from '@/domain/types'

export function TaskCheckbox({
  done,
  onToggle,
  label,
}: {
  done: boolean
  onToggle: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={label}
      onClick={onToggle}
      className="flex size-11 shrink-0 items-center justify-center rounded-2xl transition-colors hover:bg-subtle"
    >
      <span
        className={cx(
          'flex size-[22px] items-center justify-center rounded-[6px] border-2 transition-colors',
          done ? 'border-[#7a3fe0] bg-[#7a3fe0] text-white' : 'border-line-strong',
        )}
      >
        {done ? (
          <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M3.5 8.5 6.5 11.5 12.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
    </button>
  )
}

export function TaskRow({
  task,
  onToggle,
  onOpen,
  onAssign: _onAssign,
  onExecute: _onExecute,
  onReturn: _onReturn,
  onDelete,
  handle,
  showContext = true,
  hideCheckbox = false,
  className,
}: {
  task: Task
  onToggle: () => void
  onOpen?: () => void
  onAssign?: () => void
  onExecute?: () => void
  onReturn?: () => void
  onDelete?: () => void
  handle?: ReactNode
  showContext?: boolean
  showProjection?: boolean
  hideCheckbox?: boolean
  className?: string
}) {
  const navigate = useNavigate()
  const state = useAleph()
  const locale = state.character.locale
  const done = isTaskDone(task.status)
  const ctx = blockContext(state, task)
  const result = resultById(state, task.resultId)
  const objective = objectiveById(state, task.objectiveId)
  const contextResult = result ?? resultById(state, objective?.resultId)
  const loose = !task.objectiveId && !task.resultId
  const todayKey = toDayKey(new Date())

  const tInfo = TERRENO_MAP[task.terreno ?? 'literatura']

  const putInThisWeek = () => {
    updateTask(task.id, {
      scheduledFor: todayKey,
      dueAt: todayKey,
      stage: 'execution',
    })
    navigate('/')
  }

  const metaParts: string[] = [`${formatHours(task.actualHours ?? task.estimatedHours, locale)} h`]
  if (showContext) {
    if (loose) metaParts.push('Suelto')
    else if (contextResult?.name) metaParts.push(contextResult.name)
    if (objective?.name) metaParts.push(objective.name)
  }
  if (!loose && !done) metaParts.push(STAGE_LABELS[task.stage] ?? 'Ejecución')
  if (task.dueAt && !done) metaParts.push(formatDate(task.dueAt, locale))

  return (
    <div className={cx('relative flex overflow-hidden rounded-[16px] border border-line bg-white transition-all hover:border-line-strong', className)}>
      <span aria-hidden className="absolute inset-y-0 left-0 w-1.5" style={{ background: ctx.color }} />
      {hideCheckbox ? null : (
        <TaskCheckbox done={done} onToggle={onToggle} label="Completar tarea" />
      )}
      <button
        type="button"
        onClick={onOpen}
        disabled={!onOpen}
        className={cx(
          'min-h-11 min-w-0 flex-1 py-2.5 pr-1 text-left',
          hideCheckbox && 'pl-4',
          onOpen && 'cursor-pointer',
        )}
      >
        <div className="flex items-center gap-2">
          <p
            className={cx(
              'line-clamp-1 text-[15px] font-medium leading-snug',
              done ? 'text-ink-3 line-through' : 'text-ink',
            )}
          >
            {task.title}
          </p>
          {/* Etiqueta de terreno */}
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{ backgroundColor: `${tInfo.color}15`, color: tInfo.color }}
          >
            <span className="size-1.5 rounded-full" style={{ backgroundColor: tInfo.color }} />
            {tInfo.label}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[12px] font-medium leading-tight text-ink-3">
          {metaParts.join(' · ')}
        </p>
      </button>

      {/* CTA: Poner en esta semana */}
      {!done && (!task.scheduledFor || task.scheduledFor < todayKey) ? (
        <button
          type="button"
          onClick={putInThisWeek}
          className="self-center shrink-0 mr-1 rounded-full border border-line bg-subtle px-2.5 py-1 text-[12px] font-medium text-ink-2 hover:border-[#7a3fe0] hover:text-[#7a3fe0] active:scale-95 transition-all"
        >
          Poner en esta semana
        </button>
      ) : null}

      {onDelete ? (
        <RowMenu items={[{ label: 'Eliminar', tone: 'danger', onClick: onDelete }]} />
      ) : null}
      {handle ? <div className="opacity-30 pr-1">{handle}</div> : null}
    </div>
  )
}
