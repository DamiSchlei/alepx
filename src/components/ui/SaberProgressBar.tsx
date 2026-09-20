import { useMemo } from 'react'
import { saberBreakdownOfTasks } from '@/data/selectors'
import { isTaskDone } from '@/domain/economy'
import type { Task } from '@/domain/types'

export function SaberProgressBar({
  tasks,
  projectColor = '#7a3fe0',
  showBadges = true,
  className = '',
  size = 'md',
}: {
  tasks: Task[]
  projectColor?: string
  showBadges?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const live = useMemo(() => tasks.filter((t) => t.status !== 'cancelled'), [tasks])
  const done = useMemo(() => live.filter((t) => isTaskDone(t.status)), [live])
  const breakdown = useMemo(() => saberBreakdownOfTasks(live), [live])

  const totalCount = live.length
  const doneCount = done.length
  const ratio = totalCount === 0 ? 0 : doneCount / totalCount
  const percent = Math.round(ratio * 100)

  const barHeight = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-2.5' : 'h-2'

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {/* Segmented multi-saber progress bar */}
      <div
        className={`w-full overflow-hidden rounded-full bg-line/60 relative ${barHeight}`}
        style={{
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)',
        }}
      >
        <div
          className="h-full flex overflow-hidden rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        >
          {breakdown.length === 0 && doneCount > 0 ? (
            <div
              className="h-full w-full transition-all"
              style={{ backgroundColor: projectColor }}
            />
          ) : (
            breakdown.map((saber) => (
              <div
                key={saber.id}
                title={`${saber.label}: ${saber.tasksCount} tareas (${saber.percentOfTotal}%)`}
                style={{
                  width: `${saber.percentOfTotal}%`,
                  backgroundColor: saber.color,
                }}
                className="h-full relative group transition-all"
              />
            ))
          )}
        </div>
      </div>

      {/* Saberes conquered breakdown badges */}
      {showBadges && doneCount > 0 && breakdown.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {breakdown.map((saber) => (
            <span
              key={saber.id}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold transition-all"
              style={{
                backgroundColor: `${saber.color}15`,
                color: saber.color,
                border: `1px solid ${saber.color}30`,
              }}
            >
              <span
                className="size-1.5 rounded-full shrink-0"
                style={{ backgroundColor: saber.color }}
              />
              <span>
                {saber.tasksCount} {saber.label}
              </span>
            </span>
          ))}
          <span className="text-[10px] text-ink-3 ml-auto font-medium">
            {doneCount}/{totalCount} ({percent}%)
          </span>
        </div>
      )}
    </div>
  )
}
