import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cx } from '@/components/ui/primitives'
import { createTask, markOnboarded } from '@/data/actions'
import { useAleph } from '@/data/store'
import { toDayKey } from '@/domain/dates'
import { TERRENOS, TERRENO_MAP } from '@/domain/terrenos'
import type { Terreno } from '@/domain/types'

export function OnboardingBlockPage() {
  const navigate = useNavigate()
  const state = useAleph()
  const [title, setTitle] = useState('')
  const [hours, setHours] = useState(1)
  const [terreno, setTerreno] = useState<Terreno>('literatura')

  const canContinue = title.trim().length > 0 && hours > 0

  const bump = (delta: number) => {
    setHours((current) => Math.max(1, Math.min(12, current + delta)))
  }

  const confirm = () => {
    if (!canContinue) return
    const today = toDayKey(new Date())
    const activeResult = state.results.find((r) => r.status === 'active') || state.results[0]
    createTask({
      title: title.trim(),
      estimatedHours: hours,
      dueAt: today,
      scheduledFor: today,
      resultId: activeResult?.id,
      terreno,
      stage: 'execution',
    })
    markOnboarded()
    navigate('/', { replace: true })
  }

  return (
    <div className="flex flex-1 flex-col justify-between">
      <div>
        {/* Top bar with Back and 3 / 3 indicator */}
        <header className="flex min-h-[44px] items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/onboarding/result')}
            className="flex min-h-[44px] items-center pr-4 text-[15px] font-medium text-ink-3 transition-colors hover:text-ink"
          >
            Atrás
          </button>
          <span className="text-[13px] font-medium text-ink-3">3 / 3</span>
        </header>

        {/* Title & subtitle */}
        <div className="mt-4 space-y-2">
          <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tight text-ink">
            Qué vas a hacer hoy
          </h1>
          <p className="text-[15px] leading-relaxed text-ink-3">
            Un paso de esa obra, para hoy.
          </p>
        </div>

        <div className="mt-7 space-y-4">
          {/* Input tarea */}
          <label className="block space-y-1.5">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Un paso de esa obra, para hoy…"
              autoFocus
              className="h-12 w-full rounded-[16px] border border-line bg-white px-4 text-[15px] text-ink placeholder:text-ink-4 outline-none transition-all focus:border-[#7a3fe0] focus:ring-2 focus:ring-[#7a3fe0]/15"
            />
          </label>

          {/* Selector de terreno (default Literatura) */}
          <div className="space-y-1.5">
            <span className="text-[13px] font-medium text-ink-3">Terreno</span>
            <div className="grid grid-cols-3 gap-2">
              {TERRENOS.map((tId) => {
                const info = TERRENO_MAP[tId]
                const isSelected = terreno === tId
                return (
                  <button
                    key={tId}
                    type="button"
                    onClick={() => setTerreno(tId)}
                    className={cx(
                      'flex min-h-[44px] items-center justify-center gap-1.5 rounded-[16px] border px-2 py-2 text-[14px] font-medium transition-all active:scale-[0.98]',
                      isSelected
                        ? 'border-[#7a3fe0] bg-[#f5f0ff] font-semibold text-[#7a3fe0]'
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
          </div>

          {/* Stepper de horas (− 1h +) */}
          <div className="flex min-h-[56px] items-center justify-between rounded-[16px] border border-line bg-white px-4 py-2">
            <span className="text-[14px] font-medium text-ink-2">Dedicación</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => bump(-1)}
                disabled={hours <= 1}
                aria-label="Menos una hora"
                className="flex size-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-[16px] border border-line bg-[#f9fafb] text-[18px] font-medium text-ink transition-all hover:border-line-strong active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
              >
                −
              </button>
              <span className="min-w-[44px] text-center text-[15px] font-semibold text-ink">
                {hours} h
              </span>
              <button
                type="button"
                onClick={() => bump(1)}
                disabled={hours >= 12}
                aria-label="Más una hora"
                className="flex size-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-[16px] border border-line bg-[#f9fafb] text-[18px] font-medium text-ink transition-all hover:border-line-strong active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CTA inferior fijo 44px */}
      <div className="sticky bottom-0 left-0 right-0 mt-8 bg-white/95 pb-2 pt-4 backdrop-blur-xs">
        <button
          type="button"
          disabled={!canContinue}
          onClick={confirm}
          className="flex h-[44px] min-h-[44px] w-full items-center justify-center rounded-[16px] bg-[#7a3fe0] text-[15px] font-medium text-white transition-all hover:bg-[#6c35cc] active:bg-[#5f2cb8] disabled:cursor-not-allowed disabled:opacity-35"
        >
          Entrar a hoy
        </button>
      </div>
    </div>
  )
}
