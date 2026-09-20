import { useRef, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Maximize2, Plus } from 'lucide-react'
import { DayCellPreview } from './DayCellPreview'
import { freeHoursForDay, plannedHoursForDay } from '@/data/dayLoad'
import { tasksForDay } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { addDays, parseLocal, toDayKey } from '@/domain/dates'
import { isTaskDone } from '@/domain/economy'
import { TERRENO_MAP } from '@/domain/terrenos'
import { formatHours } from '@/i18n/format'

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
  const locale = state.character.locale
  const cap = state.character.dailyHourCap ?? 5

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
          const planned = plannedHoursForDay(state, day)
          const free = freeHoursForDay(cap, planned)
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
                  <span className="text-[12px] font-medium text-ink-3">
                    {formatHours(planned, locale)}h / {cap}h
                  </span>
                </div>

                {/* Subtitle / capacity */}
                <p className="mt-0.5 text-[12px] text-ink-3 font-medium">
                  {free > 0
                    ? `${formatHours(free, locale)} h libres para la obra`
                    : 'Capacidad completa'}
                </p>
              </div>

              {/* Center Organ: Visual Day Cell Preview */}
              <div className="my-3 flex flex-col items-center justify-center py-2">
                <DayCellPreview tasks={dayTasks} compact={false} />
                <p className="mt-1 text-[11px] font-semibold text-ink-3 tracking-wider uppercase">
                  {dayTasks.length === 0
                    ? 'Sin tareas asignadas'
                    : `${dayTasks.length} ${dayTasks.length === 1 ? 'tarea' : 'tareas'}`}
                </p>
              </div>

              {/* Tasks preview list (up to 3) */}
              <div className="min-h-[72px] flex flex-col justify-center">
                {dayTasks.length === 0 ? (
                  <div className="rounded-[12px] border border-dashed border-line p-2.5 text-center text-[12px] text-ink-3">
                    Sin tareas. Tocá para planificar el día.
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {dayTasks.slice(0, 3).map((t) => {
                      const tInfo = TERRENO_MAP[t.terreno ?? 'literatura']
                      const done = isTaskDone(t.status)
                      return (
                        <div
                          key={t.id}
                          className="flex items-center gap-1.5 truncate text-[12px]"
                        >
                          <span
                            className="size-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: tInfo.color }}
                          />
                          <span
                            className={`truncate font-medium ${
                              done ? 'line-through text-ink-3' : 'text-ink-2'
                            }`}
                          >
                            {t.title}
                          </span>
                        </div>
                      )
                    })}
                    {dayTasks.length > 3 && (
                      <p className="text-[11px] font-medium text-ink-3 pl-3">
                        +{dayTasks.length - 3} más...
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Card Actions: Planificar día & Rápido */}
              <div className="mt-3.5 pt-3 border-t border-line flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenCanvas(day)
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-full bg-[#111113] py-2.5 px-3 text-[13px] font-semibold text-white hover:bg-black active:scale-98 transition-all shadow-xs"
                >
                  <Maximize2 className="size-3.5" />
                  <span>Planificar día</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onQuickAdd(day)
                  }}
                  className="flex size-9 items-center justify-center rounded-full border border-line bg-subtle text-ink hover:border-[#7a3fe0] hover:text-[#7a3fe0] active:scale-95 transition-all shrink-0"
                  title="Añadir tarea"
                >
                  <Plus className="size-4" />
                </button>
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
