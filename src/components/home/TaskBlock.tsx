import type { ReactNode } from 'react'
import { Play, BellOff } from 'lucide-react'
import { cx } from '@/components/ui/primitives'
import { startExecution, useFocusSession } from '@/data/focusSession'
import { blockContext } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { isTaskDone } from '@/domain/economy'
import { STAGE_LABELS } from '@/domain/stage'
import { formatHours } from '@/i18n/format'
import type { Task } from '@/domain/types'

/**
 * TaskBlock: Pieza de 2 líneas (~56px)
 * Riel 6px: Literatura violeta, Arte índigo, Empresa verde. Suelto: ámbar.
 * Línea 1: título | check + handle
 * Línea 2: meta: Terreno · horas · etapa
 * NUNCA repetir el nombre del Resultado en cada card.
 * Nunca "Sin objetivo" ni "El día está abierto".
 */
export function TaskBlock({
  task,
  handle,
  onToggle,
  onOpen,
  dayKey,
}: {
  task: Task
  handle?: ReactNode
  onToggle: () => void
  onOpen: () => void
  showGroupLabel?: boolean
  dayKey?: string
}) {
  const state = useAleph()
  const focusSession = useFocusSession()
  const locale = state.character.locale
  const ctx = blockContext(state, task)
  const done = isTaskDone(task.status)
  const isExecuting = focusSession.activeTaskId === task.id

  // Meta: Objetivo/Resultado · horas · etapa (el riel porta el tono)
  const targetName = ctx.objective
    ? `Objetivo · ${ctx.objective.name}`
    : ctx.result
      ? `Resultado · ${ctx.result.name}`
      : null
  const hoursFormatted = task.actualHours
    ? `${Math.round(task.actualHours * 60)}m dedicados`
    : `${formatHours(ctx.hours, locale)} h`
  const stageFormatted = STAGE_LABELS[ctx.stage] ?? 'Ejecución'
  const metaLine = targetName
    ? `${targetName} · ${hoursFormatted} · ${stageFormatted}`
    : `${hoursFormatted} · ${stageFormatted}`

  const projectColor = ctx.projectColor || '#7a3fe0'

  return (
    <div
      className={cx(
        'relative flex min-h-[56px] overflow-hidden rounded-[16px] border transition-all hover:border-line-strong',
        isExecuting
          ? 'border-amber-300 bg-amber-50/40 ring-1 ring-amber-300'
          : 'border-line bg-white',
      )}
      style={{
        borderLeftWidth: '3.5px',
        borderLeftColor: projectColor,
        background: isExecuting
          ? undefined
          : `linear-gradient(to right, ${projectColor}09 0%, #ffffff 40%)`,
      }}
    >
      <div className="flex min-w-0 flex-1 items-center justify-between py-2.5 pl-3.5 pr-2">
        {/* Left: Título & Meta con punto del saber propio */}
        <button
          type="button"
          onClick={onOpen}
          className="min-h-11 min-w-0 flex-1 py-0 text-left"
        >
          <p
            className={cx(
              'line-clamp-1 text-[15px] font-medium leading-snug text-ink',
              done && 'line-through text-ink-3',
            )}
          >
            <span className="mr-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-3">
              Tarea
            </span>
            {task.title}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className="size-2 rounded-full shrink-0"
              style={{ backgroundColor: ctx.color }}
              title={ctx.terreno}
            />
            <p className="truncate text-[12px] font-medium leading-tight text-ink-3">
              {metaLine}
            </p>
          </div>
        </button>

        {/* Right: Botón Ejecutar + Checkbox + Handle */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!done && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                startExecution(task, dayKey || new Date().toISOString().slice(0, 10))
              }}
              className={cx(
                'flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition-all active:scale-95 shadow-xs',
                isExecuting
                  ? 'bg-amber-500 text-white animate-pulse'
                  : 'bg-[#111318] text-white hover:bg-black',
              )}
              title="Ejecutar en No Molestar y dedicar tiempo real"
            >
              {isExecuting ? (
                <>
                  <BellOff className="size-3" />
                  <span>En curso</span>
                </>
              ) : (
                <>
                  <Play className="size-3 fill-current" />
                  <span>Ejecutar</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            role="checkbox"
            aria-checked={done}
            aria-label="Completar tarea"
            onClick={(e) => {
              e.stopPropagation()
              onToggle()
            }}
            className="flex size-10 shrink-0 items-center justify-center"
          >
            <span
              className={cx(
                'flex size-[22px] items-center justify-center rounded-[6px] border-2 transition-all',
                done ? 'border-[#7a3fe0] bg-[#7a3fe0] text-white' : 'border-line-strong hover:border-ink-2',
              )}
            >
              {done ? (
                <svg
                  viewBox="0 0 16 16"
                  className="size-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    d="M3.5 8.5 6.5 11.5 12.5 4.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
            </span>
          </button>
          {handle ? <div className="text-ink-4 opacity-40 hover:opacity-100">{handle}</div> : null}
        </div>
      </div>
    </div>
  )
}
