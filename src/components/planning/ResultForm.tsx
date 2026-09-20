import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Chip, Field, Input, Textarea } from '@/components/ui/primitives'
import { Sheet } from '@/components/ui/Sheet'
import { createResult, updateResult } from '@/data/actions'
import { allProjects } from '@/data/selectors'
import { useAleph } from '@/data/store'
import { PILLAR_COLOR, PILLAR_ORDER } from '@/domain/pillars'
import type { Pillar, Result } from '@/domain/types'

export function ResultForm({
  open,
  onClose,
  result,
  initialName,
  initialProjectName,
}: {
  open: boolean
  onClose: () => void
  result?: Result
  initialName?: string
  initialProjectName?: string
}) {
  const { t } = useTranslation()
  const state = useAleph()
  const projects = allProjects(state)
  const existingProjects = Array.from(
    new Set(projects.map((p) => p.name.trim())),
  )

  const [projectName, setProjectName] = useState(
    result?.projectName ?? initialProjectName ?? existingProjects[0] ?? '',
  )
  const [name, setName] = useState(result?.name ?? initialName ?? '')
  const [why, setWhy] = useState(result?.why ?? '')
  const [targetDate, setTargetDate] = useState(result?.targetDate ?? '')
  const [pillar, setPillar] = useState<Pillar>(result?.pillar ?? 'mind')

  const reset = (next?: Result, seed?: string) => {
    setProjectName(next?.projectName ?? initialProjectName ?? existingProjects[0] ?? '')
    setName(next?.name ?? seed ?? '')
    setWhy(next?.why ?? '')
    setTargetDate(next?.targetDate ?? '')
    setPillar(next?.pillar ?? 'mind')
  }

  const visible = open
  if (visible && name === '' && (result?.name || initialName)) {
    reset(result, initialName)
  }

  const save = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const pName = projectName.trim() || undefined
    if (result) {
      updateResult(result.id, {
        projectName: pName,
        name: trimmed,
        why: why.trim() || undefined,
        targetDate: targetDate || undefined,
        pillar,
      })
    } else {
      createResult({
        projectName: pName,
        name: trimmed,
        why: why.trim() || undefined,
        targetDate: targetDate || undefined,
        pillar,
      })
    }
    reset()
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title={result ? t('planning.results.editTitle') : t('planning.results.createTitle')}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button className="flex-1" disabled={!name.trim()} onClick={save}>
            {t('common.save')}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Nombre del Proyecto" hint="El marco general o proyecto donde se inscribe (ej. Estudio Creativo, Lanzamiento 2026)">
          <Input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Ej. Estudio Creativo / Mi Marca / La Obra"
            list="project-suggestions"
          />
          <datalist id="project-suggestions">
            {existingProjects.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </Field>

        <Field label="Resultado que se produce dentro" hint="El resultado concreto y tangible que se genera dentro del proyecto">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Primer producto listo para vender"
            autoFocus
          />
        </Field>
        <Field label={t('pillars.label')}>
          <div className="flex flex-wrap gap-2">
            {PILLAR_ORDER.map((id) => (
              <Chip key={id} active={pillar === id} onClick={() => setPillar(id)} className="min-h-11">
                <span
                  aria-hidden
                  className="mr-1.5 inline-block size-2 rounded-full"
                  style={{ background: PILLAR_COLOR[id] }}
                />
                {t(`pillars.${id}`)}
              </Chip>
            ))}
          </div>
        </Field>
        <Field label={`${t('common.why')} (${t('common.optional')})`}>
          <Textarea
            rows={3}
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            placeholder={t('planning.results.whyPlaceholder')}
          />
        </Field>
        <Field label={`${t('planning.results.targetDate')} (${t('common.optional')})`}>
          <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
        </Field>
      </div>
    </Sheet>
  )
}

/** Controlled create/edit sheet that remounts when the seed name or result changes. */
export function ResultFormSheet(props: {
  open: boolean
  onClose: () => void
  result?: Result
  initialName?: string
  initialProjectName?: string
}) {
  const key = `${props.result?.id ?? 'new'}:${props.initialName ?? ''}:${props.initialProjectName ?? ''}:${props.open ? '1' : '0'}`
  return <ResultForm key={key} {...props} />
}
