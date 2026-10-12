import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FileText,
  Bookmark,
  CheckCircle,
  ExternalLink,
  CalendarPlus,
  Trash2,
  Edit2,
  Tag,
  Code2,
  Compass,
  Check,
} from 'lucide-react'
import { convertArtifactToTask, deleteArtifact } from '@/data/actions'
import { TERRENO_MAP } from '@/domain/terrenos'
import { formatDate } from '@/i18n/format'
import { useAleph } from '@/data/store'
import type { ObraArtifact, ObraArtifactType } from '@/domain/types'

interface ObraArtifactCardProps {
  artifact: ObraArtifact
  onEdit: (artifact: ObraArtifact) => void
  onDelete?: (id: string) => void
  compact?: boolean
  showConvertCta?: boolean
}

const TYPE_ICONS: Record<ObraArtifactType, typeof FileText> = {
  note: FileText,
  decision: CheckCircle,
  reference: Bookmark,
  deliverable: CheckCircle,
  snippet: Code2,
}

export function ObraArtifactCard({
  artifact,
  onEdit,
  onDelete,
  compact = false,
  showConvertCta = true,
}: ObraArtifactCardProps) {
  const { t } = useTranslation()
  const state = useAleph()
  const locale = state.character.locale
  const terrenoMeta = TERRENO_MAP[artifact.terreno] || TERRENO_MAP.literatura
  const TypeIcon = TYPE_ICONS[artifact.type] || FileText
  const [converted, setConverted] = useState(false)

  const handleConvert = () => {
    convertArtifactToTask(artifact.id)
    setConverted(true)
    setTimeout(() => setConverted(false), 2500)
  }

  const handleDelete = () => {
    if (window.confirm(t('obra.confirmDelete'))) {
      deleteArtifact(artifact.id)
      onDelete?.(artifact.id)
    }
  }

  return (
    <article
      className="group relative flex flex-col justify-between rounded-[16px] border border-line bg-surface p-4 shadow-paper transition-all hover:border-ink/20"
      style={{
        borderLeftWidth: '3.5px',
        borderLeftColor: terrenoMeta.color,
      }}
    >
      <div>
        {/* Top meta row */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Terreno Badge */}
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide"
              style={{
                backgroundColor: `${terrenoMeta.color}15`,
                color: terrenoMeta.color,
              }}
            >
              <Compass className="size-3" />
              {terrenoMeta.label}
            </span>

            {/* Type badge */}
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-ink-3">
              <TypeIcon className="size-3 text-ink-3" />
              {t(`obra.types.${artifact.type}`)}
            </span>
          </div>

          <span className="text-[11px] text-ink-3">
            {formatDate(artifact.createdAt.slice(0, 10), locale)}
          </span>
        </div>

        {/* Title */}
        <h3
          className={
            artifact.terreno === 'literatura'
              ? 'font-serif text-[16px] font-semibold text-ink leading-snug tracking-tight'
              : 'text-[15px] font-semibold text-ink leading-snug'
          }
        >
          {artifact.title}
        </h3>

        {/* Content */}
        {artifact.content && (
          <p
            className={`mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-ink/80 ${
              compact ? 'line-clamp-3' : ''
            }`}
          >
            {artifact.content}
          </p>
        )}

        {/* External URL if any */}
        {artifact.url && (
          <div className="mt-2.5">
            <a
              href={artifact.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[12px] font-medium text-violet hover:underline"
            >
              <ExternalLink className="size-3.5" />
              <span className="truncate max-w-[240px]">{artifact.url}</span>
            </a>
          </div>
        )}

        {/* Tags */}
        {artifact.tags && artifact.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {artifact.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 rounded-[6px] bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-ink-3"
              >
                <Tag className="size-2.5 opacity-60" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="mt-3.5 flex items-center justify-between border-t border-line/60 pt-2.5">
        <div>
          {showConvertCta && (
            <button
              type="button"
              onClick={handleConvert}
              disabled={converted}
              className={`inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1 text-[12px] font-medium transition-colors ${
                converted
                  ? 'bg-mint/15 text-mint font-semibold'
                  : 'bg-violet/10 text-violet hover:bg-violet/20'
              }`}
            >
              {converted ? (
                <>
                  <Check className="size-3.5" />
                  <span>{t('obra.convertedSuccess')}</span>
                </>
              ) : (
                <>
                  <CalendarPlus className="size-3.5" />
                  <span>{t('obra.convertAction')}</span>
                </>
              )}
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(artifact)}
            aria-label={t('obra.editArtifact')}
            className="flex size-8 items-center justify-center rounded-[6px] text-ink-3 hover:bg-surface-2 hover:text-ink transition-colors"
          >
            <Edit2 className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            aria-label={t('obra.deleteArtifact')}
            className="flex size-8 items-center justify-center rounded-[6px] text-ink-3 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    </article>
  )
}
