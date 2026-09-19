import type { ReactNode } from 'react'
import { cx } from '@/components/ui/primitives'
import { blockContext } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { isTaskDone } from '@/domain/economy'
import { STAGE_LABELS } from '@/domain/stage'
import { terrenoLabel } from '@/domain/terrenos'
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
}: {
  task: Task
  handle?: ReactNode
  onToggle: () => void
  onOpen: () => void
  showGroupLabel?: boolean
}) {
  const state = useAleph()
  const locale = state.character.locale
  const ctx = blockContext(state, task)
  const done = isTaskDone(task.status)

  // Meta: Terreno · horas · etapa
  const tLabel = terrenoLabel(task.terreno)
  const hoursFormatted = `${formatHours(ctx.hours, locale)} h`
  const stageFormatted = STAGE_LABELS[ctx.stage] ?? 'Ejecución'
  const metaLine = `${tLabel} · ${hoursFormatted} · ${stageFormatted}`

  return (
    <div className="relative flex min-h-[56px] overflow-hidden rounded-[16px] border border-line bg-white transition-all hover:border-line-strong">
      {/* Riel 6px con el color del terreno */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: ctx.color }}
      />

      <div className="flex min-w-0 flex-1 items-center justify-between py-2.5 pl-4 pr-2">
        {/* Left: Título & Meta */}
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
            {task.title}
          </p>
          <p className="mt-0.5 truncate text-[12px] font-medium leading-tight text-ink-3">
            {metaLine}
          </p>
        </button>

        {/* Right: Checkbox + Handle */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            role="checkbox"
            aria-checked={done}
            aria-label="Completar tarea"
            onClick={(e) => {
              e.stopPropagation()
              onToggle()
            }}
            className="flex size-11 shrink-0 items-center justify-center"
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

/** Compact chip for PeriodGrid cells — same color language as TaskBlock. */
export function TaskBlockChip({ task }: { task: Task }) {
  const state = useAleph()
  const ctx = blockContext(state, task)
  return (
    <span className="flex min-w-0 items-center gap-1.5 py-0.5">
      <span
        aria-hidden
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: ctx.color }}
      />
      <span className="min-w-0 truncate text-[11px] font-medium leading-tight text-ink">
        {task.title}
      </span>
    </span>
  )
}
