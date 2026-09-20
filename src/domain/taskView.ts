import type { Task, TaskViewTemplate } from './types'

export const TASK_VIEW_TEMPLATES: readonly TaskViewTemplate[] = [
  'checklist',
  'time',
  'metrics',
  'money',
  'contacts',
  'workDone',
  'mindmap',
] as const

export function isTaskViewTemplate(value: unknown): value is TaskViewTemplate {
  return typeof value === 'string' && (TASK_VIEW_TEMPLATES as readonly string[]).includes(value)
}

/** Infer a template from existing tactical data so old tasks do not start blank. */
export function inferTaskViewTemplate(task: Task): TaskViewTemplate | null {
  if ((task.thoughtMap?.nodes?.length ?? 0) > 0) return 'mindmap'
  if ((task.moneyTransactions?.length ?? 0) > 0) return 'money'
  if ((task.contacts?.length ?? 0) > 0) return 'contacts'
  if ((task.metrics?.length ?? 0) > 0) return 'metrics'
  if ((task.workLogs?.length ?? 0) > 0) return 'workDone'
  if ((task.checklist?.length ?? 0) > 0) return 'checklist'
  if ((task.actualHours ?? 0) > 0) return 'time'
  return null
}

export function resolveTaskViewTemplate(task: Task): TaskViewTemplate | null {
  if (isTaskViewTemplate(task.viewTemplate)) return task.viewTemplate
  return inferTaskViewTemplate(task)
}

export function templateUsageCount(task: Task, template: TaskViewTemplate): number {
  switch (template) {
    case 'checklist':
      return task.checklist?.length ?? 0
    case 'time':
      return Math.round((task.actualHours ?? 0) * 60)
    case 'metrics':
      return task.metrics?.length ?? 0
    case 'money':
      return task.moneyTransactions?.length ?? 0
    case 'contacts':
      return task.contacts?.length ?? 0
    case 'workDone':
      return task.workLogs?.length ?? 0
    case 'mindmap':
      return task.thoughtMap?.nodes?.length ?? 0
  }
}
