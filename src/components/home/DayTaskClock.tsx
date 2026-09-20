import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BellOff,
  Check,
  Play,
  LayoutGrid,
  Plus,
  SlidersHorizontal,
  FolderSync,
  ArrowRight,
  X,
  Search,
} from 'lucide-react'
import { TacticalTaskModal } from '@/components/task/TacticalTaskModal'
import { useFeedback } from '@/app/FeedbackProvider'
import { captureLooseTask, completeTask, reopenTask, updateTask } from '@/data/actions'
import { startExecution, useFocusSession } from '@/data/focusSession'
import { blockContext } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { isTaskDone } from '@/domain/economy'
import { TERRENO_MAP } from '@/domain/terrenos'
import type { Task } from '@/domain/types'

interface DayTaskClockProps {
  tasks: Task[]
  activeDay: string
  todayKey: string
  localeTag: string
  onOpenCanvas?: () => void
  onQuickAdd?: () => void
}

/**
 * Converts polar coordinates to Cartesian for SVG paths.
 * 0 degrees = 12 o'clock (top)
 */
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  }
}

/**
 * Generates an SVG arc path
 */
function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  if (endAngle - startAngle >= 359.9) {
    const p1 = polarToCartesian(x, y, radius, 0)
    const p2 = polarToCartesian(x, y, radius, 180)
    return `M ${p1.x} ${p1.y} A ${radius} ${radius} 0 1 1 ${p2.x} ${p2.y} A ${radius} ${radius} 0 1 1 ${p1.x} ${p1.y}`
  }

  const start = polarToCartesian(x, y, radius, endAngle)
  const end = polarToCartesian(x, y, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
  return ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(' ')
}

function formatDurationSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

/**
 * Reloj Común de 12 Horas con Indicador AM / PM:
 * - Muestra las 12 horas de AM o las 12 horas de PM mediante un selector/indicador.
 * - Esfera limpia de reloj común (números 12, 1, 2... 11, manecillas, centro limpio sin mensajes).
 * - Contorno perimetral con los arcos de horas en color activo (proyecto) o inactivo (gris).
 * - Encima de las tareas: espacio para "+ Tarea".
 * - Debajo: lista de tareas con botón "Ejecutar" en tiempo real.
 * - Por debajo de la lista: botón "Planificar el día" visible y destacado.
 */
