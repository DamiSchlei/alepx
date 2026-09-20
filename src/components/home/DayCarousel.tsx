import { useTranslation } from 'react-i18next'
import { DayTaskClock } from './DayTaskClock'
import { tasksForDay } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { parseLocal } from '@/domain/dates'

interface DayCarouselProps {
  activeDay: string
  todayKey: string
  localeTag: string
  onOpenCanvas: (dayKey: string) => void
}

/** Single day card for Home. Not a carousel — no peek, no snap. */
export function DayCarousel({
  activeDay,
  todayKey,
  localeTag,
  onOpenCanvas,
}: DayCarouselProps) {
  const { t } = useTranslation()
  const state = useAleph()
  const dayTasks = tasksForDay(state, activeDay)
  const isToday = activeDay === todayKey
  const dateObj = parseLocal(activeDay)
  const weekday = new Intl.DateTimeFormat(localeTag, { weekday: 'short' }).format(dateObj)
  const dayNum = dateObj.getDate()

  return (
    <div className="flex flex-col px-0 pt-3">
      <article className="w-full min-w-0 overflow-hidden rounded-[28px] border border-violet bg-surface p-4 shadow-[var(--shadow-day)] ring-4 ring-violet/10 sm:p-5">
        <header className="mb-3 flex items-baseline gap-2">
          <h3 className="text-[20px] font-semibold capitalize tracking-tight text-ink">
            {weekday} {dayNum}
          </h3>
          {isToday ? (
            <span className="rounded-full bg-violet-soft px-2 py-0.5 text-[11px] font-semibold text-violet">
              {t('common.today')}
            </span>
          ) : null}
        </header>

        <DayTaskClock
          tasks={dayTasks}
          activeDay={activeDay}
          todayKey={todayKey}
          localeTag={localeTag}
          onOpenCanvas={() => onOpenCanvas(activeDay)}
        />
      </article>
    </div>
  )
}
