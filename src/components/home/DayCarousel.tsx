import { useRef, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayTaskClock } from './DayTaskClock'
import { tasksForDay } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { addDays, parseLocal, toDayKey } from '@/domain/dates'

interface DayCarouselProps {
  activeDay: string
  todayKey: string
  localeTag: string
  onSelectDay: (dayKey: string) => void
  onOpenCanvas: (dayKey: string) => void
  onQuickAdd: (dayKey: string) => void
}

const BUFFER_DAYS = 21 // 21 days backward, 21 days forward

export function DayCarousel({
  activeDay,
  todayKey,
  localeTag,
  onSelectDay,
  onOpenCanvas,
  onQuickAdd,
}: DayCarouselProps) {
  const state = useAleph()

  // Generate buffer of days around todayKey
  const days = useMemo(() => {
    const list: string[] = []
    for (let i = -BUFFER_DAYS; i <= BUFFER_DAYS; i++) {
      list.push(toDayKey(addDays(todayKey, i)))
    }
    return list
  }, [todayKey])

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Scroll active day into view smoothly
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const el = container.querySelector(`[data-day="${activeDay}"]`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [activeDay])

  const shiftDay = (direction: -1 | 1) => {
    const next = toDayKey(addDays(activeDay, direction))
    onSelectDay(next)
  }

  return (
    <div className="relative flex flex-col py-1">
      {/* Track with side chevrons */}
      <div className="relative w-full">
        {/* Subtle side navigation chevrons */}
        <button
          type="button"
          onClick={() => shiftDay(-1)}
          aria-label="Día anterior"
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 flex size-8 items-center justify-center rounded-full bg-white/95 shadow-sm border border-line text-ink-2 hover:text-ink active:scale-90 transition-all sm:left-2"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => shiftDay(1)}
          aria-label="Día siguiente"
          className="absolute right-1 top-1/2 -translate-y-1/2 z-10 flex size-8 items-center justify-center rounded-full bg-white/95 shadow-sm border border-line text-ink-2 hover:text-ink active:scale-90 transition-all sm:right-2"
        >
          <ChevronRight className="size-4" />
        </button>

        {/* Infinite Horizontal Card Track */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto px-6 py-2 scrollbar-none snap-x snap-mandatory"
          style={{ scrollSnapType: 'x mandatory' }}
        >
        {days.map((day) => {
          const isSelected = day === activeDay
          const isToday = day === todayKey
          const dayTasks = tasksForDay(state, day)
          const dateObj = parseLocal(day)
          const weekday = new Intl.DateTimeFormat(localeTag, { weekday: 'short' }).format(dateObj)
          const dayNum = dateObj.getDate()

          return (
            <div
              key={day}
              data-day={day}
              onClick={() => onSelectDay(day)}
              className={`shrink-0 w-[84vw] max-w-[340px] rounded-[24px] border-2 bg-white p-5 snap-center transition-all cursor-pointer flex flex-col justify-between select-none ${
                isSelected
                  ? 'border-[#7a3fe0] shadow-lg ring-4 ring-[#7a3fe0]/10 scale-[1.01]'
                  : 'border-line hover:border-line-strong shadow-xs opacity-85 hover:opacity-100'
              }`}
            >
              {/* Card Header */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[20px] font-bold text-ink capitalize">
                      {weekday} {dayNum}
                    </span>
                    {isToday && (
                      <span className="rounded-full bg-[#f5f0ff] px-2 py-0.5 text-[11px] font-bold text-[#7a3fe0]">
                        Hoy
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Reloj y Gestor de Tareas */}
              <div className="mt-1 flex-1 flex flex-col justify-center">
                <DayTaskClock
                  tasks={dayTasks}
                  activeDay={day}
                  todayKey={todayKey}
                  localeTag={localeTag}
                  onOpenCanvas={() => onOpenCanvas(day)}
                  onQuickAdd={() => onQuickAdd(day)}
                />
              </div>
            </div>
          )
        })}
        </div>
      </div>

      {/* Helper caption */}
      <p className="text-center text-[12px] text-ink-3">
        Deslizá horizontalmente para recorrer el tiempo · Abrí un día para ver su lienzo
      </p>
    </div>
  )
}
