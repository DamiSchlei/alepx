import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sheet } from '@/components/ui/Sheet'
import { Button, Field, Input } from '@/components/ui/primitives'
import { createProject, updateProject, deleteProject } from '@/data/actions'
import type { Project } from '@/domain/types'

const PRESET_COLORS = [
  { key: 'violet', value: '#7a3fe0' },
  { key: 'blue', value: '#2563eb' },
  { key: 'emerald', value: '#059669' },
  { key: 'amber', value: '#d97706' },
  { key: 'rose', value: '#e11d48' },
  { key: 'cyan', value: '#0891b2' },
  { key: 'indigo', value: '#4f46e5' },
  { key: 'slate', value: '#475569' },
] as const

function ProjectFormContent({
  project,
  onClose,
  onSaved,
  onDeleted,
}: {
  project?: Project
  onClose: () => void
  onSaved?: (project: Project) => void
  onDeleted?: (id: string) => void
}) {
  const { t } = useTranslation()
  const isEditing = Boolean(project)

  const [name, setName] = useState(project?.name ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [color, setColor] = useState(project?.color ?? '#7a3fe0')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    if (project) {
      updateProject(project.id, {
        name: trimmed,
        description: description.trim() || undefined,
        color,
      })
      onSaved?.({
        ...project,
        name: trimmed,
        description: description.trim() || undefined,
        color,
      })
    } else {
      const created = createProject({
        name: trimmed,
        description: description.trim() || undefined,
        color,
      })
      onSaved?.(created)
    }
    onClose()
  }

  const handleDelete = () => {
    if (!project) return
    const id = project.id
    deleteProject(id)
    setShowDeleteConfirm(false)
    onDeleted?.(id)
    onClose()
  }

  return (
    <div className="flex flex-col gap-4">
      <form id="project-form" onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
        <Field label={t('planning.projectForm.nameLabel')} hint={t('planning.projectForm.nameHint')}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('planning.projectForm.namePlaceholder')}
            autoFocus
            required
          />
        </Field>

        <Field label={t('planning.projectForm.purposeLabel')} hint={t('planning.projectForm.purposeHint')}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('planning.projectForm.purposePlaceholder')}
            rows={3}
            className="w-full resize-none rounded-xl border border-line bg-surface p-3 text-[14px] text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none"
          />
        </Field>

        <Field label={t('planning.projectForm.colorLabel')} hint={t('planning.projectForm.colorHint')}>
          <div className="flex flex-wrap gap-2 pt-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all ${
                  color === c.value
                    ? 'ring-2 ring-offset-2 ring-accent text-white shadow-sm'
                    : 'border border-line bg-white text-ink-2 hover:border-accent/40'
                }`}
                style={{
                  backgroundColor: color === c.value ? c.value : undefined,
                }}
              >
                <span
                  className="size-3 rounded-full shrink-0"
                  style={{ backgroundColor: c.value }}
                />
                {t(`planning.projectForm.colors.${c.key}`)}
              </button>
            ))}
          </div>
        </Field>

        {showDeleteConfirm && (
          <div className="mt-2 rounded-xl border border-red-200 bg-red-50 p-3 text-red-900 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-200">
            <p className="text-[13px] font-medium">
              {t('planning.projectForm.deleteConfirm')}
            </p>
            <div className="mt-3 flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={handleDelete}
              >
                {t('planning.projectForm.confirmDelete')}
              </Button>
            </div>
          </div>
        )}
      </form>

      <div className="flex w-full items-center justify-between gap-2 border-t border-line/60 pt-4 mt-2">
        {isEditing ? (
          <Button
            type="button"
            variant="secondary"
            className="text-red-500 hover:text-red-600"
            onClick={() => setShowDeleteConfirm(true)}
          >
            {t('common.delete')}
          </Button>
        ) : <div />}
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            disabled={!name.trim()}
            onClick={() => handleSubmit()}
          >
            {isEditing ? t('planning.projectForm.save') : t('planning.projectForm.create')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ProjectFormSheet({
  open,
  onClose,
  project,
  onSaved,
  onDeleted,
}: {
  open: boolean
  onClose: () => void
  project?: Project
  onSaved?: (project: Project) => void
  onDeleted?: (id: string) => void
}) {
  const isEditing = Boolean(project)
  const { t } = useTranslation()

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isEditing ? t('planning.editProject') : t('planning.newProject')}
    >
      {open && (
        <ProjectFormContent
          key={project?.id ?? 'new'}
          project={project}
          onClose={onClose}
          onSaved={onSaved}
          onDeleted={onDeleted}
        />
      )}
    </Sheet>
  )
}
