import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createResult, updateResult } from '@/data/actions'
import { useAleph } from '@/data/store'
import { TERRENO_MAP } from '@/domain/terrenos'

const DEFAULT_WORK = 'Primer producto listo para vender'

export function OnboardingResultPage() {
  const navigate = useNavigate()
  const state = useAleph()

  const existingResult = state.results[0]
  const [work, setWork] = useState(existingResult?.name ?? DEFAULT_WORK)

  const canContinue = work.trim().length > 0

  const confirm = () => {
    if (!canContinue) return
    const chosenName = work.trim()

    if (existingResult) {
      updateResult(existingResult.id, {
        name: chosenName,
        pillar: 'body',
      })
    } else {
      createResult({
        name: chosenName,
        pillar: 'body',
      })
    }
    navigate('/onboarding/block')
  }

  return (
    <div className="flex flex-1 flex-col justify-between">
      <div>
        {/* Top bar with Back and 2 / 3 indicator */}
        <header className="flex min-h-[44px] items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/onboarding')}
            className="flex min-h-[44px] items-center pr-4 text-[15px] font-medium text-ink-3 transition-colors hover:text-ink"
          >
            Atrás
          </button>
          <span className="text-[13px] font-medium text-ink-3">2 / 3</span>
        </header>

        {/* Title & subtitle */}
        <div className="mt-4 space-y-2">
          <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tight text-ink">
            Qué obra vas a sostener
          </h1>
          <p className="text-[15px] leading-relaxed text-ink-3">
            Un Resultado. Home lo va a marcar día a día.
          </p>
        </div>

        {/* Primary input with quick seed pill */}
        <div className="mt-7 space-y-3">
          <div>
            <input
              type="text"
              value={work}
              onChange={(e) => setWork(e.target.value)}
              placeholder="Nombre de tu obra…"
              autoFocus
              className="h-12 w-full rounded-[16px] border border-line bg-white px-4 text-[15px] text-ink placeholder:text-ink-4 outline-none transition-all focus:border-[#7a3fe0] focus:ring-2 focus:ring-[#7a3fe0]/15"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[13px] text-ink-3">Semilla:</span>
            <button
              type="button"
              onClick={() => setWork(DEFAULT_WORK)}
              className="rounded-full border border-line bg-subtle px-3 py-1 text-[13px] text-ink-2 transition-colors hover:border-[#7a3fe0] hover:text-[#7a3fe0]"
            >
              Primer producto listo para vender
            </button>
          </div>

          {/* Bloque ESTÁTICO explicativo (no selector excluyente) */}
          <div className="mt-6 rounded-[16px] border border-line bg-[#fbfbfd] p-4">
            <div className="text-[12px] font-semibold uppercase tracking-wider text-ink-3">
              Tres terrenos para caminarla
            </div>
            <div className="mt-3 space-y-3">
              <div className="flex items-start gap-3">
                <div
                  className="mt-1 size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: TERRENO_MAP.literatura.color }}
                  aria-hidden="true"
                />
                <div>
                  <span className="text-[14px] font-semibold text-ink">Literatura</span>
                  <span className="text-ink-4"> — </span>
                  <span className="text-[14px] text-ink-2">nombra y decide</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div
                  className="mt-1 size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: TERRENO_MAP.arte.color }}
                  aria-hidden="true"
                />
                <div>
                  <span className="text-[14px] font-semibold text-ink">Arte</span>
                  <span className="text-ink-4"> — </span>
                  <span className="text-[14px] text-ink-2">el paso que te atraviesa</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div
                  className="mt-1 size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: TERRENO_MAP.empresa.color }}
                  aria-hidden="true"
                />
                <div>
                  <span className="text-[14px] font-semibold text-ink">Empresa</span>
                  <span className="text-ink-4"> — </span>
                  <span className="text-[14px] text-ink-2">lo concreto</span>
                </div>
              </div>
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
          Seguir
        </button>
      </div>
    </div>
  )
}
