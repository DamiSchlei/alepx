import { useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { WeekStrip } from '@/components/home/WeekStrip'
import { addDays, isoWeekNumber, startOfWeek, toDayKey, weekRangeLabel } from '@/domain/dates'
import type { Locale } from '@/domain/types'

/**
 * Floating date chrome for Home only.
 * Announces the ISO week; the strip is the day index.
 */
export function HomeStickyChrome({
  activeDay,
  todayKey,
  locale,
  localeTag,
  showHoy,
  onHoy,
  onPrev,
  onNext,
  onSelectDay,
  onHeightChange,
}: {
  activeDay: string
  todayKey: string
  locale: Locale
  localeTag: string
  showHoy: boolean
  onHoy: () => void
  onPrev: () => void
  onNext: () => void
  onSelectDay: (dayKey: string) => void
  onHeightChange?: (height: number) => void
}) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const node = ref.current
    if (!node || !onHeightChange) return
    const publish = () => onHeightChange(node.getBoundingClientRect().height)
    publish()
    const ro = new ResizeObserver(publish)
    ro.observe(node)
    return () => ro.disconnect()
  }, [onHeightChange])

  const monday = startOfWeek(activeDay)
  const mondayKey = toDayKey(monday)
  const year = addDays(monday, 6).getFullYear()
  const line1 = t('home.weekNumber', { n: isoWeekNumber(activeDay) })
  const line2 = `${weekRangeLabel(mondayKey, locale)} ${year}`

  return (
    <div
      ref={ref}
      className="isolate sticky z-20 -mx-4 border-b border-line/80 bg-bg/90 px-4 pt-1 pb-3 backdrop-blur-md"
      style={{ top: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-label={t('home.prevPeriod')}
          onClick={onPrev}
          className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-[22px] text-ink-2 hover:bg-subtle"
        >
          ‹
        </button>
        <div className="min-w-0 flex-1 pt-1 text-center">
          <h2 className="truncate text-[20px] font-semibold tracking-tight text-ink">{line1}</h2>
          <p className="mt-0.5 truncate text-[12px] text-ink-3">{line2}</p>
        </div>
        <button
          type="button"
          aria-label={t('home.nextPeriod')}
          onClick={onNext}
          className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-[22px] text-ink-2 hover:bg-subtle"
        >
          ›
        </button>
      </div>

      {showHoy ? (
        <div className="mt-1 flex justify-start">
          <button
            type="button"
            onClick={onHoy}
            className="min-h-11 shrink-0 rounded-full px-3 text-[14px] font-semibold text-violet"
          >
            {t('home.todayJump')}
          </button>
        </div>
      ) : null}

      <div className="mt-2">
        <WeekStrip
          activeDay={activeDay}
          todayKey={todayKey}
          localeTag={localeTag}
          onSelectDay={onSelectDay}
        />
      </div>
    </div>
  )
}
