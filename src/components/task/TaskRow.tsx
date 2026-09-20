import type { ReactNode } from 'react'
import {
  BarChart3,
  BellOff,
  Brain,
  Calendar,
  Check,
  Coins,
  Play,
  Plus,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react'
import { cx } from '@/components/ui/primitives'
import { RowMenu } from '@/components/ui/RowMenu'
import { useFeedback } from '@/app/FeedbackProvider'
import { completeTask, reopenTask, updateTask } from '@/data/actions'
import { startExecution, useFocusSession } from '@/data/focusSession'
import { blockContext, objectiveById, resultById } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { toDayKey } from '@/domain/dates'
import { isTaskDone } from '@/domain/economy'
import { TERRENO_MAP } from '@/domain/terrenos'
import { formatDate } from '@/i18n/format'
import type { Task } from '@/domain/types'

export interface TaskRowProps {
  task: Task
  onToggle?: () => void
  onOpen?: () => void
  onOpenTactical?: () => void
  onAssign?: () => void
  onExecute?: () => void
  onReturn?: () => void
  onDelete?: () => void
  onScheduleToday?: () => void
  handle?: ReactNode
  showContext?: boolean
  showProjection?: boolean
  hideCheckbox?: boolean
  className?: string
  activeDay?: string
  compact?: boolean
}

export function TaskCheckbox({
  done,
  onToggle,
  label = 'Completar tarea',
  color = '#7a3fe0',
}: {
  done: boolean
  onToggle: () => void
  label?: string
  color?: string
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={label}
      onClick={onToggle}
      className={`size-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-transform active:scale-90 ${
        done ? 'border-transparent text-white shadow-xs' : 'border-line-strong hover:border-ink bg-white'
      }`}
      style={{ backgroundColor: done ? color : undefined }}
      title={done ? 'Reabrir tarea' : 'Completar tarea'}
    >
      {done && <Check className="size-3.5 stroke-[3]" />}
    </button>
  )
}

function formatStopwatch(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function TaskRow({
  task,
  onToggle,
  onOpen,
  onOpenTactical,
  onExecute,
  onDelete,
  handle,
  showContext = true,
  hideCheckbox = false,
  className,
  activeDay,
  compact = false,
}: TaskRowProps) {
  const state = useAleph()
  const feedback = useFeedback()
  const session = useFocusSession()
  const locale = state.character.locale
  const todayKey = toDayKey(new Date())
  const effectiveDay = activeDay || todayKey

  const done = isTaskDone(task.status)
  const isExecuting = session.activeTaskId === task.id
  const ctx = blockContext(state, task)
  const result = resultById(state, task.resultId)
  const objective = objectiveById(state, task.objectiveId)
  const contextResult = result ?? (task.objectiveId ? resultById(state, objective?.resultId) : undefined)
  const loose = !task.objectiveId && !task.resultId

  const tInfo = TERRENO_MAP[task.terreno ?? 'literatura']
  const projectColor = ctx.projectColor || '#7a3fe0'
  const projectName = ctx.project?.name || contextResult?.projectName

  const isScheduledToday = task.scheduledFor === todayKey || task.dueAt === todayKey

  // Tactical data counts
  const checklist = task.checklist || []
  const doneChecklist = checklist.filter((c) => c.done).length
  const transactions = task.moneyTransactions || []
  const inc = transactions.filter((t) => t.type === 'income').reduce((a, b) => a + b.amount, 0)
  const exp = transactions.filter((t) => t.type === 'expense').reduce((a, b) => a + b.amount, 0)
  const netBalance = inc - exp
  const contactsCount = task.contacts?.length || 0
  const metricsCount = task.metrics?.length || 0
  const hasMindMap = Boolean(task.thoughtMap?.nodes?.length)

  const dedicatedText = task.actualHours
    ? `${Math.round(task.actualHours * 60)}m dedicados`
    : isExecuting
      ? `${formatStopwatch(session.elapsedSeconds)} en curso`
      : null

  const handleToggle = () => {
    if (onToggle) {
      onToggle()
      return
    }
    if (done) {
      reopenTask(task.id)
    } else {
      const outcome = completeTask(task.id)
      if (outcome) feedback.celebrate(outcome)
    }
  }

  const handleExecute = () => {
    if (onExecute) {
      onExecute()
      return
    }
    startExecution(task, effectiveDay)
  }

  const handleOpenDetails = () => {
    if (onOpenTactical) {
      onOpenTactical()
    } else if (onOpen) {
      onOpen()
    }
  }

  const handlePutInToday = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateTask(task.id, {
      scheduledFor: todayKey,
      dueAt: todayKey,
      stage: 'execution',
    })
  }

  const handleRemoveFromToday = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateTask(task.id, {
      scheduledFor: undefined,
      dueAt: undefined,
    })
  }

  return (
    <div
      className={cx(
        'group relative flex items-center justify-between gap-2.5 rounded-2xl border transition-all p-2.5 sm:p-3 select-none',
        isExecuting
          ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-300'
          : done
            ? 'bg-surface/50 border-line/70 opacity-80'
            : 'bg-white border-line hover:border-line-strong hover:shadow-xs',
        className,
      )}
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: projectColor,
      }}
    >
      {/* LEFT: Checkbox + Title + Badges */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {!hideCheckbox && (
          <TaskCheckbox
            done={done}
            onToggle={handleToggle}
            label="Completar tarea"
            color={projectColor}
          />
        )}

        <div
          className="flex flex-col min-w-0 flex-1 cursor-pointer"
          onClick={handleOpenDetails}
          title="Abrir estudio táctico y detalles"
        >
          {/* Title Row */}
          <div className="flex min-w-0 flex-col">
            {showContext && objective ? (
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-3 truncate">
                Objetivo · {objective.name}
              </span>
            ) : null}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-3 shrink-0">
                Tarea
              </span>
              <span
                className={cx(
                  'text-[13px] sm:text-[14px] font-semibold leading-tight truncate transition-colors group-hover:text-[#7a3fe0]',
                  done ? 'line-through text-ink-3' : 'text-ink',
                )}
              >
                {task.title}
              </span>
            </div>
          </div>

          {/* Context, Terreno & Schedule Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            {/* Project / Result indicator */}
            {showContext && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-ink-3 truncate max-w-[160px] sm:max-w-[220px]">
                <span
                  className="size-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: projectColor }}
                />
                <span className="truncate">
                  {projectName
                    ? `${projectName}${contextResult ? ` · Resultado · ${contextResult.name}` : ''}`
                    : contextResult
                      ? `Resultado · ${contextResult.name}`
                      : loose
                        ? 'Suelto'
                        : 'La Obra'}
                </span>
              </span>
            )}

            {/* Terreno Pill */}
            {tInfo && (
              <span
                className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                style={{
                  backgroundColor: `${tInfo.color}15`,
                  color: tInfo.color,
                }}
              >
                <span>{tInfo.label}</span>
              </span>
            )}

            {/* SYNC WITH HOME / SCHEDULE BADGE */}
            {isScheduledToday ? (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                <span>☀️ En Home (Hoy)</span>
                <button
                  type="button"
                  onClick={handleRemoveFromToday}
                  className="hover:text-rose-600 transition-colors ml-0.5"
                  title="Quitar de Home hoy"
                >
                  <X className="size-2.5" />
                </button>
              </span>
            ) : task.scheduledFor ? (
              <span className="inline-flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 shrink-0">
                <Calendar className="size-2.5" />
                <span>{formatDate(task.scheduledFor, locale)}</span>
                <button
                  type="button"
                  onClick={handlePutInToday}
                  className="text-indigo-600 font-bold hover:underline ml-1"
                  title="Mover a hoy"
                >
                  Mover a hoy
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={handlePutInToday}
                className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 active:scale-95 transition-all shrink-0"
                title="Agendar esta tarea para que aparezca en el Home de hoy"
              >
                <Plus className="size-2.5 stroke-[3]" />
                <span>Poner en Home</span>
              </button>
            )}

            {/* Real Time Dedicated Badge */}
            {dedicatedText && (
              <span
                className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full tabular-nums ${
                  isExecuting
                    ? 'bg-amber-100 text-amber-900 animate-pulse'
                    : 'bg-purple-50 text-purple-700'
                }`}
              >
                <span>⏱️ {dedicatedText}</span>
              </span>
            )}

            {/* Tactical Micro-badges */}
            {!compact && checklist.length > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                <Check className="size-2.5" />
                <span>{doneChecklist}/{checklist.length}</span>
              </span>
            )}

            {!compact && transactions.length > 0 && (
              <span
                className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  netBalance >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}
              >
                <Coins className="size-2.5" />
                <span>{netBalance >= 0 ? `+$${netBalance.toLocaleString()}` : `-$${Math.abs(netBalance).toLocaleString()}`}</span>
              </span>
            )}

            {!compact && contactsCount > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                <Users className="size-2.5" />
                <span>{contactsCount}</span>
              </span>
            )}

            {!compact && metricsCount > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800">
                <BarChart3 className="size-2.5" />
                <span>{metricsCount}</span>
              </span>
            )}

            {!compact && hasMindMap && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700">
                <Brain className="size-2.5" />
                <span>Mapa</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT: Tactical Modal Button + Ejecutar Button */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Sliders button: Opens tactical details */}
        <button
          type="button"
          onClick={handleOpenDetails}
          className="p-1.5 rounded-xl text-ink-3 hover:text-[#7a3fe0] hover:bg-purple-50 transition-colors"
          title="Abrir estudio táctico (variables, dinero, contactos, mapas)"
        >
          <SlidersHorizontal className="size-4" />
        </button>

        {/* Ejecutar button */}
        {!done && (
          <button
            type="button"
            onClick={handleExecute}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition-all active:scale-95 shadow-xs ${
              isExecuting
                ? 'bg-amber-500 text-white animate-pulse'
                : 'bg-[#111318] text-white hover:bg-black'
            }`}
            title="Iniciar tarea sin límite preestablecido (No Molestar)"
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

        {done && (
          <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-0.5 px-1">
            <Check className="size-3.5 stroke-[2.5]" />
            <span>Lista</span>
          </span>
        )}

        {onDelete && (
          <RowMenu items={[{ label: 'Eliminar', tone: 'danger', onClick: onDelete }]} />
        )}

        {handle && <div className="opacity-40 pl-0.5">{handle}</div>}
      </div>
    </div>
  )
}
