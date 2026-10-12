import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { updateObjective, updateResult, updateTask } from '@/data/actions'
import { useAleph } from '@/data/store'
import { resolvePlanningFlow } from '@/domain/planningLaws'
import { TERRENOS } from '@/domain/terrenos'
import { cx } from '@/components/ui/primitives'

interface PlanningFlowGuideProps {
  dayKey: string
  onNameResult: () => void
  onNameObjective: (resultId: string) => void
  onAddTodayStep: (resultId: string, objectiveId: string) => void
}

export function PlanningFlowGuide({
  dayKey,
  onNameResult,
  onNameObjective,
  onAddTodayStep,
}: PlanningFlowGuideProps) {
  const { t } = useTranslation()
  const state = useAleph()
  const flow = resolvePlanningFlow(state, dayKey)

  const saveMeaning = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    if (flow.current === 'vision' && flow.result) {
      updateResult(flow.result.id, { why: trimmed })
    }
    if (flow.current === 'vector' && flow.objective) {
      updateObjective(flow.objective.id, { why: trimmed })
    }
  }

  const lawKey = flow.current === 'hold' ? 'hold' : flow.current

  return (
    <section aria-label={t('flow.title')} className="rounded-[24px] border border-line bg-surface p-4 shadow-paper">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">{t('flow.kicker')}</p>
      <h2 className="mt-1 font-display text-[26px] leading-tight text-ink">{t('flow.title')}</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-3">{t('flow.hint')}</p>

      <ol className="mt-4 grid grid-cols-4 gap-1.5">
        {flow.steps.map((step, index) => {
          const active = flow.current === step.id
          return (
            <li key={step.id}>
              <div
                aria-current={active ? 'step' : undefined}
                className={cx(
                  'flex min-h-11 flex-col items-center justify-center rounded-2xl px-1 py-1.5 text-center',
                  active && 'bg-violet text-white',
                  !active && step.done && 'bg-violet-soft text-violet',
                  !active && !step.done && 'bg-subtle text-ink-3',
                )}
              >
                <span className="text-[10px] font-semibold tabular-nums">{index + 1}</span>
                <span className="text-[11px] font-semibold leading-tight">{t(`flow.laws.${step.id}.name`)}</span>
              </div>
            </li>
          )
        })}
      </ol>

      <div className="mt-4 rounded-2xl bg-subtle px-3 py-3">
        <p className="text-[15px] font-semibold leading-snug text-ink">{t(`flow.laws.${lawKey}.law`)}</p>
        <CapturedContext
          resultName={flow.result?.name}
          resultWhy={flow.result?.why}
          objectiveName={flow.objective?.name}
          objectiveWhy={flow.objective?.why}
          todayTitle={flow.todayTask?.title}
        />
      </div>

      {flow.current === 'vision' && !flow.result ? (
        <GuideButton onClick={onNameResult}>{t('flow.laws.vision.cta')}</GuideButton>
      ) : null}

      {flow.current === 'vision' && flow.result ? (
        <MeaningField
          key={`vision:${flow.result.id}`}
          label={t('flow.laws.vision.ask')}
          placeholder={t('flow.laws.vision.placeholder')}
          onSave={saveMeaning}
          saveLabel={t('flow.saveMeaning')}
        />
      ) : null}

      {flow.current === 'vector' && flow.result && !flow.objective ? (
        <GuideButton onClick={() => onNameObjective(flow.result!.id)}>{t('flow.laws.vector.cta')}</GuideButton>
      ) : null}

      {flow.current === 'vector' && flow.objective ? (
        <MeaningField
          key={`vector:${flow.objective.id}`}
          label={t('flow.laws.vector.ask')}
          placeholder={t('flow.laws.vector.placeholder')}
          onSave={saveMeaning}
          saveLabel={t('flow.saveMeaning')}
        />
      ) : null}

      {flow.current === 'pulse' && flow.result && flow.objective ? (
        <GuideButton onClick={() => onAddTodayStep(flow.result!.id, flow.objective!.id)}>
          {t('flow.laws.pulse.cta')}
        </GuideButton>
      ) : null}

      {flow.current === 'texture' && flow.todayTask ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {TERRENOS.map((terreno) => (
            <button
              key={terreno}
              type="button"
              onClick={() => updateTask(flow.todayTask!.id, { terreno })}
              className="min-h-11 rounded-2xl border border-line bg-white px-2 text-[13px] font-semibold text-ink"
            >
              {t(`planning.canvas.terreno.${terreno}Verb`)}
              <span className="mt-0.5 block text-[10px] font-medium text-ink-3">{t(`terrenos.${terreno}`)}</span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  )
}

function MeaningLine({ name, why, missing }: { name: string; why?: string; missing: string }) {
  const same = Boolean(why?.trim()) && why!.trim() === name.trim()
  const suffix = !why?.trim() ? ` — ${missing}` : same ? '' : ` — ${why}`
  return (
    <li>
      <span className="font-medium text-ink">{name}</span>
      {suffix}
    </li>
  )
}

function CapturedContext({
  resultName,
  resultWhy,
  objectiveName,
  objectiveWhy,
  todayTitle,
}: {
  resultName?: string
  resultWhy?: string
  objectiveName?: string
  objectiveWhy?: string
  todayTitle?: string
}) {
  const { t } = useTranslation()
  if (!resultName && !objectiveName && !todayTitle) return null
  return (
    <ul className="mt-2 space-y-1 text-[13px] leading-relaxed text-ink-2">
      {resultName ? (
        <MeaningLine name={resultName} why={resultWhy} missing={t('flow.laws.vision.missing')} />
      ) : null}
      {objectiveName ? (
        <MeaningLine name={objectiveName} why={objectiveWhy} missing={t('flow.laws.vector.missing')} />
      ) : null}
      {todayTitle ? (
        <li>
          {t('flow.today')} <span className="font-medium text-ink">{todayTitle}</span>
        </li>
      ) : null}
    </ul>
  )
}

function MeaningField({
  label,
  placeholder,
  onSave,
  saveLabel,
}: {
  label: string
  placeholder: string
  onSave: (text: string) => void
  saveLabel: string
}) {
  const [value, setValue] = useState('')
  return (
    <form
      className="mt-3 flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        onSave(value)
      }}
    >
      <label className="text-[13px] font-medium text-ink-2">
        {label}
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          rows={3}
          className="mt-1.5 w-full resize-none rounded-2xl border border-line bg-white px-3 py-2.5 text-[15px] text-ink outline-none placeholder:text-ink-4 focus:border-violet focus:ring-2 focus:ring-violet/20"
        />
      </label>
      <button
        type="submit"
        disabled={!value.trim()}
        className="min-h-11 rounded-2xl bg-violet px-4 text-[15px] font-semibold text-white disabled:opacity-40"
      >
        {saveLabel}
      </button>
    </form>
  )
}

function GuideButton({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3 min-h-11 w-full rounded-2xl bg-violet px-4 text-[15px] font-semibold text-white"
    >
      {children}
    </button>
  )
}
