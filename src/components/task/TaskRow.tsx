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
  color = '#7a3fe0',
}: {
  done: boolean
  onToggle: () => void
  label: string
  color?: string
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
          done ? 'text-white' : 'border-line-strong',
        )}
        style={done ? { backgroundColor: color, borderColor: color } : undefined}
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
  const projectColor = ctx.projectColor || '#7a3fe0'
  const projectName = ctx.project?.name || contextResult?.projectName

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
    <div
      className={cx(
        'relative flex overflow-hidden rounded-[16px] border border-line bg-white transition-all hover:border-line-strong hover:shadow-xs',
        className,
      )}
      style={{
        borderLeftWidth: '3.5px',
        borderLeftColor: projectColor,
        background: done
          ? undefined
          : `linear-gradient(to right, ${projectColor}08 0%, #ffffff 35%)`,
      }}
    >
      {hideCheckbox ? null : (
        <TaskCheckbox
          done={done}
          onToggle={onToggle}
          label="Completar tarea"
          color={tInfo.color}
        />
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
        <div className="flex flex-wrap items-center gap-1.5">
          <p
            className={cx(
              'line-clamp-1 text-[15px] font-medium leading-snug',
              done ? 'text-ink-3 line-through' : 'text-ink',
            )}
          >
            {task.title}
          </p>

          {/* Color propio del saber/terreno con etiqueta distinguible */}
          <span
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 transition-colors"
            style={{
              backgroundColor: `${tInfo.color}16`,
              color: tInfo.color,
              border: `1px solid ${tInfo.color}32`,
            }}
            title={`Saber de la tarea: ${tInfo.label}`}
          >
            <span
              className="size-1.5 rounded-full shrink-0"
              style={{ backgroundColor: tInfo.color }}
              aria-hidden="true"
            />
            <span>{tInfo.label}</span>
          </span>
        </div>

        <p className="mt-0.5 truncate text-[12px] font-medium leading-tight text-ink-3">
          {showContext && projectName && !loose && (
            <span className="font-semibold mr-1" style={{ color: projectColor }}>
              [{projectName}]
            </span>
          )}
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
