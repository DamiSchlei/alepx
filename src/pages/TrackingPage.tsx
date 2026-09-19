import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WeekChart } from '@/components/tracking/WeekChart'
import { Button } from '@/components/ui/primitives'
import { tasksForDay, trackingStats } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { addDays, formatWeekHeading, startOfWeek, toDayKey, weekDayKeys } from '@/domain/dates'
import { isTaskDone } from '@/domain/economy'
import { terrenoLabel } from '@/domain/terrenos'
import { formatHours } from '@/i18n/format'
import type { Terreno } from '@/domain/types'

export function TrackingPage() {
  const navigate = useNavigate()
  const state = useAleph()
  const locale = state.character.locale
  const todayKey = toDayKey(new Date())
  const [weekAnchor, setWeekAnchor] = useState(todayKey)

  const stats = trackingStats(state, weekAnchor)
  const showHoy = toDayKey(startOfWeek(weekAnchor)) !== toDayKey(startOfWeek(todayKey))

  // Find all completed tasks this week and determine which terrains were moved
  const weekDays = useMemo(() => weekDayKeys(weekAnchor), [weekAnchor])
  const movedTerrenos = useMemo(() => {
    const set = new Set<Terreno>()
    for (const dk of weekDays) {
      for (const t of tasksForDay(state, dk)) {
        if (isTaskDone(t.status) && t.terreno) {
          set.add(t.terreno)
        }
      }
    }
    return Array.from(set)
  }, [state, weekDays])

  // Frase de la semana: qué terrenos se movieron
  const weekSentence = useMemo(() => {
    if (movedTerrenos.length === 0) {
      return 'No moviste terrenos esta semana todavía.'
    }
    const names = movedTerrenos.map((t) => terrenoLabel(t))
    if (names.length === 1) {
      return `Esta semana moviste ${names[0]}.`
    }
    if (names.length === 2) {
      return `Esta semana moviste ${names[0]} y ${names[1]}.`
    }
    return `Esta semana moviste ${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}.`
  }, [movedTerrenos])

  const shiftWeek = (direction: -1 | 1) => {
    setWeekAnchor(toDayKey(addDays(weekAnchor, direction * 7)))
  }

  // Tres números: hechos, a tiempo, horas
  const kpis = [
    { label: 'Hechos', value: String(stats.weekCompleted) },
    {
      label: 'A tiempo',
      value: stats.weekCompleted === 0 ? '—' : String(stats.weekOnTime),
    },
    {
      label: 'Horas',
      value: `${formatHours(stats.weekHours, locale)} h`,
    },
  ]

  return (
    <div className="flex flex-col gap-6 pt-2 pb-24">
      {/* Navegación semanal */}
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Semana anterior"
            onClick={() => shiftWeek(-1)}
            className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-[18px] text-ink-2 hover:bg-subtle active:scale-95 transition-all"
          >
            ‹
          </button>
          <h1 className="min-w-0 flex-1 text-center text-[16px] font-semibold text-ink">
            {formatWeekHeading(weekAnchor, locale)}
          </h1>
          <button
            type="button"
            aria-label="Semana siguiente"
            onClick={() => shiftWeek(1)}
            className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-[18px] text-ink-2 hover:bg-subtle active:scale-95 transition-all"
          >
            ›
          </button>
        </div>

        {showHoy ? (
          <button
            type="button"
            onClick={() => setWeekAnchor(todayKey)}
            className="self-center rounded-full bg-[#f5f0ff] px-3 py-1 text-[13px] font-medium text-[#7a3fe0] hover:bg-[#ebe2fe] transition-colors"
          >
            Hoy
          </button>
        ) : null}

        {/* Frase de la semana: qué terrenos se movieron */}
        <div className="rounded-[16px] border border-line bg-white p-4 shadow-xs">
          <p className="text-[12px] font-semibold tracking-wider text-ink-3 uppercase">
            Registro de obra
          </p>
          <p className="mt-1 font-display text-[21px] font-semibold leading-snug text-ink">
            {weekSentence}
          </p>
        </div>
      </header>

      {/* Tres números: hechos, a tiempo, horas */}
      <div className="grid grid-cols-3 gap-2">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="flex flex-col items-center justify-center rounded-[16px] border border-line bg-white py-3.5 px-2"
          >
            <p className="text-[11px] font-semibold tracking-wider text-ink-3 uppercase">
              {kpi.label}
            </p>
            <p className="mt-1 text-[22px] font-bold tabular-nums text-ink">
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Gráfico de la semana */}
      <div className="rounded-[16px] border border-line bg-white p-4">
        <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-ink-3">
          Ritmo de marcas
        </h3>
        <WeekChart stats={stats} />
      </div>

      {stats.completed === 0 ? (
        <Button variant="secondary" onClick={() => navigate('/')}>
          Ir a marcar el día
        </Button>
      ) : null}
    </div>
  )
}
