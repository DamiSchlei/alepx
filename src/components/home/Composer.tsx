import { useCallback, useRef, useState } from 'react'
import { cx } from '@/components/ui/primitives'
import { captureLooseTask } from '@/data/actions'
import { TERRENOS, TERRENO_MAP } from '@/domain/terrenos'
import type { Terreno } from '@/domain/types'

/**
 * Composer: input "Anotá un bloque…", horas, terreno, Anotar (cae en el día activo).
 */
export function Composer({ dayKey }: { dayKey: string }) {
  const [draft, setDraft] = useState('')
  const [hours, setHours] = useState(1)
  const [terreno, setTerreno] = useState<Terreno>('literatura')
  const inputRef = useRef<HTMLInputElement>(null)

  const submit = useCallback(() => {
    const raw = draft.trim()
    if (!raw) return
    captureLooseTask(raw, {
      scheduledFor: dayKey,
      dueAt: dayKey,
      estimatedHours: hours,
      terreno,
    })
    setDraft('')
    setHours(1)
    inputRef.current?.focus()
  }, [dayKey, draft, hours, terreno])

  return (
    <form
      className="flex flex-col gap-3 rounded-[16px] border border-line bg-white p-3.5 shadow-xs"
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

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        {/* Selector de terreno: [Literatura | Arte | Empresa] */}
        <div className="flex items-center gap-1.5">
          {TERRENOS.map((tId) => {
            const info = TERRENO_MAP[tId]
            const isSelected = terreno === tId
            return (
              <button
                key={tId}
                type="button"
                onClick={() => setTerreno(tId)}
                className={cx(
                  'flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-all active:scale-95',
                  isSelected
                    ? 'border-[#7a3fe0] bg-[#f5f0ff] text-[#7a3fe0] font-semibold'
                    : 'border-line bg-white text-ink-2 hover:border-line-strong',
                )}
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: info.color }}
                  aria-hidden="true"
                />
                <span>{info.label}</span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
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
                ? 'bg-[#7a3fe0] text-white hover:bg-[#6c35cc]'
                : 'bg-subtle text-ink-4 cursor-not-allowed',
            )}
          >
            Anotar
          </button>
        </div>
      </div>
    </form>
  )
}
