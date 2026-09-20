import { useTranslation } from 'react-i18next'
import {
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Coins,
  FileCheck2,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { cx } from '@/components/ui/primitives'
import { TASK_VIEW_TEMPLATES, templateUsageCount } from '@/domain/taskView'
import type { Task, TaskViewTemplate } from '@/domain/types'

const ICONS: Record<TaskViewTemplate, LucideIcon> = {
  checklist: CheckCircle2,
  time: Clock,
  metrics: BarChart3,
  money: Coins,
  contacts: Users,
  workDone: FileCheck2,
  mindmap: BrainCircuit,
}

export function TaskTemplatePicker({
  task,
  selected,
  onSelect,
}: {
  task: Task
  selected: TaskViewTemplate | null
  onSelect: (template: TaskViewTemplate) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-[16px] font-semibold text-ink">{t('taskView.title')}</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-3">{t('taskView.hint')}</p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {TASK_VIEW_TEMPLATES.map((template) => {
          const Icon = ICONS[template]
          const active = selected === template
          const count = templateUsageCount(task, template)
          const usage =
            count <= 0
              ? t('taskView.empty')
              : template === 'time'
                ? t('taskView.minutes', { count })
                : t('taskView.items', { count })
          return (
            <button
              key={template}
              type="button"
              onClick={() => onSelect(template)}
              className={cx(
                'flex min-h-[72px] items-start gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors',
                active
                  ? 'border-violet bg-violet-soft ring-1 ring-violet/20'
                  : 'border-line bg-surface hover:border-line-strong hover:bg-subtle',
              )}
            >
              <span
                className={cx(
                  'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl',
                  active ? 'bg-violet text-white' : 'bg-subtle text-ink-2',
                )}
              >
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className={cx('block text-[14px] font-semibold', active ? 'text-violet' : 'text-ink')}>
                  {t(`taskView.templates.${template}.name`)}
                </span>
                <span className="mt-0.5 block text-[12px] leading-snug text-ink-3">
                  {t(`taskView.templates.${template}.hint`)}
                </span>
                <span className="mt-1 block text-[11px] font-medium text-ink-4">{usage}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function TaskTemplateTrigger({
  template,
  open,
  onClick,
}: {
  template: TaskViewTemplate | null
  open: boolean
  onClick: () => void
}) {
  const { t } = useTranslation()
  const Icon = template ? ICONS[template] : CheckCircle2

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-subtle px-3 text-[13px] font-semibold text-ink hover:border-line-strong"
    >
      <Icon className="size-3.5 text-violet" />
      <span>{template ? t(`taskView.templates.${template}.name`) : t('taskView.choose')}</span>
      <span className={cx('text-ink-4 transition-transform', open && 'rotate-180')}>▾</span>
    </button>
  )
}