export function DayTaskClock({
  tasks,
  activeDay,
  todayKey,
  onOpenCanvas,
}: DayTaskClockProps) {
  const state = useAleph()
  const feedback = useFeedback()
  const focusSession = useFocusSession()

  // Determine current period (AM or PM) based on real time by default
  const now = new Date()
  const isCurrentAm = now.getHours() < 12
  const [period, setPeriod] = useState<'AM' | 'PM'>(isCurrentAm ? 'AM' : 'PM')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [hoveredHour, setHoveredHour] = useState<number | null>(null)
  const [selectedTacticalTaskId, setSelectedTacticalTaskId] = useState<string | null>(null)

  const isToday = activeDay === todayKey
  const isPastDay = activeDay < todayKey
  const currentDecimalHour = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600

  const navigate = useNavigate()
  const [showBacklogPicker, setShowBacklogPicker] = useState(false)
  const [backlogSearch, setBacklogSearch] = useState('')

  const backlogTasks = useMemo(() => {
    const currentIds = new Set(tasks.map((t) => t.id))
    return state.tasks.filter((t) => {
      if (currentIds.has(t.id) || isTaskDone(t.status)) return false
      if (!backlogSearch.trim()) return true
      const term = backlogSearch.toLowerCase()
      return t.title.toLowerCase().includes(term)
    })
  }, [state.tasks, tasks, backlogSearch])

  // Map each task according to its real execution or completion timing
  const taskPlacements = useMemo(() => {
    const placements: Array<{
      task: Task
      index: number
      startHour: number
      duration: number
      endHour: number
      done: boolean
      isExecuting: boolean
      color: string
      ctx: ReturnType<typeof blockContext>
      terrenoInfo: (typeof TERRENO_MAP)[keyof typeof TERRENO_MAP]
    }> = []

    for (let index = 0; index < tasks.length; index++) {
      const task = tasks[index]
      const done = isTaskDone(task.status)
      const isExecuting = focusSession.activeTaskId === task.id
      const ctx = blockContext(state, task)
      const color = ctx.projectColor || ctx.color || '#7a3fe0'
      const terrenoInfo = TERRENO_MAP[ctx.terreno ?? 'literatura']

      let startHour: number | null = null
      let duration = 0

      if (isExecuting) {
        startHour = focusSession.startHour ?? (now.getHours() + now.getMinutes() / 60)
        duration = Math.max(0.05, focusSession.elapsedSeconds / 3600)
      } else if (done) {
        duration = Math.max(0.08, task.actualHours ?? task.estimatedHours ?? 0.5)

        if (task.completedAt) {
          try {
            const completedDate = new Date(task.completedAt)
            const compHour = completedDate.getHours() + completedDate.getMinutes() / 60
            startHour = (compHour - duration + 24) % 24
          } catch {
            // fallback
          }
        }

        if (startHour === null && task.scheduledStart) {
          const parts = task.scheduledStart.split(':').map(Number)
          startHour = (parts[0] ?? 9) + (parts[1] ?? 0) / 60
        }
      } else if (task.scheduledStart) {
        const parts = task.scheduledStart.split(':').map(Number)
        startHour = (parts[0] ?? 9) + (parts[1] ?? 0) / 60
        duration = Math.max(0.2, task.actualHours ?? task.estimatedHours ?? 0.5)
      }

      if (startHour !== null) {
        const endHour = (startHour + duration) % 24
        placements.push({
          task,
          index,
          startHour,
          duration,
          endHour,
          done,
          isExecuting,
          color,
          ctx,
          terrenoInfo,
        })
      }
    }

    return placements
  }, [tasks, state, focusSession.activeTaskId, focusSession.elapsedSeconds, focusSession.startHour])

  // Hourly slot analysis for the 12 hours of the selected period
  // If AM: hours 0..11. If PM: hours 12..23.
  const hourlySlots = useMemo(() => {
    const baseHour = period === 'AM' ? 0 : 12
    return Array.from({ length: 12 }, (_, index) => {
      const actualHour = baseHour + index
      const clockNum = index === 0 ? 12 : index

      // Check overlapping tasks
      const matching = taskPlacements.filter((tp) => {
        if (tp.startHour <= tp.endHour) {
          return tp.startHour < actualHour + 1 && tp.endHour > actualHour
        }
        return tp.startHour < actualHour + 1 || tp.endHour > actualHour
      })

      const completedTask = matching.find((tp) => tp.done)
      const executingTask = matching.find((tp) => tp.isExecuting)

      const hasElapsed = isPastDay || (isToday && actualHour + 1 <= currentDecimalHour)

      let stateType: 'active' | 'inactive' | 'future_free'
      let mainColor = '#f1f5f9'
      let label = 'Disponible'

      if (executingTask) {
        stateType = 'active'
        mainColor = executingTask.color
        label = `${executingTask.task.title} (En curso)`
      } else if (completedTask) {
        stateType = 'active'
        mainColor = completedTask.color
        label = `${completedTask.task.title} (Activo)`
      } else if (hasElapsed) {
        stateType = 'inactive'
        mainColor = '#94a3b8' // Gris inactivo
        label = 'Inactivo'
      } else {
        stateType = 'future_free'
        mainColor = '#f1f5f9'
        label = 'Disponible'
      }

      return {
        index,
        actualHour,
        clockNum,
        stateType,
        mainColor,
        label,
        matching,
      }
    })
  }, [period, taskPlacements, isPastDay, isToday, currentDecimalHour])

  // Total active and inactive hours for the day
  const hoursStats = useMemo(() => {
    let activeHours = 0
    let inactiveHours = 0

    // Full 24h analysis
    for (let h = 0; h < 24; h++) {
      const matching = taskPlacements.filter((tp) => {
        if (tp.startHour <= tp.endHour) {
          return tp.startHour < h + 1 && tp.endHour > h
        }
        return tp.startHour < h + 1 || tp.endHour > h
      })
      const hasElapsed = isPastDay || (isToday && h + 1 <= currentDecimalHour)
      if (matching.some((m) => m.done || m.isExecuting)) {
        activeHours++
      } else if (hasElapsed) {
        inactiveHours++
      }
    }

    return { activeHours, inactiveHours }
  }, [taskPlacements, isPastDay, isToday, currentDecimalHour])

  const handleToggle = (task: Task) => {
    if (isTaskDone(task.status)) {
      reopenTask(task.id)
    } else {
      const outcome = completeTask(task.id)
      if (outcome) {
        feedback.celebrate(outcome)
      }
    }
  }

  const handleExecute = (task: Task) => {
    startExecution(task, activeDay)
  }

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newTaskTitle.trim()
    if (!trimmed) return
    captureLooseTask(trimmed, { scheduledFor: activeDay })
    setNewTaskTitle('')
  }

  // Geometry of the Common 12-Hour Clock Face
  const size = 220
  const center = size / 2
  const contourRadius = 90
  const contourStroke = 8
  const numeralRadius = 72

  // Numerals 12, 1, 2, ... 11
  const clockNumerals = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

  // Hand calculations when viewing current period on today
  const isPeriodCurrent = (isCurrentAm && period === 'AM') || (!isCurrentAm && period === 'PM')
  const currentHour12 = ((now.getHours() % 12) + now.getMinutes() / 60)
  const hourHandAngle = (currentHour12 / 12) * 360
  const minuteHandAngle = (now.getMinutes() / 60) * 360

  const hourHandPoint = polarToCartesian(center, center, 44, hourHandAngle)
  const minuteHandPoint = polarToCartesian(center, center, 62, minuteHandAngle)

  return (
    <div className="flex flex-col items-center select-none w-full">
      {/* 1. Barra Superior: Indicador AM o PM + Estado Activo/Inactivo */}
      <div className="flex items-center justify-between w-full mb-2.5 px-0.5">
        {/* Indicador conmutador AM / PM */}
        <div className="flex items-center bg-subtle p-0.5 rounded-full border border-line text-[11px] font-bold shadow-xs">
          <button
            type="button"
            onClick={() => setPeriod('AM')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
              period === 'AM'
                ? 'bg-amber-500 text-white shadow-xs font-black'
                : 'text-ink-3 hover:text-ink hover:bg-white/50'
            }`}
          >
            <span>☀️ 12h AM</span>
          </button>
          <button
            type="button"
            onClick={() => setPeriod('PM')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
              period === 'PM'
                ? 'bg-indigo-600 text-white shadow-xs font-black'
                : 'text-ink-3 hover:text-ink hover:bg-white/50'
            }`}
          >
            <span>🌙 12h PM</span>
          </button>
        </div>

        {/* Indicador activo / inactivo */}
        <div className="flex items-center gap-2 text-[10px] font-bold">
          <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50/90 px-2 py-0.5 rounded-full border border-emerald-200">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span>{hoursStats.activeHours}h activo</span>
          </span>
          <span className="flex items-center gap-1 text-slate-600 bg-slate-100/90 px-2 py-0.5 rounded-full border border-slate-200">
            <span className="size-2 rounded-full bg-slate-400" />
            <span>{hoursStats.inactiveHours}h inactivo</span>
          </span>
        </div>
      </div>

      {/* 2. Reloj Común con contorno de 12 horas activo/inactivo (Sin textos ni 1/5h adentro) */}
      <div className="relative flex items-center justify-center my-0.5">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
        >
          {/* Fondo de esfera de reloj común */}
          <circle
            cx={center}
            cy={center}
            r={contourRadius + 6}
            fill="#ffffff"
            stroke="#e2e8f0"
            strokeWidth="1.5"
            className="shadow-xs"
          />

          {/* Marcas menores de minutos en el reloj común */}
          {Array.from({ length: 60 }).map((_, i) => {
            if (i % 5 === 0) return null // Handled by hour positions
            const pt1 = polarToCartesian(center, center, contourRadius - contourStroke / 2 - 3, i * 6)
            const pt2 = polarToCartesian(center, center, contourRadius - contourStroke / 2 - 6, i * 6)
            return (
              <line
                key={`tick-${i}`}
                x1={pt1.x}
                y1={pt1.y}
                x2={pt2.x}
                y2={pt2.y}
                stroke="#cbd5e1"
                strokeWidth="1"
                strokeLinecap="round"
                opacity="0.6"
              />
            )
          })}

          {/* Contorno de horas (12 sectores para AM o PM) */}
          {hourlySlots.map((slot) => {
            const startAngle = slot.index * 30
            const endAngle = (slot.index + 1) * 30
            const gap = 2.5
            const arc = describeArc(center, center, contourRadius, startAngle + gap, endAngle - gap)
            const isHovered = hoveredHour === slot.actualHour
            const strokeW = isHovered ? contourStroke + 3 : contourStroke

            return (
              <g
                key={`slot-${slot.actualHour}`}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredHour(slot.actualHour)}
                onMouseLeave={() => setHoveredHour(null)}
              >
                <path
                  d={arc}
                  fill="none"
                  stroke={slot.mainColor}
                  strokeWidth={strokeW}
                  strokeLinecap="round"
                  className={slot.stateType === 'active' && focusSession.activeTaskId ? 'animate-pulse' : ''}
                />
              </g>
            )
          })}

          {/* Números del reloj común (12, 1, 2, ... 11) */}
          {clockNumerals.map((num, i) => {
            const angle = i * 30
            const pt = polarToCartesian(center, center, numeralRadius, angle)
            const isQuarter = num === 12 || num === 3 || num === 6 || num === 9

            return (
              <text
                key={`num-${num}`}
                x={pt.x}
                y={pt.y}
                textAnchor="middle"
                dominantBaseline="central"
                className={`select-none ${
                  isQuarter
                    ? 'text-[11px] font-black fill-ink'
                    : 'text-[9.5px] font-bold fill-ink-3'
                }`}
              >
                {num}
              </text>
            )
          })}

          {/* Manecillas del reloj común (Aguja de hora y minutero cuando corresponde a hoy y al período) */}
          {isToday && isPeriodCurrent ? (
            <g className="transition-all duration-700 ease-out pointer-events-none">
              {/* Manecilla de minutos */}
              <line
                x1={center}
                y1={center}
                x2={minuteHandPoint.x}
                y2={minuteHandPoint.y}
                stroke="#475569"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              {/* Manecilla de horas */}
              <line
                x1={center}
                y1={center}
                x2={hourHandPoint.x}
                y2={hourHandPoint.y}
                stroke="#0f172a"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              {/* Pin central del reloj común */}
              <circle cx={center} cy={center} r={4.5} fill="#0f172a" />
              <circle cx={center} cy={center} r={1.8} fill={period === 'AM' ? '#f59e0b' : '#6366f1'} />
            </g>
          ) : (
            /* Pin central en reposo */
            <g className="pointer-events-none">
              <circle cx={center} cy={center} r={3.5} fill="#94a3b8" />
              <circle cx={center} cy={center} r={1.5} fill="#ffffff" />
            </g>
          )}
        </svg>

        {/* Indicador flotante sutil si se sobrevuela una hora */}
        {hoveredHour !== null && (
          <div className="absolute bottom-1 rounded-full bg-[#111318]/90 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md pointer-events-none animate-fadeIn">
            {hoveredHour}:00 - {hoveredHour + 1}:00: {hourlySlots.find((s) => s.actualHour === hoveredHour)?.label}
          </div>
        )}
      </div>

      {/* 3. Encima de las tareas: Espacio para "+ Tarea" y "De Planificación" */}
      <div className="mt-3 w-full flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleQuickAdd} className="flex items-center gap-1.5 w-full">
          <div className="relative flex-1">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Nueva tarea para este día..."
              className="w-full rounded-xl border border-line bg-subtle/60 px-3 py-1.5 text-[12px] text-ink placeholder:text-ink-4 focus:bg-white focus:border-[#7a3fe0] focus:outline-none focus:ring-2 focus:ring-[#7a3fe0]/15 transition-all shadow-2xs"
            />
          </div>
          <button
            type="submit"
            disabled={!newTaskTitle.trim()}
            className="flex items-center gap-1 rounded-xl bg-[#111318] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-black active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all shrink-0 shadow-xs"
          >
            <Plus className="size-3.5 stroke-[2.5]" />
            <span>+ Tarea</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setShowBacklogPicker(true)
            }}
            className="flex items-center justify-center rounded-xl bg-purple-50 text-[#7a3fe0] border border-purple-200/80 p-1.5 hover:bg-purple-100 active:scale-95 transition-all shrink-0 shadow-2xs"
            title="Seleccionar tareas existentes de tus proyectos en Planificación"
          >
            <FolderSync className="size-3.5" />
          </button>
        </form>

        {/* 4. Debajo: Lista de Tareas compacta con botón Ejecutar (No Molestar) */}
        <div className="flex flex-col gap-1.5 max-h-[190px] overflow-y-auto pr-0.5">
          {tasks.length === 0 ? (
            <div className="rounded-[12px] border border-dashed border-line p-3 text-center text-[12px] text-ink-3">
              No hay tareas asignadas. Escribí una arriba para sumar al día.
            </div>
          ) : (
            tasks.map((task) => {
              const ctx = blockContext(state, task)
              const done = isTaskDone(task.status)
              const isExecuting = focusSession.activeTaskId === task.id
              const color = ctx.projectColor || ctx.color || '#7a3fe0'
              const terrenoInfo = TERRENO_MAP[ctx.terreno ?? 'literatura']

              const dedicatedText = task.actualHours
                ? `${Math.round(task.actualHours * 60)} min dedicados`
                : isExecuting
                  ? `${formatDurationSeconds(focusSession.elapsedSeconds)} en curso`
                  : null

              const checklist = task.checklist || []
              const doneItems = checklist.filter((c) => c.done).length
              const transactions = task.moneyTransactions || []
              const inc = transactions.filter((t) => t.type === 'income').reduce((a, b) => a + b.amount, 0)
              const exp = transactions.filter((t) => t.type === 'expense').reduce((a, b) => a + b.amount, 0)
              const net = inc - exp

              return (
                <div
                  key={task.id}
                  onClick={(e) => e.stopPropagation()}
                  className={`group flex items-center justify-between gap-2 rounded-[12px] p-2 border transition-all ${
                    isExecuting
                      ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-300'
                      : 'bg-white border-line/80 hover:border-line'
                  }`}
                >
                  {/* Left: Checkbox + Title + Badges */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggle(task)
                      }}
                      className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all active:scale-90 ${
                        done
                          ? 'border-transparent text-white shadow-xs'
                          : 'border-line hover:border-line-strong bg-white'
                      }`}
                      style={{ backgroundColor: done ? color : undefined }}
                      title={done ? 'Reabrir tarea' : 'Completar tarea'}
                    >
                      {done && <Check className="size-3 stroke-[3]" />}
                    </button>

                    <div
                      className="flex flex-col min-w-0 flex-1 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedTacticalTaskId(task.id)
                      }}
                      title="Abrir estudio táctico (variables, dinero, contactos, mapas)"
                    >
                      <span
                        className={`text-[12px] font-semibold truncate leading-tight transition-all hover:text-purple-700 ${
                          done ? 'line-through text-ink-3' : 'text-ink'
                        }`}
                      >
                        {task.title}
                      </span>

                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span
                          className="size-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-[10px] font-medium text-ink-3 truncate">
                          {ctx.project?.name ?? ctx.result?.name ?? 'Suelto'}
                        </span>
                        {ctx.terreno && (
                          <span
                            className="text-[9px] font-medium px-1 rounded shrink-0"
                            style={{
                              backgroundColor: `${terrenoInfo.color}15`,
                              color: terrenoInfo.color,
                            }}
                          >
                            {terrenoInfo.label}
                          </span>
                        )}

                        {dedicatedText && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full tabular-nums ${
                              isExecuting
                                ? 'bg-amber-100 text-amber-800 animate-pulse'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            ⏱️ {dedicatedText}
                          </span>
                        )}

                        {/* Tactical Micro-badges */}
                        {checklist.length > 0 && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
                            ✓ {doneItems}/{checklist.length}
                          </span>
                        )}

                        {transactions.length > 0 && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                              net >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            💰 {net >= 0 ? `+$${net.toLocaleString()}` : `-$${Math.abs(net).toLocaleString()}`}
                          </span>
                        )}

                        {(task.contacts?.length ?? 0) > 0 && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700">
                            👥 {task.contacts?.length}
                          </span>
                        )}

                        {(task.metrics?.length ?? 0) > 0 && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-50 text-amber-700">
                            📊 {task.metrics?.length}
                          </span>
                        )}

                        {Boolean(task.thoughtMap?.nodes?.length) && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-purple-50 text-purple-700">
                            🧠 Mapa
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Tactical Button + Botón Ejecutar */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedTacticalTaskId(task.id)
                      }}
                      className="p-1.5 rounded-lg text-ink-3 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                      title="Abrir táctica y producción"
                    >
                      <SlidersHorizontal className="size-3.5" />
                    </button>

                    {!done && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleExecute(task)
                        }}
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
                      <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-0.5">
                        <Check className="size-3" />
                        <span>Lista</span>
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Modal para traer tareas de Planificación */}
        {showBacklogPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn select-none">
            <div
              className="relative flex flex-col w-full max-w-lg max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-line overflow-hidden animate-scaleUp"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-line bg-gradient-to-r from-purple-50/70 to-white shrink-0">
                <div className="flex items-center gap-2.5">
                  <FolderSync className="size-5 text-[#7a3fe0]" />
                  <div>
                    <h3 className="text-[15px] font-bold text-ink">Traer tareas de Planificación</h3>
                    <p className="text-[12px] text-ink-3">Sumá tareas pendientes a la agenda de este día</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBacklogPicker(false)}
                  className="size-8 rounded-full flex items-center justify-center text-ink-3 hover:text-ink hover:bg-subtle transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="p-3 border-b border-line bg-subtle/40">
                <div className="relative flex items-center">
                  <Search className="size-4 text-ink-4 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={backlogSearch}
                    onChange={(e) => setBacklogSearch(e.target.value)}
                    placeholder="Buscar en proyectos y backlog..."
                    className="w-full rounded-xl border border-line bg-white pl-9 pr-3 py-1.5 text-[12px] text-ink placeholder:text-ink-4 focus:outline-none focus:border-[#7a3fe0]"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                {backlogTasks.length === 0 ? (
                  <div className="p-8 text-center text-[12px] text-ink-3">
                    No hay más tareas pendientes disponibles para agendar.
                  </div>
                ) : (
                  backlogTasks.map((bt) => {
                    const bCtx = blockContext(state, bt)
                    const color = bCtx.projectColor || '#7a3fe0'
                    return (
                      <div
                        key={bt.id}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-line bg-white hover:border-line-strong hover:shadow-2xs transition-all"
                        style={{ borderLeftWidth: '3.5px', borderLeftColor: color }}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-ink truncate">{bt.title}</p>
                          <p className="text-[11px] text-ink-3 truncate">
                            {bCtx.project?.name ?? bCtx.result?.name ?? 'Suelto'}
                            {bt.scheduledFor ? ` · Agendada: ${bt.scheduledFor}` : ' · Sin agendar (Backlog)'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            updateTask(bt.id, {
                              scheduledFor: activeDay,
                              dueAt: activeDay,
                              stage: 'execution',
                            })
                          }}
                          className="flex items-center gap-1 rounded-xl bg-emerald-600 text-white px-2.5 py-1 text-[11px] font-bold hover:bg-emerald-700 active:scale-95 transition-all shrink-0"
                        >
                          <Plus className="size-3 stroke-[2.5]" />
                          <span>Sumar al Día</span>
                        </button>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="p-3 border-t border-line bg-slate-50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setShowBacklogPicker(false)
                    navigate('/planning')
                  }}
                  className="flex items-center gap-1 text-[12px] font-bold text-indigo-700 hover:underline"
                >
                  <span>Abrir Planificación Completa</span>
                  <ArrowRight className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowBacklogPicker(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-line text-[12px] font-semibold text-ink-2 hover:bg-subtle"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. Por debajo: Botón "Planificar el día" mucho más visible */}
        {onOpenCanvas && (
          <button
            type="button"
            onClick={onOpenCanvas}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7a3fe0] to-[#5b21b6] py-2.5 px-4 text-[13px] font-bold text-white shadow-md shadow-[#7a3fe0]/20 hover:shadow-lg hover:shadow-[#7a3fe0]/30 hover:brightness-105 active:scale-[0.99] transition-all"
          >
            <LayoutGrid className="size-4" />
            <span>Planificar el día</span>
          </button>
        )}

        {/* Tactical Task Modal */}
        {selectedTacticalTaskId && (
          <TacticalTaskModal
            taskId={selectedTacticalTaskId}
            onClose={() => setSelectedTacticalTaskId(null)}
          />
        )}
      </div>
    </div>
  )
}

/**
 * Mini Reloj de Día para celdas semanales
 */
export function MiniDayClock({
  tasks,
  className = '',
}: {
  tasks: Task[]
  className?: string
}) {
  const state = useAleph()
  const completed = tasks.filter((t) => isTaskDone(t.status))
  const doneCount = completed.length
  const totalCount = tasks.length
  const allDone = totalCount > 0 && doneCount === totalCount

  const size = 36
  const center = size / 2
  const r = 13
  const strokeW = 3.5

  if (totalCount === 0) {
    return (
      <div className={`relative flex items-center justify-center select-none ${className}`}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={center}
            cy={center}
            r={r}
            fill="none"
            stroke="#e6e8ee"
            strokeWidth="1.5"
            strokeDasharray="2 2"
            opacity="0.7"
          />
        </svg>
      </div>
    )
  }

  const gap = totalCount > 1 ? 4 : 0
  const step = 360 / totalCount
  const segments = tasks.map((t, idx) => {
    const ctx = blockContext(state, t)
    const done = isTaskDone(t.status)
    const color = ctx.projectColor || ctx.color || '#7a3fe0'
    const start = idx * step + gap / 2
    const end = (idx + 1) * step - gap / 2
    return { id: t.id, start, end, done, color }
  })

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center}
          cy={center}
          r={r + 3}
          fill="none"
          stroke="#edf0f5"
          strokeWidth="1"
        />

        {segments.map((s) => (
          <path
            key={s.id}
            d={describeArc(center, center, r, s.start, s.end)}
            fill="none"
            stroke={s.done ? s.color : '#9ca3af'}
            strokeWidth={strokeW}
            strokeLinecap="round"
          />
        ))}

        {allDone ? (
          <circle cx={center} cy={center} r={3} fill="#10b981" />
        ) : (
          <circle cx={center} cy={center} r={1.5} fill="#8c93a3" />
        )}
      </svg>
    </div>
  )
}

/**
 * Micro Dial de Tiempo para celdas del mes
 */
export function MicroDayClock({ tasks }: { tasks: Task[] }) {
  const state = useAleph()
  const completed = tasks.filter((t) => isTaskDone(t.status))
  const doneCount = completed.length
  const totalCount = tasks.length
  const allDone = totalCount > 0 && doneCount === totalCount

  const size = 20
  const center = size / 2
  const r = 7
  const strokeW = 2

  if (totalCount === 0) {
    return (
      <div className="size-5 flex items-center justify-center">
        <span className="size-1 rounded-full bg-slate-200" />
      </div>
    )
  }

  const step = 360 / totalCount
  const gap = totalCount > 1 ? 3 : 0
  const segments = tasks.map((t, idx) => {
    const ctx = blockContext(state, t)
    const done = isTaskDone(t.status)
    const color = ctx.projectColor || ctx.color || '#7a3fe0'
    const start = idx * step + gap / 2
    const end = (idx + 1) * step - gap / 2
    return { id: t.id, start, end, done, color }
  })

  return (
    <div className="relative flex items-center justify-center select-none">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={center} cy={center} r={r} fill="none" stroke="#f0f2f6" strokeWidth={strokeW} />
        {segments.map((s) => (
          <path
            key={s.id}
            d={describeArc(center, center, r, s.start, s.end)}
            fill="none"
            stroke={s.done ? s.color : '#cbd5e1'}
            strokeWidth={strokeW}
            strokeLinecap="round"
          />
        ))}
        {allDone && <circle cx={center} cy={center} r={1.5} fill="#10b981" />}
      </svg>
    </div>
  )
}
