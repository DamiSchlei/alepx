import { blockContext } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { isTaskDone } from '@/domain/economy'
import { describeArc, polarToCartesian, type ClockSlotState } from '@/domain/clockHours'
import type { Task } from '@/domain/types'

export interface AnalogClockSlot {
  index: number
  actualHour: number
  color: string
  stateType: ClockSlotState
  executing?: boolean
}

export function AnalogClock({
  slots,
  showHands,
  hourAngle,
  minuteAngle,
  period,
  hoveredHour,
  onHoverHour,
  civilTime,
  size = 236,
}: {
  slots: AnalogClockSlot[]
  showHands: boolean
  hourAngle: number
  minuteAngle: number
  period: 'AM' | 'PM'
  hoveredHour: number | null
  onHoverHour?: (hour: number | null) => void
  civilTime?: string
  size?: number
}) {
  const center = size / 2
  const contourRadius = 94
  const contourStroke = 9
  const numeralRadius = 74
  const hourHand = polarToCartesian(center, center, 46, hourAngle)
  const minuteHand = polarToCartesian(center, center, 64, minuteAngle)
  const numerals = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  const pin = period === 'AM' ? 'var(--color-amber)' : 'var(--color-violet)'
  const taskSlots = slots.filter((slot) => slot.stateType === 'active')

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
        aria-hidden
      >
      <circle
        cx={center}
        cy={center}
        r={contourRadius + 8}
        fill="var(--color-clock-face)"
        stroke="var(--color-clock-ring)"
        strokeWidth="1"
      />

      {Array.from({ length: 60 }, (_, i) => {
        if (i % 5 === 0) return null
        const inner = polarToCartesian(center, center, contourRadius - 10, i * 6)
        const outer = polarToCartesian(center, center, contourRadius - 6, i * 6)
        return (
          <line
            key={`tick-${i}`}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            stroke="var(--color-clock-tick)"
            strokeWidth="1"
            strokeLinecap="round"
          />
        )
      })}

      <circle
        cx={center}
        cy={center}
        r={contourRadius}
        fill="none"
        stroke="var(--color-clock-ring)"
        strokeWidth={contourStroke}
        strokeDasharray="3.5 5.5"
        opacity="0.85"
      />

      {taskSlots.map((slot) => {
        const startAngle = slot.index * 30
        const endAngle = (slot.index + 1) * 30
        const hovered = hoveredHour === slot.actualHour
        const arc = describeArc(center, center, contourRadius, startAngle + 2.2, endAngle - 2.2)
        return (
          <path
            key={`slot-${slot.actualHour}`}
            d={arc}
            fill="none"
            stroke={slot.color}
            strokeWidth={hovered ? contourStroke + 2 : contourStroke}
            strokeLinecap="round"
            className={slot.executing ? 'animate-pulse' : undefined}
            onMouseEnter={() => onHoverHour?.(slot.actualHour)}
            onMouseLeave={() => onHoverHour?.(null)}
            style={{ cursor: onHoverHour ? 'pointer' : 'default' }}
          />
        )
      })}

      {numerals.map((num, index) => {
        const point = polarToCartesian(center, center, numeralRadius, index * 30)
        const quarter = num === 12 || num === 3 || num === 6 || num === 9
        return (
          <text
            key={`num-${num}`}
            x={point.x}
            y={point.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill={quarter ? 'var(--color-ink)' : 'var(--color-ink-3)'}
            style={{
              fontSize: quarter ? 13 : 11,
              fontWeight: quarter ? 650 : 560,
              fontFamily: 'var(--font-sans)',
            }}
          >
            {num}
          </text>
        )
      })}

      {showHands ? (
        <g>
          <line
            x1={center}
            y1={center}
            x2={minuteHand.x}
            y2={minuteHand.y}
            stroke="var(--color-ink-2)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1={center}
            y1={center}
            x2={hourHand.x}
            y2={hourHand.y}
            stroke="var(--color-clock-hand)"
            strokeWidth="3.4"
            strokeLinecap="round"
          />
          <circle cx={center} cy={center} r={4.6} fill="var(--color-clock-hand)" />
          <circle cx={center} cy={center} r={1.8} fill={pin} />
        </g>
      ) : (
        <g>
          <circle cx={center} cy={center} r={3.4} fill="var(--color-clock-inactive)" />
          <circle cx={center} cy={center} r={1.4} fill="var(--color-clock-face)" />
        </g>
      )}
      </svg>
      {civilTime ? (
        <span className="pointer-events-none absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-clock-face)]/90 px-2 py-0.5 text-[11px] font-semibold tabular-nums tracking-tight text-ink">
          {civilTime}
        </span>
      ) : null}
    </div>
  )
}

