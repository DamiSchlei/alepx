import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sheet } from '@/components/ui/Sheet'
import { Button, Input, Textarea } from '@/components/ui/primitives'
import { createArtifact, updateArtifact } from '@/data/actions'
import { TERRENO_MAP, TERRENOS } from '@/domain/terrenos'
import type { ObraArtifact, ObraArtifactType, Terreno } from '@/domain/types'

interface ObraArtifactFormSheetProps {
  open: boolean
  onClose: () => void
  artifact?: ObraArtifact
  defaultProjectId?: string
  defaultResultId?: string
  defaultObjectiveId?: string
  defaultTerreno?: Terreno
}

const ARTIFACT_TYPES: ObraArtifactType[] = [
  'note',
  'decision',
  'reference',
  'deliverable',
  'snippet',
]

function ObraArtifactFormContent({
  artifact,
  defaultProjectId,
  defaultResultId,
  defaultObjectiveId,
  defaultTerreno = 'literatura',
  onClose,
}: {
  artifact?: ObraArtifact
  defaultProjectId?: string
  defaultResultId?: string
  defaultObjectiveId?: string
  defaultTerreno?: Terreno
  onClose: () => void
}) {
  const { t } = useTranslation()

  const [title, setTitle] = useState(artifact?.title || '')
  const [content, setContent] = useState(artifact?.content || '')
  const [terreno, setTerreno] = useState<Terreno>(artifact?.terreno || defaultTerreno)
  const [type, setType] = useState<ObraArtifactType>(artifact?.type || 'note')
  const [url, setUrl] = useState(artifact?.url || '')
  const [tagsInput, setTagsInput] = useState(artifact?.tags?.join(', ') || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return

    const tags = tagsInput
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    if (artifact) {
      updateArtifact(artifact.id, {
        title: trimmedTitle,
        content: content.trim(),
        terreno,
        type,
        url: url.trim() || undefined,
        tags,
      })
    } else {
      createArtifact({
        projectId: defaultProjectId,
        resultId: defaultResultId,
        objectiveId: defaultObjectiveId,
        terreno,
        type,
        title: trimmedTitle,
        content: content.trim(),
        url: url.trim() || undefined,
        tags,
      })
    }

    onClose()
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 overflow-y-auto max-h-[calc(90dvh-120px)]">
        {/* Title */}
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-ink">
            {t('obra.form.titleLabel')}
          </span>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('obra.form.titlePlaceholder')}
            autoFocus
            required
          />
        </label>

        {/* Terreno Selector */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-ink">
            {t('obra.form.terrenoLabel')}
          </span>
          <div className="grid grid-cols-3 gap-2">
            {TERRENOS.map((terr) => {
              const meta = TERRENO_MAP[terr]
              const isSelected = terreno === terr
              return (
                <button
                  key={terr}
                  type="button"
                  onClick={() => setTerreno(terr)}
                  className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-2.5 text-center transition-all min-h-12 ${
                    isSelected
                      ? 'border-ink/60 bg-surface shadow-xs font-semibold'
                      : 'border-line/70 bg-surface/50 text-ink-3 hover:bg-surface'
                  }`}
                  style={{
                    borderLeftWidth: isSelected ? '3.5px' : '1px',
                    borderLeftColor: meta.color,
                  }}
                >
                  <span
                    className="text-[12px]"
                    style={{ color: isSelected ? meta.color : undefined }}
                  >
                    {meta.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Type Selector */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-ink">
            {t('obra.form.typeLabel')}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {ARTIFACT_TYPES.map((tKey) => {
              const isSelected = type === tKey
              return (
                <button
                  key={tKey}
                  type="button"
                  onClick={() => setType(tKey)}
                  className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
                    isSelected
                      ? 'bg-ink text-white'
                      : 'bg-surface-2 text-ink-3 hover:bg-surface-3 hover:text-ink'
                  }`}
                >
                  {t(`obra.types.${tKey}`)}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-ink">
            {t('obra.form.contentLabel')}
          </span>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('obra.form.contentPlaceholder')}
            rows={5}
            className="font-sans text-[13px] leading-relaxed"
          />
        </label>

        {/* URL Link */}
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-ink">
            {t('obra.form.urlLabel')}
          </span>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t('obra.form.urlPlaceholder')}
            type="url"
          />
        </label>

        {/* Tags */}
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-ink">
            {t('obra.form.tagsLabel')}
          </span>
          <Input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder={t('obra.form.tagsPlaceholder')}
          />
        </label>
      </form>

      <div className="flex w-full items-center justify-end gap-2 px-4 py-3 border-t border-line">
        <Button variant="ghost" onClick={onClose} type="button">
          {t('common.cancel')}
        </Button>
        <Button variant="primary" onClick={handleSubmit} type="button">
          {t('obra.form.save')}
        </Button>
      </div>
    </>
  )
}

export function ObraArtifactFormSheet({
  open,
  onClose,
  artifact,
  defaultProjectId,
  defaultResultId,
  defaultObjectiveId,
  defaultTerreno = 'literatura',
}: ObraArtifactFormSheetProps) {
  const { t } = useTranslation()

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={artifact ? t('obra.editArtifact') : t('obra.newArtifact')}
    >
      {open ? (
        <ObraArtifactFormContent
          key={artifact?.id ?? 'new'}
          artifact={artifact}
          defaultProjectId={defaultProjectId}
          defaultResultId={defaultResultId}
          defaultObjectiveId={defaultObjectiveId}
          defaultTerreno={defaultTerreno}
          onClose={onClose}
        />
      ) : null}
    </Sheet>
  )
}
