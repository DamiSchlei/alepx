import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Clock,
  Minus,
  Moon,
  Plus,
  Sparkles,
  Sun,
  Check,
} from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { Button, cx } from '@/components/ui/primitives'
import { useFeedback } from '@/app/FeedbackProvider'
import { setDailyHourCap } from '@/data/actions'
import { useAleph } from '@/data/store'

interface DailyCapacitySheetProps {
  open: boolean
  onClose: () => void
}

const PRESETS = [
  { hours: 5, key: 'presetDeep', icon: Sparkles, color: 'text-violet bg-violet-soft border-violet/30' },
  { hours: 8, key: 'presetStandard', icon: Clock, color: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
  { hours: 12, key: 'presetExtended', icon: Sun, color: 'text-amber-800 bg-amber-50 border-amber-200' },
  { hours: 18, key: 'presetWaking', icon: Moon, color: 'text-sky-800 bg-sky-50 border-sky-200' },
  { hours: 24, key: 'presetFull', icon: Clock, color: 'text-slate-800 bg-slate-100 border-slate-200' },
] as const

export function DailyCapacitySheet({ open, onClose }: DailyCapacitySheetProps) {
  const { t } = useTranslation()
  const state = useAleph()
  const feedback = useFeedback()

  const currentCap = state.character.dailyHourCap ?? 5
  const [selectedHours, setSelectedHours] = useState(currentCap)

  useEffect(() => {
    if (open) {
      setSelectedHours(state.character.dailyHourCap ?? 5)
    }
  }, [open, state.character.dailyHourCap])

  const handleStep = (delta: number) => {
    setSelectedHours((prev) => Math.min(24, Math.max(1, Math.round((prev + delta) * 2) / 2)))
  }

  const handleSave = () => {
    setDailyHourCap(selectedHours)
    feedback?.notify(t('capacity.saved', { hours: selectedHours }))
    onClose()
  }

  const sleepHours = Math.max(0, 24 - selectedHours)

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('capacity.title')}
      footer={
        <div className="flex gap-2 w-full">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" className="flex-1" onClick={handleSave}>
            {t('capacity.save')}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5 pt-1 pb-4">
        {/* Main interactive hour selector */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-surface p-5 shadow-xs">
          <span className="text-[12px] font-semibold text-ink-3 uppercase tracking-wider">
            {t('capacity.menuTitle')}
          </span>

          <div className="mt-3 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => handleStep(-1)}
              disabled={selectedHours <= 1}
              className="flex size-11 items-center justify-center rounded-2xl border border-line bg-subtle text-ink hover:bg-subtle/80 active:scale-95 disabled:opacity-30 transition-all"
              aria-label="Disminuir una hora"
            >
              <Minus className="size-5 stroke-[2.5]" />
            </button>

            <div className="flex flex-col items-center min-w-[120px]">
              <div className="font-display text-[46px] font-bold leading-none tracking-tight text-ink">
                {selectedHours}
                <span className="text-[22px] font-normal text-ink-3 ml-1">h</span>
              </div>
              <span className="text-[12px] font-medium text-ink-2 mt-1">
                {selectedHours === 18 ? '6h sueño · 18h despierto' : `${selectedHours} h / día`}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleStep(1)}
              disabled={selectedHours >= 24}
              className="flex size-11 items-center justify-center rounded-2xl border border-line bg-subtle text-ink hover:bg-subtle/80 active:scale-95 disabled:opacity-30 transition-all"
              aria-label="Aumentar una hora"
            >
              <Plus className="size-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Range Slider */}
          <div className="w-full mt-5 px-2">
            <input
              type="range"
              min={1}
              max={24}
              step={0.5}
              value={selectedHours}
              onChange={(e) => setSelectedHours(Number(e.target.value))}
              className="w-full accent-violet cursor-pointer h-2 bg-line rounded-lg"
            />
            <div className="flex justify-between text-[11px] font-semibold text-ink-4 mt-1">
              <span>1 h</span>
              <span>5 h (obra)</span>
              <span>12 h</span>
              <span>18 h (activo)</span>
              <span>24 h</span>
            </div>
          </div>

          {/* 24-hour visual day proportion bar */}
          <div className="w-full mt-4 flex flex-col gap-1.5">
            <div className="flex justify-between text-[11.5px] font-semibold text-ink-3">
              <span className="flex items-center gap-1 text-violet">
                <Sun className="size-3.5" />
                {selectedHours} h actividad
              </span>
              <span className="flex items-center gap-1 text-ink-3">
                <Moon className="size-3.5" />
                {sleepHours} h descanso
              </span>
            </div>
            <div className="flex h-3 w-full overflow-hidden rounded-full border border-line/60 bg-subtle">
              <div
                style={{ width: `${(selectedHours / 24) * 100}%` }}
                className="bg-violet transition-all duration-200"
              />
              <div
                style={{ width: `${(sleepHours / 24) * 100}%` }}
                className="bg-slate-300 dark:bg-slate-700 transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-col gap-2">
          <span className="text-[12px] font-bold text-ink-3 uppercase tracking-wider px-1">
            Accesos directos recomendados
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PRESETS.map((preset) => {
              const active = selectedHours === preset.hours
              const Icon = preset.icon
              return (
                <button
                  key={preset.hours}
                  type="button"
                  onClick={() => setSelectedHours(preset.hours)}
                  className={cx(
                    'flex items-center justify-between rounded-xl border p-2.5 text-left transition-all active:scale-98',
                    active
                      ? 'border-violet bg-violet-soft/80 ring-2 ring-violet/20 font-bold'
                      : 'border-line bg-surface hover:bg-subtle text-ink-2',
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={cx(
                        'flex size-7 shrink-0 items-center justify-center rounded-lg border',
                        preset.color,
                      )}
                    >
                      <Icon className="size-3.5" />
                    </div>
                    <span className="text-[13px] truncate">
                      {t(`capacity.${preset.key}`)}
                    </span>
                  </div>
                  {active && <Check className="size-4 text-violet stroke-[2.5] shrink-0 ml-1" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Explanatory callout answering the user question */}
        <div className="flex items-start gap-3 rounded-2xl border border-violet/20 bg-violet-soft/40 p-3.5 sm:p-4">
          <Sparkles className="size-5 text-violet shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="text-[13px] font-bold text-ink">
              {t('capacity.whyTitle')}
            </h4>
            <p className="mt-1 text-[12px] leading-relaxed text-ink-2">
              {t('capacity.whyExplanation')}
            </p>
          </div>
        </div>
      </div>
    </Sheet>
  )
}