export function MiniDayClock({
  tasks,
  className = '',
}: {
  tasks: Task[]
  className?: string
}) {
  const state = useAleph()
  const doneCount = tasks.filter((task) => isTaskDone(task.status)).length
  const totalCount = tasks.length
  const allDone = totalCount > 0 && doneCount === totalCount
  const size = 36
  const center = size / 2
  const radius = 13
  const strokeW = 3.5

  if (totalCount === 0) {
    return (
      <div className={`relative flex items-center justify-center select-none ${className}`}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--color-line)"
            strokeWidth="1.5"
            strokeDasharray="2 2"
            opacity="0.8"
          />
        </svg>
      </div>
    )
  }

  const gap = totalCount > 1 ? 4 : 0
  const step = 360 / totalCount

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center}
          cy={center}
          r={radius + 3}
          fill="none"
          stroke="var(--color-subtle)"
          strokeWidth="1"
        />
        {tasks.map((task, index) => {
          const ctx = blockContext(state, task)
          const done = isTaskDone(task.status)
          const color = ctx.projectColor || ctx.color || 'var(--color-violet)'
          return (
            <path
              key={task.id}
              d={describeArc(center, center, radius, index * step + gap / 2, (index + 1) * step - gap / 2)}
              fill="none"
              stroke={done ? color : 'var(--color-clock-inactive)'}
              strokeWidth={strokeW}
              strokeLinecap="round"
            />
          )
        })}
        <circle
          cx={center}
          cy={center}
          r={allDone ? 3 : 1.5}
          fill={allDone ? 'var(--color-mint)' : 'var(--color-ink-4)'}
        />
      </svg>
    </div>
  )
}

export function MicroDayClock({ tasks }: { tasks: Task[] }) {
  const state = useAleph()
  const doneCount = tasks.filter((task) => isTaskDone(task.status)).length
  const totalCount = tasks.length
  const allDone = totalCount > 0 && doneCount === totalCount
  const size = 20
  const center = size / 2
  const radius = 7
  const strokeW = 2

  if (totalCount === 0) {
    return (
      <div className="size-5 flex items-center justify-center">
        <span className="size-1 rounded-full bg-line-strong" />
      </div>
    )
  }

  const step = 360 / totalCount
  const gap = totalCount > 1 ? 3 : 0

  return (
    <div className="relative flex items-center justify-center select-none">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--color-subtle)"
          strokeWidth={strokeW}
        />
        {tasks.map((task, index) => {
          const ctx = blockContext(state, task)
          const done = isTaskDone(task.status)
          const color = ctx.projectColor || ctx.color || 'var(--color-violet)'
          return (
            <path
              key={task.id}
              d={describeArc(center, center, radius, index * step + gap / 2, (index + 1) * step - gap / 2)}
              fill="none"
              stroke={done ? color : 'var(--color-clock-tick)'}
              strokeWidth={strokeW}
              strokeLinecap="round"
            />
          )
        })}
        {allDone ? <circle cx={center} cy={center} r={1.5} fill="var(--color-mint)" /> : null}
      </svg>
    </div>
  )
}
