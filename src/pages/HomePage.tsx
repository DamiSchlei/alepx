import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DayIndexList } from '@/components/home/DayIndexList'
import { DayTaskViewer } from '@/components/home/DayTaskViewer'
import { HomeStickyChrome, type HomeGranularity } from '@/components/home/HomeStickyChrome'
import { PeriodGrid } from '@/components/home/PeriodGrid'
import { weekStartKeyOf } from '@/data/dayLoad'
import { useAleph } from '@/data/store'
import { addDays, addMonths, startOfMonth, toDayKey } from '@/domain/dates'

function sameMonth(a: string, b: string): boolean {
  return toDayKey(startOfMonth(a)) === toDayKey(startOfMonth(b))
}

export function HomePage() {
  const { i18n } = useTranslation()
  const { character } = useAleph()
  const todayKey = toDayKey(new Date())
  const localeTag = i18n.language?.startsWith('en') ? 'en-US' : 'es-AR'
  const locale = character.locale

  const [granularity, setGranularity] = useState<HomeGranularity>('day')
  const [activeDay, setActiveDay] = useState(todayKey)

  const showHoy =
    granularity === 'day'
      ? activeDay !== todayKey
      : granularity === 'week'
        ? weekStartKeyOf(activeDay) !== weekStartKeyOf(todayKey)
        : !sameMonth(activeDay, todayKey)

  const jumpTo = useCallback((dayKey: string) => {
    setActiveDay(dayKey)
  }, [])

  const setMode = (mode: HomeGranularity) => {
    setGranularity(mode)
  }

  const shiftPeriod = (direction: -1 | 1) => {
    let next = activeDay
    if (granularity === 'day') next = toDayKey(addDays(activeDay, direction))
    else if (granularity === 'week') next = toDayKey(addDays(activeDay, direction * 7))
    else next = toDayKey(addMonths(activeDay, direction))
    jumpTo(next)
  }

  return (
    <div className="flex flex-col">
      <HomeStickyChrome
        activeDay={activeDay}
        todayKey={todayKey}
        granularity={granularity}
        locale={locale}
        localeTag={localeTag}
        showHoy={showHoy}
        onGranularity={setMode}
        onHoy={() => {
          setGranularity('day')
          jumpTo(todayKey)
        }}
        onPrev={() => shiftPeriod(-1)}
        onNext={() => shiftPeriod(1)}
        onSelectDay={(dayKey) => {
          setGranularity('day')
          jumpTo(dayKey)
        }}
      />

      {granularity === 'day' ? (
        <div className="flex flex-col">
          <DayTaskViewer
            activeDay={activeDay}
            todayKey={todayKey}
            localeTag={localeTag}
          />
          <DayIndexList
            activeDay={activeDay}
            todayKey={todayKey}
            localeTag={localeTag}
            onSelectDay={(dayKey) => {
              jumpTo(dayKey)
            }}
          />
        </div>
      ) : (
        <PeriodGrid
          mode={granularity}
          anchorDay={activeDay}
          todayKey={todayKey}
          localeTag={localeTag}
          onOpenDay={(dayKey) => {
            setGranularity('day')
            jumpTo(dayKey)
          }}
        />
      )}
    </div>
  )
}
