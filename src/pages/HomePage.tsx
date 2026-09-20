import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DayCanvas } from '@/components/home/DayCanvas'
import { DayCarousel } from '@/components/home/DayCarousel'
import { HomeStickyChrome } from '@/components/home/HomeStickyChrome'
import { useAleph } from '@/data/store'
import { shiftIsoWeek, toDayKey } from '@/domain/dates'

export function HomePage() {
  const { i18n } = useTranslation()
  const { character } = useAleph()
  const todayKey = toDayKey(new Date())
  const localeTag = i18n.language?.startsWith('en') ? 'en-US' : 'es-AR'
  const locale = character.locale

  const [activeDay, setActiveDay] = useState(todayKey)
  const [canvasOpenDay, setCanvasOpenDay] = useState<string | null>(null)

  const jumpTo = useCallback((dayKey: string) => {
    setActiveDay(dayKey)
  }, [])

  return (
    <div className="flex flex-col pb-8">
      <HomeStickyChrome
        activeDay={activeDay}
        todayKey={todayKey}
        locale={locale}
        localeTag={localeTag}
        showHoy={activeDay !== todayKey}
        onHoy={() => jumpTo(todayKey)}
        onPrev={() => jumpTo(shiftIsoWeek(activeDay, -1))}
        onNext={() => jumpTo(shiftIsoWeek(activeDay, 1))}
        onSelectDay={jumpTo}
      />

      <DayCarousel
        activeDay={activeDay}
        todayKey={todayKey}
        localeTag={localeTag}
        onOpenCanvas={(dayKey) => setCanvasOpenDay(dayKey)}
      />

      {canvasOpenDay && (
        <DayCanvas
          dayKey={canvasOpenDay}
          todayKey={todayKey}
          localeTag={localeTag}
          onClose={() => setCanvasOpenDay(null)}
        />
      )}
    </div>
  )
}
