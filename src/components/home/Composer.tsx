import { useCallback, useRef, useState } from 'react'
import { Clock, Target } from 'lucide-react'
import { cx } from '@/components/ui/primitives'
import { captureLooseTask } from '@/data/actions'
import { useAleph } from '@/data/store'
import { computeEndTime } from '@/domain/clockHours'
import { TERRENOS, TERRENO_MAP } from '@/domain/terrenos'
import type { Terreno } from '@/domain/types'

/**
 * Composer: input "Anotá un bloque…", horas, terreno, horario, objetivo, Anotar (cae en el día activo).
 */
export function Composer({ dayKey }: { dayKey: string }) {
  const state = useAleph()
  const [draft, setDraft] = useState('')
  const [hours, setHours] = useState(1)
  const [terreno, setTerreno] = useState<Terreno>('literatura')
  const [scheduledStart, setScheduledStart] = useState('')
  const [objectiveId, setObjectiveId] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const submit = useCallback(() => {
    const raw = draft.trim()
    if (!raw) return
    const targetObj = objectiveId ? state.objectives.find((o) => o.id === objectiveId) : undefined
    const computedEnd = scheduledStart ? computeEndTime(scheduledStart, hours) : undefined

    captureLooseTask(raw, {
      scheduledFor: dayKey,
      dueAt: dayKey,
      estimatedHours: hours,
      terreno,
      scheduledStart: scheduledStart.trim() || undefined,
      scheduledEnd: computedEnd,
      objectiveId: objectiveId || undefined,
      resultId: targetObj?.resultId,
    })
    setDraft('')
    setHours(1)
    setScheduledStart('')
    setObjectiveId('')
    setShowDetails(false)
    inputRef.current?.focus()
  }, [dayKey, draft, hours, objectiveId, scheduledStart, state.objectives, terreno])

  return (
    <form
      className="flex flex-col gap-3 rounded-[20px] border border-line bg-white p-3.5 shadow-xs"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <input
        id="home-composer-input"
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Anotá un bloque…"
        className="h-11 w-full rounded-[12px] border border-line bg-subtle px-3.5 text-[15px] text-ink placeholder:text-ink-4 outline-none transition-all focus:border-[#7a3fe0] focus:bg-white focus:ring-2 focus:ring-[#7a3fe0]/15"
      />

      <div className="flex flex-col gap-2.5 pt-0.5">
        {/* Selector del tono del paso: Decidir | Atravesar | Concretar */}
        <div className="flex flex-wrap items-center gap-2">
          {TERRENOS.map((tId) => {
            const info = TERRENO_MAP[tId]
            const isSelected = terreno === tId
            const verb =
              tId === 'literatura'
                ? 'Decidir'
                : tId === 'arte'
                  ? 'Atravesar'
                  : 'Concretar'
            return (
              <button
                key={tId}
                type="button"
                onClick={() => setTerreno(tId)}
                title={info.filterQuestion}
                className={cx(
                  'flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-all active:scale-95',
                  isSelected
                    ? 'border-current font-semibold shadow-xs'
                    : 'border-line bg-white text-ink-2 hover:border-line-strong',
                )}
                style={{
                  borderColor: isSelected ? info.color : undefined,
                  color: isSelected ? info.color : undefined,
                  backgroundColor: isSelected ? `${info.color}12` : undefined,
                }}
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: info.color }}
                  aria-hidden="true"
                />
                <span>{verb}</span>
              </button>
            )
          })}
        </div>

        {/* Fila 2: Horario + Stepper de horas + Botón Anotar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Botón para expandir Horario / Objetivo */}
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className={cx(
              'flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-all active:scale-95',
              showDetails || scheduledStart || objectiveId
                ? 'border-violet bg-violet-soft text-violet font-semibold shadow-2xs'
                : 'border-line bg-white text-ink-2 hover:border-line-strong hover:text-ink',
            )}
            title="Configurar horario y asignar a objetivo"
          >
            <Clock className="size-3.5" />
            <span>{scheduledStart ? scheduledStart : 'Horario'}</span>
            {objectiveId ? <span className="size-1.5 rounded-full bg-violet" /> : null}
          </button>

          {/* Stepper de horas */}
          <div className="flex h-9 items-center rounded-full border border-line bg-subtle px-1">
            <button
              type="button"
              aria-label="Menos una hora"
              className="flex size-7 items-center justify-center rounded-full text-[15px] text-ink-2 hover:bg-white active:scale-95"
              onClick={() => setHours((value) => Math.max(1, Math.round((value - 1) * 10) / 10))}
            >
              −
            </button>
            <span className="min-w-8 text-center text-[13px] font-semibold tabular-nums text-ink">
              {hours} h
            </span>
            <button
              type="button"
              aria-label="Más una hora"
              className="flex size-7 items-center justify-center rounded-full text-[15px] text-ink-2 hover:bg-white active:scale-95"
              onClick={() => setHours((value) => Math.min(12, Math.round((value + 1) * 10) / 10))}
            >
              +
            </button>
          </div>

          {/* Botón Anotar */}
          <button
            type="submit"
            disabled={!draft.trim()}
            className={cx(
              'flex h-9 min-h-[36px] items-center justify-center rounded-full px-4 text-[13px] font-semibold transition-all active:scale-95',
              draft.trim()
                ? 'bg-[#7a3fe0] text-white hover:bg-[#6c35cc] shadow-xs'
                : 'bg-subtle text-ink-4 cursor-not-allowed',
            )}
          >
            Anotar
          </button>
        </div>
      </div>

      {/* Panel desplegable: Horario y Objetivo */}
      {showDetails && (
        <div className="mt-1 flex flex-col gap-2.5 rounded-[12px] border border-line/80 bg-subtle/60 p-2.5 text-[12px]">
          {/* Horario en el reloj */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 font-semibold text-ink-2 text-[11px]">
                <Clock className="size-3 text-violet" />
                <span>Horario:</span>
              </span>
              <input
                type="time"
                value={scheduledStart}
                onChange={(e) => setScheduledStart(e.target.value)}
                className="h-7 rounded-lg border border-line bg-white px-2 text-[11px] font-semibold text-ink shadow-2xs focus:border-violet focus:outline-hidden"
              />
              <div className="flex items-center gap-1">
                {['09:00', '12:00', '15:00', '18:30'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setScheduledStart(preset)}
                    className={cx(
                      'rounded-md px-2 py-0.5 text-[10px] font-semibold transition',
                      scheduledStart === preset
                        ? 'bg-violet text-white shadow-2xs'
                        : 'bg-white border border-line text-ink-2 hover:bg-violet-soft hover:text-violet',
                    )}
                  >
                    {preset}
                  </button>
                ))}
                {scheduledStart && (
                  <button
                    type="button"
                    onClick={() => setScheduledStart('')}
                    className="text-[10px] text-ink-3 hover:text-rose-600 hover:underline px-1"
                  >
                    Sin hora
                  </button>
                )}
              </div>
            </div>
            {scheduledStart && (
              <span className="text-[11px] font-bold text-violet">
                🕒 {scheduledStart} - {computeEndTime(scheduledStart, hours)}
              </span>
            )}
          </div>

          {/* Asignar a un objetivo */}
          <div className="flex items-center gap-2 pt-1 border-t border-line/60">
            <span className="flex items-center gap-1 font-semibold text-ink-2 text-[11px] shrink-0">
              <Target className="size-3 text-violet" />
              <span>Objetivo:</span>
            </span>
            <select
              value={objectiveId}
              onChange={(e) => setObjectiveId(e.target.value)}
              className="w-full truncate rounded-lg border border-line bg-white px-2 py-1 text-[11px] font-semibold text-ink shadow-2xs hover:border-violet focus:outline-hidden focus:ring-1 focus:ring-violet"
            >
              <option value="">Sin objetivo asignado (paso suelto)</option>
              {state.results.map((res) => {
                const resObjs = state.objectives.filter(
                  (o) => o.resultId === res.id && o.status !== 'done',
                )
                if (resObjs.length === 0) return null
                return (
                  <optgroup
                    key={res.id}
                    label={`${res.projectName ? `${res.projectName} · ` : ''}${res.name}`}
                  >
                    {resObjs.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </optgroup>
                )
              })}
            </select>
          </div>
        </div>
      )}
    </form>
  )
}
