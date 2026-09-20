import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { WeekChart } from '@/components/tracking/WeekChart'
import { Button } from '@/components/ui/primitives'
import { tasksForDay, trackingStats } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { addDays, formatWeekHeading, startOfWeek, toDayKey, weekDayKeys } from '@/domain/dates'
import { isTaskDone } from '@/domain/economy'
import { formatHours } from '@/i18n/format'
import type { Terreno } from '@/domain/types'

export function TrackingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const state = useAleph()
  const locale = state.character.locale
  const todayKey = toDayKey(new Date())
  const [weekAnchor, setWeekAnchor] = useState(todayKey)

  const stats = trackingStats(state, weekAnchor)
  const showHoy = toDayKey(startOfWeek(weekAnchor)) !== toDayKey(startOfWeek(todayKey))
  const weekDays = useMemo(() => weekDayKeys(weekAnchor), [weekAnchor])

  const movedTerrenos = useMemo(() => {
    const set = new Set<Terreno>()
    for (const dayKey of weekDays) {
      for (const task of tasksForDay(state, dayKey)) {
        if (isTaskDone(task.status) && task.terreno) set.add(task.terreno)
      }
    }
    return Array.from(set)
  }, [state, weekDays])

  const weekSentence = useMemo(() => {
    if (movedTerrenos.length === 0) return t('tracking.weekSentenceNone')
    const names = movedTerrenos.map((terreno) => t(`terrenos.${terreno}`))
    if (names.length === 1) return t('tracking.weekMovedOne', { name: names[0] })
    if (names.length === 2) return t('tracking.weekMovedTwo', { a: names[0], b: names[1] })
    return t('tracking.weekMovedMany', {
      list: names.slice(0, -1).join(', '),
      last: names[names.length - 1],
    })
  }, [movedTerrenos, t])

  const kpis = [
    { label: t('tracking.kpiDone'), value: String(stats.weekCompleted) },
    {
      label: t('tracking.kpiOnTime'),
      value: stats.weekCompleted === 0 ? t('common.dash') : String(stats.weekOnTime),
    },
    {
      label: t('tracking.kpiHours'),
      value: `${formatHours(stats.weekHours, locale)} h`,
    },
  ]

  return (
    <div className="flex flex-col gap-6 pt-2 pb-24">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={t('tracking.prevWeek')}
            onClick={() => setWeekAnchor(toDayKey(addDays(weekAnchor, -7)))}
            className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-[22px] text-ink-2 hover:bg-subtle"
          >
            ‹
          </button>
          <h1 className="min-w-0 flex-1 text-center text-[16px] font-semibold text-ink">
            {formatWeekHeading(weekAnchor, locale)}
          </h1>
          <button
            type="button"
            aria-label={t('tracking.nextWeek')}
            onClick={() => setWeekAnchor(toDayKey(addDays(weekAnchor, 7)))}
            className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-[22px] text-ink-2 hover:bg-subtle"
          >
            ›
          </button>
        </div>

        {showHoy ? (
          <button
            type="button"
            onClick={() => setWeekAnchor(todayKey)}
            className="self-center rounded-full bg-violet-soft px-3 py-1 text-[13px] font-semibold text-violet"
          >
            {t('common.today')}
          </button>
        ) : null}

        <div className="rounded-[20px] border border-line bg-surface p-4 shadow-paper">
          <p className="text-[12px] font-semibold tracking-[0.14em] text-ink-3 uppercase">
            {t('tracking.craftLog')}
          </p>
          <p className="mt-1 font-display text-[22px] font-semibold leading-snug text-ink">{weekSentence}</p>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-2">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="flex flex-col items-center justify-center rounded-[20px] border border-line bg-surface px-2 py-3.5 shadow-paper"
          >
            <p className="text-[11px] font-semibold tracking-[0.12em] text-ink-3 uppercase">{kpi.label}</p>
            <p className="mt-1 text-[22px] font-semibold tabular-nums text-ink">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[20px] border border-line bg-surface p-4 shadow-paper">
        <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-3">
          {t('tracking.rhythmTitle')}
        </h3>
        <WeekChart stats={stats} />
      </div>

      {stats.completed === 0 ? (
        <Button variant="secondary" onClick={() => navigate('/')}>
          {t('tracking.markDayCta')}
        </Button>
      ) : null}
    </div>
  )
}
