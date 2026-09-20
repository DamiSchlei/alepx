import { useState, useMemo } from 'react'
import { Check, Clock } from 'lucide-react'
import { useFeedback } from '@/app/FeedbackProvider'
import { completeTask, reopenTask } from '@/data/actions'
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
 * Converts polar coordinates to Cartesian for SVG paths
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
  // If full circle (or > 359.9), draw two halves
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

/**
 * Reloj del Día:
 * Representa el paso del tiempo consumiendo las tareas propuestas para el día.
 * A medida que se van cumpliendo, el reloj "se las come" y adoptan el color
 * del proyecto / resultado que acercan a través del objetivo.
 */
export function DayTaskClock({
  tasks,
  onOpenCanvas,
}: DayTaskClockProps) {
  const state = useAleph()
  const feedback = useFeedback()
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null)

  const completedTasks = tasks.filter((t) => isTaskDone(t.status))
  const doneCount = completedTasks.length
  const totalCount = tasks.length
  const allCompleted = totalCount > 0 && doneCount === totalCount

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

  // Geometry
  const size = 180
  const center = size / 2
  const bezelRadius = 82
  const trackRadius = 66
  const strokeWidth = 11

  // 12 ticks for authentic clock face
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const angle = i * 30
    const isCardinal = i % 3 === 0 // 12, 3, 6, 9
    const innerR = isCardinal ? bezelRadius - 6 : bezelRadius - 3.5
    const p1 = polarToCartesian(center, center, innerR, angle)
    const p2 = polarToCartesian(center, center, bezelRadius, angle)
    return { id: i, p1, p2, isCardinal }
  })

  // Calculate angular segments for tasks
  const segments = useMemo(() => {
    const totalHours = tasks.reduce((sum, t) => sum + (t.actualHours ?? t.estimatedHours ?? 1), 0)
    const gap = totalCount > 1 ? Math.min(4.5, 360 / (totalCount * 3)) : 0

    let accAngle = 0
    const rawSegments = tasks.map((task) => {
      const duration = task.actualHours ?? task.estimatedHours ?? 1
      const span = totalCount === 1 ? 360 : Math.max(20, (duration / (totalHours || 1)) * 360)
      const start = accAngle + gap / 2
      const end = accAngle + span - gap / 2
      accAngle += span

      const ctx = blockContext(state, task)
      const done = isTaskDone(task.status)
      const color = ctx.projectColor || ctx.color || '#7a3fe0'
      const terrenoInfo = TERRENO_MAP[ctx.terreno ?? 'literatura']

      return {
        task,
        ctx,
        color,
        terrenoInfo,
        done,
        startAngle: start,
        endAngle: end,
        midAngle: (start + end) / 2,
      }
    })

    if (accAngle > 360 && totalCount > 1) {
      const factor = 360 / accAngle
      return rawSegments.map((seg) => ({
        ...seg,
        startAngle: seg.startAngle * factor,
        endAngle: seg.endAngle * factor,
        midAngle: ((seg.startAngle + seg.endAngle) / 2) * factor,
      }))
    }

    return rawSegments
  }, [tasks, totalCount, state])

  // Clock Hand angle: sweeps to the progress of the day
  const progressRatio = totalCount > 0 ? doneCount / totalCount : 0
  const handAngle = totalCount > 0 ? progressRatio * 360 : 300 // ~10:00 when empty
  const handPoint = polarToCartesian(center, center, trackRadius - 16, handAngle)

  const activeHoverTask = hoveredTaskId ? tasks.find((t) => t.id === hoveredTaskId) : null
  const activeHoverCtx = activeHoverTask ? blockContext(state, activeHoverTask) : null

  return (
    <div className="flex flex-col items-center select-none w-full">
      {/* Reloj Dial Visual */}
      <div className="relative flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
        >
          {/* Subtle Outer Clock Bezel */}
          <circle
            cx={center}
            cy={center}
            r={bezelRadius}
            fill="none"
            stroke="#e9ebf0"
            strokeWidth="1.2"
            className="opacity-80"
          />

          {/* 12 Hour Notches */}
          {ticks.map((t) => (
            <line
              key={t.id}
              x1={t.p1.x}
              y1={t.p1.y}
              x2={t.p2.x}
              y2={t.p2.y}
              stroke={t.isCardinal ? '#8c93a3' : '#c8ceda'}
              strokeWidth={t.isCardinal ? '2' : '1'}
              strokeLinecap="round"
            />
          ))}

          {/* If No Tasks: Empty Clock Guide */}
          {totalCount === 0 && (
            <circle
              cx={center}
              cy={center}
              r={trackRadius}
              fill="none"
              stroke="#f1f3f7"
              strokeWidth={strokeWidth}
              strokeDasharray="4 4"
            />
          )}

          {/* Task Segments around the Clock Dial */}
          {segments.map((seg) => {
            const isHovered = hoveredTaskId === seg.task.id
            const arcPath = describeArc(center, center, trackRadius, seg.startAngle, seg.endAngle)

            return (
              <g
                key={seg.task.id}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredTaskId(seg.task.id)}
                onMouseLeave={() => setHoveredTaskId(null)}
                onClick={() => handleToggle(seg.task)}
              >
                {/* Background track (what is proposed to be eaten) */}
                <path
                  d={arcPath}
                  fill="none"
                  stroke={seg.done ? seg.color : '#f0f2f6'}
                  strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />

                {/* If pending: faint preview rim with project color */}
                {!seg.done && (
                  <path
                    d={arcPath}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={isHovered ? 3 : 2}
                    strokeDasharray="3 3"
                    strokeLinecap="round"
                    className="opacity-45 transition-opacity duration-200"
                  />
                )}

                {/* Jewel/Beacon at the head of completed segment */}
                {seg.done && (
                  <circle
                    cx={polarToCartesian(center, center, trackRadius, seg.endAngle).x}
                    cy={polarToCartesian(center, center, trackRadius, seg.endAngle).y}
                    r={isHovered ? 4 : 2.5}
                    fill="#ffffff"
                    stroke={seg.color}
                    strokeWidth="1.5"
                  />
                )}
              </g>
            )
          })}

          {/* Clock Needle / Aguja del Tiempo */}
          {totalCount > 0 && (
            <g className="transition-all duration-500 ease-out">
              {/* Counter-balance tail */}
              <line
                x1={center}
                y1={center}
                x2={polarToCartesian(center, center, 14, handAngle + 180).x}
                y2={polarToCartesian(center, center, 14, handAngle + 180).y}
                stroke="#4b5563"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Forward needle pointing to conquered progress */}
              <line
                x1={center}
                y1={center}
                x2={handPoint.x}
                y2={handPoint.y}
                stroke={allCompleted ? '#10b981' : '#1e2229'}
                strokeWidth={allCompleted ? '3' : '2.5'}
                strokeLinecap="round"
              />
              {/* Center Pivot Bearing */}
              <circle cx={center} cy={center} r={6} fill="#1e2229" />
              <circle
                cx={center}
                cy={center}
                r={2.5}
                fill={allCompleted ? '#10b981' : '#ffffff'}
              />
            </g>
          )}
        </svg>

        {/* Center Text Hub */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4 text-center">
          {activeHoverTask && activeHoverCtx ? (
            <div className="flex flex-col items-center animate-fadeIn">
              <span
                className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider mb-0.5"
                style={{ backgroundColor: activeHoverCtx.projectColor }}
              >
                {activeHoverCtx.project?.name ?? 'Proyecto'}
              </span>
              <p className="text-[11px] font-bold text-ink truncate max-w-[85px]">
                {activeHoverTask.title}
              </p>
              <span className="text-[9px] font-medium text-ink-3">
                {isTaskDone(activeHoverTask.status) ? '✓ Completada' : 'Pendiente'}
              </span>
            </div>
          ) : totalCount === 0 ? (
            <div className="flex flex-col items-center">
              <Clock className="size-4 text-ink-4 mb-1" />
              <span className="text-[11px] font-semibold text-ink-3">Día libre</span>
            </div>
          ) : allCompleted ? (
            <div className="flex flex-col items-center animate-scaleIn">
              <div className="flex size-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-0.5">
                <Check className="size-4 stroke-[3]" />
              </div>
              <span className="text-[11px] font-bold text-emerald-700">¡Cumplido!</span>
              <span className="text-[9px] font-medium text-ink-3">
                {doneCount} de {totalCount}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-0.5">
                <span className="text-[22px] font-black text-ink leading-none">{doneCount}</span>
                <span className="text-[13px] font-bold text-ink-3">/{totalCount}</span>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-3 mt-1">
                Completadas
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tareas del día: Banda interactiva donde el reloj se va comiendo cada tarea */}
      <div className="mt-3.5 w-full flex flex-col gap-1.5">
        {totalCount === 0 ? (
          <div
            onClick={onOpenCanvas}
            className="rounded-[14px] border border-dashed border-line p-3 text-center text-[12px] text-ink-3 hover:border-line-strong hover:bg-subtle/40 cursor-pointer transition-colors"
          >
            Sin tareas asignadas. Tocá para planificar.
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-0.5">
            {tasks.map((task) => {
              const ctx = blockContext(state, task)
              const done = isTaskDone(task.status)
              const projectColor = ctx.projectColor || '#7a3fe0'
              const terrenoInfo = TERRENO_MAP[ctx.terreno ?? 'literatura']
              const isHovered = hoveredTaskId === task.id

              return (
                <div
                  key={task.id}
                  onMouseEnter={() => setHoveredTaskId(task.id)}
                  onMouseLeave={() => setHoveredTaskId(null)}
                  className={`group flex items-center justify-between gap-2 rounded-[12px] p-2 border transition-all ${
                    isHovered
                      ? 'bg-subtle border-line-strong shadow-xs'
                      : 'bg-white border-line/70 hover:border-line'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* Checkbox circular interactivo */}
                    <button
                      type="button"
                      onClick={() => handleToggle(task)}
                      className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all active:scale-90 ${
                        done
                          ? 'border-transparent text-white shadow-xs'
                          : 'border-line hover:border-line-strong bg-white'
                      }`}
                      style={{ backgroundColor: done ? projectColor : undefined }}
                      title={done ? 'Reabrir tarea' : 'Completar tarea'}
                    >
                      {done && <Check className="size-3 stroke-[3]" />}
                    </button>

                    {/* Título y badge de proyecto */}
                    <div className="flex flex-col min-w-0 flex-1">
                      <span
                        className={`text-[12px] font-semibold truncate leading-tight transition-all ${
                          done ? 'line-through text-ink-3' : 'text-ink'
                        }`}
                      >
                        {task.title}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className="size-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: projectColor }}
                        />
                        <span className="text-[10px] font-medium text-ink-3 truncate">
                          {ctx.project?.name ?? ctx.result?.name ?? 'Suelto'}
                        </span>
                        {ctx.terreno && (
                          <span
                            className="text-[9px] font-medium px-1 rounded"
                            style={{
                              backgroundColor: `${terrenoInfo.color}15`,
                              color: terrenoInfo.color,
                            }}
                          >
                            {terrenoInfo.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Horas estimadas */}
                  {(task.actualHours ?? task.estimatedHours) && (
                    <span className="text-[11px] font-medium text-ink-3 shrink-0 tabular-nums">
                      {task.actualHours ?? task.estimatedHours}h
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Mini Reloj de Día para celdas semanales:
 * Dial circular reducido que muestra el avance temporal de las tareas del día.
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
        {/* Bezel */}
        <circle
          cx={center}
          cy={center}
          r={r + 3}
          fill="none"
          stroke="#edf0f5"
          strokeWidth="1"
        />

        {/* Segments */}
        {segments.map((s) => (
          <path
            key={s.id}
            d={describeArc(center, center, r, s.start, s.end)}
            fill="none"
            stroke={s.done ? s.color : '#e2e6ed'}
            strokeWidth={strokeW}
            strokeLinecap="round"
          />
        ))}

        {/* Center dot or check */}
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
 * Micro Dial de Tiempo para celdas del mes:
 * Aro sutil que rodea o acompaña el número de día mostrando las tareas completadas
 * en sus colores de proyecto.
 */
export function MicroDayClock({
  tasks,
  className = '',
}: {
  tasks: Task[]
  className?: string
}) {
  const state = useAleph()
  const totalCount = tasks.length
  if (totalCount === 0) return null

  const completed = tasks.filter((t) => isTaskDone(t.status))
  const doneCount = completed.length
  const allDone = doneCount === totalCount

  const size = 22
  const center = size / 2
  const r = 8
  const strokeW = 2.2

  const gap = totalCount > 1 ? 5 : 0
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
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((s) => (
          <path
            key={s.id}
            d={describeArc(center, center, r, s.start, s.end)}
            fill="none"
            stroke={s.done ? s.color : '#d8dce6'}
            strokeWidth={strokeW}
            strokeLinecap="round"
          />
        ))}
        {allDone && <circle cx={center} cy={center} r={1.8} fill="#10b981" />}
      </svg>
    </div>
  )
}
