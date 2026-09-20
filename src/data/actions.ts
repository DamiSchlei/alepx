import { getState, newId, setState } from './store'
import { addCharacterXp, addSkillXp, computeReward, isTaskDone, shouldPayReward, type Reward } from '@/domain/economy'
import {
  MAX_SERIES_BLOCKS,
  activeObjectivesOfResult,
  canAddObjective,
  MIN_ESTIMATED_HOURS,
} from '@/domain/limits'
import { skillIdToPillar } from '@/domain/pillars'
import { seriesDayKeys, toDayKey } from '@/domain/dates'
import { taskDayKey } from '@/data/selectors'
import type {
  Character,
  Comment,
  Cosmetic,
  CosmeticCategory,
  Difficulty,
  Objective,
  ObjectiveInventory,
  ObjectiveStatus,
  ParentType,
  Pillar,
  Project,
  Result,
  ResultStatus,
  Skill,
  StageId,
  Task,
  TaskCheckItem,
  TaskContact,
  TaskMetric,
  TaskMoneyTransaction,
  TaskViewTemplate,
  TaskWorkDone,
  Terreno,
  ThoughtMap,
} from '@/domain/types'

const now = () => new Date().toISOString()

// ---------------------------------------------------------------- character

export function renameCharacter(name: string): void {
  const trimmed = name.trim()
  if (!trimmed) return
  setState((s) => ({ ...s, character: { ...s.character, name: trimmed } }))
}

export function setCharacterLocale(locale: Character['locale']): void {
  setState((s) => ({ ...s, character: { ...s.character, locale } }))
}

export function markOnboarded(): void {
  setState((s) => ({ ...s, character: { ...s.character, onboarded: true } }))
}

export function setDailyHourCap(hours: number): void {
  if (!Number.isFinite(hours) || hours <= 0) return
  setState((s) => ({ ...s, character: { ...s.character, dailyHourCap: hours } }))
}

export function setJournalBubbleHidden(hidden: boolean): void {
  setState((s) => ({ ...s, character: { ...s.character, journalBubbleHidden: hidden } }))
}



/**
 * Basic avatar layers (skin, hair, eyes, outfit, accessory, background) are all
 * free from level 1, so equipping never touches money. A future shop would sell
 * extras (bundles, frames), not these basics.
 */
export function equipCosmetic(category: CosmeticCategory, cosmeticId: string): void {
  setState((s) => ({
    ...s,
    character: {
      ...s.character,
      avatar: { ...s.character.avatar, [`${category}Id`]: cosmeticId },
    },
  }))
}

// ------------------------------------------------------------------- skills

export function createSkill(input: { name: string; icon: string; color?: string }): Skill {
  const skill: Skill = {
    id: newId('skill'),
    name: input.name.trim(),
    icon: input.icon,
    color: input.color ?? '#94a3b8',
    level: 1,
    xp: 0,
    isCustom: true,
  }
  setState((s) => ({ ...s, skills: [...s.skills, skill] }))
  return skill
}

// ----------------------------------------------------------------- projects

export interface ProjectInput {
  name: string
  description?: string
  color?: string
  icon?: string
}

export function createProject(input: ProjectInput): Project {
  const project: Project = {
    id: newId('project'),
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    color: input.color || '#7a3fe0',
    icon: input.icon || 'folder',
    createdAt: now(),
  }
  setState((s) => ({
    ...s,
    projects: [...(s.projects ?? []), project],
  }))
  return project
}

export function updateProject(
  id: string,
  patch: Partial<Omit<Project, 'id' | 'createdAt'>>,
): void {
  setState((s) => {
    let projects = [...(s.projects ?? [])]
    const existingIndex = projects.findIndex((p) => p.id === id)
    const newName = patch.name?.trim()

    let oldName = existingIndex >= 0 ? projects[existingIndex].name : undefined

    // If not found by ID in s.projects, find from synthesized results or default
    if (!oldName) {
      const match = s.results.find(
        (r) =>
          r.projectName &&
          (`proj_${r.projectName.toLowerCase().replace(/\s+/g, '_')}` === id ||
            r.projectName.toLowerCase() === id.toLowerCase()),
      )
      if (match?.projectName) {
        oldName = match.projectName
      } else if (id === 'proj_obra_principal' || id === 'proj_default') {
        oldName = 'La Obra Principal'
      }
    }

    if (existingIndex >= 0) {
      projects[existingIndex] = {
        ...projects[existingIndex],
        ...patch,
        name: newName || projects[existingIndex].name,
      }
    } else {
      // It was synthesized, so now we formally materialize it in s.projects
      projects.push({
        id,
        name: newName || oldName || 'Proyecto',
        description: patch.description,
        color: patch.color || '#7a3fe0',
        icon: patch.icon || 'folder',
        createdAt: now(),
      })
    }

    // If project was renamed, cascade update to results
    let nextResults = s.results
    const effectiveOld = oldName || (existingIndex >= 0 ? projects[existingIndex].name : undefined)
    if (effectiveOld && newName && effectiveOld.trim().toLowerCase() !== newName.toLowerCase()) {
      nextResults = s.results.map((r) => {
        const rProj = r.projectName?.trim() || 'La Obra Principal'
        if (rProj.toLowerCase() === effectiveOld.trim().toLowerCase()) {
          return { ...r, projectName: newName }
        }
        return r
      })
    }

    return {
      ...s,
      projects,
      results: nextResults,
    }
  })
}

export function deleteProject(id: string): void {
  setState((s) => {
    const existing = (s.projects ?? []).find((p) => p.id === id)
    let targetName = existing?.name
    if (!targetName) {
      const match = s.results.find(
        (r) =>
          r.projectName &&
          (`proj_${r.projectName.toLowerCase().replace(/\s+/g, '_')}` === id ||
            r.projectName.toLowerCase() === id.toLowerCase()),
      )
      targetName = match?.projectName
    }

    return {
      ...s,
      projects: (s.projects ?? []).filter((p) => p.id !== id),
      results: targetName
        ? s.results.map((r) =>
            (r.projectName?.trim() || '').toLowerCase() === targetName.trim().toLowerCase()
              ? { ...r, projectName: undefined }
              : r,
          )
        : s.results,
    }
  })
}

// ------------------------------------------------------------------ results

export interface ResultInput {
  name: string
  projectName?: string
  why?: string
  skillId?: string
  pillar?: Pillar
  targetDate?: string
}

export function createResult(input: ResultInput): Result {
  const state = getState()
  const skillId = input.skillId || undefined
  const result: Result = {
    id: newId('result'),
    projectName: input.projectName?.trim() || undefined,
    name: input.name.trim(),
    why: input.why?.trim() || undefined,
    skillId,
    pillar: input.pillar ?? skillIdToPillar(skillId),
    targetDate: input.targetDate || undefined,
    importance: state.results.length,
    status: 'active',
  }
  setState((s) => ({ ...s, results: [...s.results, result] }))
  return result
}

export function updateResult(id: string, patch: Partial<Omit<Result, 'id'>>): void {
  setState((s) => ({
    ...s,
    results: s.results.map((r) => {
      if (r.id !== id) return r
      const next = { ...r, ...patch }
      // Changing skillId alone must not overwrite an existing pillar.
      if (patch.pillar === undefined && !r.pillar) {
        next.pillar = skillIdToPillar(next.skillId)
      }
      return next
    }),
  }))
}

export function setResultStatus(id: string, status: ResultStatus): void {
  updateResult(id, { status })
}

/**
 * Archiving only flips the result's status so it can be restored cleanly: its
 * objectives, tasks and journal stay intact. Archived results are hidden from the
 * active lists and their tasks drop off the agenda (see selectors).
 */
export function archiveResult(id: string): void {
  setResultStatus(id, 'archived')
}

/** Brings an archived result back into the active lists, untouched. */
export function restoreResult(id: string): void {
  setResultStatus(id, 'active')
}

export function reorderResults(orderedIds: string[]): void {
  setState((s) => ({
    ...s,
    results: s.results.map((r) => {
      const index = orderedIds.indexOf(r.id)
      return index >= 0 ? { ...r, importance: index } : r
    }),
  }))
}

// --------------------------------------------------------------- objectives

export interface ObjectiveInput {
  resultId: string
  name: string
  why?: string
  doneWhen?: string
  nonGoals?: string
  reviewEvery?: 'weekly' | 'every_n_tasks'
  reviewEveryN?: number
  skillId?: string
  targetDate?: string
  importance?: number
}

export class ObjectiveLimitError extends Error {
  constructor() {
    super('MAX_OBJECTIVES_PER_RESULT')
  }
}

export function createObjective(input: ObjectiveInput): Objective {
  const state = getState()
  if (!canAddObjective(state.objectives, input.resultId)) throw new ObjectiveLimitError()
  const siblings = activeObjectivesOfResult(state.objectives, input.resultId)

  const objective: Objective = {
    id: newId('objective'),
    resultId: input.resultId,
    name: input.name.trim(),
    why: input.why?.trim() || undefined,
    doneWhen: input.doneWhen?.trim() || undefined,
    nonGoals: input.nonGoals?.trim() || undefined,
    reviewEvery: input.reviewEvery,
    reviewEveryN: input.reviewEveryN,
    skillId: input.skillId || undefined,
    targetDate: input.targetDate || undefined,
    importance: input.importance ?? siblings.length + 1,
    currentStage: 'research',
    status: 'pending',
  }
  setState((s) => ({ ...s, objectives: [...s.objectives, objective] }))
  return objective
}

export function updateObjective(id: string, patch: Partial<Omit<Objective, 'id' | 'resultId'>>): void {
  setState((s) => ({
    ...s,
    objectives: s.objectives.map((o) => (o.id === id ? { ...o, ...patch } : o)),
  }))
}

/**
 * Single path for ObjectiveDetail status changes.
 * Marking done does not pay XP and does not auto-archive.
 * Flipping done → in_progress occupies a quota slot again (create still enforces the cap).
 */
export function setObjectiveStatus(id: string, status: ObjectiveStatus): void {
  updateObjective(id, { status })
}

export function updateObjectiveInventory(
  id: string,
  patch: Partial<ObjectiveInventory>,
): void {
  setState((s) => ({
    ...s,
    objectives: s.objectives.map((o) => {
      if (o.id !== id) return o
      const inventory = {
        costs: o.inventory?.costs ?? 0,
        contacts: o.inventory?.contacts ?? 0,
        docs: o.inventory?.docs ?? 0,
        links: o.inventory?.links ?? 0,
        ...patch,
      }
      return { ...o, inventory }
    }),
  }))
}


export function archiveObjective(id: string): void {
  const timestamp = now()
  setState((s) => ({
    ...s,
    objectives: s.objectives.map((o) => (o.id === id ? { ...o, archivedAt: timestamp } : o)),
    tasks: s.tasks.map((t) =>
      t.objectiveId === id && (t.status === 'pending' || t.status === 'in_progress')
        ? { ...t, status: 'cancelled' }
        : t,
    ),
  }))
}

/** Reorders active objectives only; completed / archived keep their importance. */
export function reorderObjectives(resultId: string, orderedIds: string[]): void {
  setState((s) => {
    const activeIds = new Set(activeObjectivesOfResult(s.objectives, resultId).map((o) => o.id))
    return {
      ...s,
      objectives: s.objectives.map((o) => {
        if (o.resultId !== resultId || !activeIds.has(o.id)) return o
        const index = orderedIds.indexOf(o.id)
        return index >= 0 ? { ...o, importance: index + 1 } : o
      }),
    }
  })
}

// -------------------------------------------------------------------- tasks

export interface TaskInput {
  title: string
  notes?: string
  resultId?: string
  objectiveId?: string
  terreno?: Terreno
  stage?: StageId
  skillId?: string
  estimatedHours?: number
  difficulty?: Difficulty
  dueAt?: string
  scheduledFor?: string
  scheduledStart?: string
  scheduledEnd?: string
  doneCheck?: string
  checklist?: TaskCheckItem[]
  referenceUrl?: string
  seriesId?: string
  seriesWeekdays?: number[]
  dayOrder?: number
  metrics?: TaskMetric[]
  moneyTransactions?: TaskMoneyTransaction[]
  workLogs?: TaskWorkDone[]
  contacts?: TaskContact[]
  thoughtMap?: ThoughtMap
  viewTemplate?: TaskViewTemplate
}

/**
 * Creates a task with optional terreno and stage (defaults to execution when scheduled on a day).
 */
export function createTask(input: TaskInput): Task {
  const state = getState()
  const siblings = state.tasks.filter(
    (t) => t.objectiveId === input.objectiveId && t.stage === (input.stage ?? 'research'),
  )
  const objective = input.objectiveId
    ? state.objectives.find((o) => o.id === input.objectiveId)
    : undefined
  const activeResult = state.results.find((r) => r.status === 'active')
  const task: Task = {
    id: newId('task'),
    title: input.title.trim(),
    notes: input.notes?.trim() || undefined,
    resultId: input.resultId || objective?.resultId || activeResult?.id,
    objectiveId: input.objectiveId || undefined,
    terreno: input.terreno,
    stage: input.stage ?? (input.scheduledFor || input.dueAt ? 'execution' : 'research'),
    skillId: input.skillId || undefined,
    estimatedHours: Math.max(MIN_ESTIMATED_HOURS, input.estimatedHours ?? 1),
    difficulty: input.difficulty ?? 'medium',
    importance: siblings.length,
    dueAt: input.dueAt || undefined,
    scheduledFor: input.scheduledFor || undefined,
    scheduledStart: input.scheduledStart || undefined,
    scheduledEnd: input.scheduledEnd || undefined,
    doneCheck: input.doneCheck?.trim() || undefined,
    checklist: input.checklist,
    referenceUrl: input.referenceUrl?.trim() || undefined,
    seriesId: input.seriesId,
    seriesWeekdays: input.seriesWeekdays,
    dayOrder: input.dayOrder,
    status: 'pending',
    rewardApplied: false,
    createdAt: now(),
    metrics: input.metrics,
    moneyTransactions: input.moneyTransactions,
    workLogs: input.workLogs,
    contacts: input.contacts,
    thoughtMap: input.thoughtMap,
    viewTemplate: input.viewTemplate,
  }
  setState((s) => ({ ...s, tasks: [...s.tasks, task] }))
  return task
}

export type SeriesHorizon = 'week' | 'month'

export interface TaskSeriesInput extends TaskInput {
  weekdays: number[]
  hoursPerBlock: number
  horizon: SeriesHorizon
}

/**
 * Weekly blocks as Tasks. One Task per matching weekday from today through the
 * horizon. Skips past dates and existing seriesId+day rows. Caps at 20. Never
 * creates a Block entity.
 */
export function createTaskSeries(input: TaskSeriesInput, now: Date = new Date()): Task[] {
  const weekdays = [...new Set(input.weekdays.filter((day) => day >= 1 && day <= 7))].sort((a, b) => a - b)
  const title = input.title.trim()
  if (!title || weekdays.length === 0) return []

  const seriesId = input.seriesId || newId('series')
  const hoursPerBlock = Math.max(MIN_ESTIMATED_HOURS, input.hoursPerBlock)
  const days = seriesDayKeys(weekdays, input.horizon, now, MAX_SERIES_BLOCKS)
  const existing = getState().tasks
  const created: Task[] = []

  for (const day of days) {
    const taken = [...existing, ...created].some(
      (task) =>
        task.seriesId === seriesId &&
        task.status !== 'cancelled' &&
        taskDayKey(task) === day,
    )
    if (taken) continue
    created.push(
      createTask({
        ...input,
        title,
        estimatedHours: hoursPerBlock,
        dueAt: day,
        scheduledFor: day,
        seriesId,
        seriesWeekdays: weekdays,
      }),
    )
  }

  return created
}

/** "Ejecutar": move a research task into the execution moment. */
export function executeTask(id: string): void {
  const task = getState().tasks.find((t) => t.id === id)
  if (!task || task.stage !== 'research') return
  updateTask(id, { stage: 'execution', status: 'in_progress' })
}

/** Execute only with a required comment. Does not pay. */
export function executeTaskWithNote(id: string, comment: string): boolean {
  const trimmed = comment.trim()
  if (!trimmed) return false
  const task = getState().tasks.find((t) => t.id === id)
  if (!task || task.stage !== 'research') return false
  executeTask(id)
  return Boolean(addComment('task', id, trimmed))
}

/** "Volver a investigación": send an execution task back to research. */
export function returnToResearch(id: string): void {
  const task = getState().tasks.find((t) => t.id === id)
  if (!task || task.stage !== 'execution') return
  updateTask(id, { stage: 'research', status: 'pending' })
}

/** Assigns a loose task onto an objective; it lands in the research moment. */
export function assignTaskToObjective(id: string, resultId: string, objectiveId: string): void {
  updateTask(id, { resultId, objectiveId, stage: 'research' })
}

/**
 * Home composer: capture a loose research task (no result, no objective) with the
 * due date implied by the active agenda filter, so it lands where the user is looking.
 */
export function captureLooseTask(
  title: string,
  options?: {
    dueAt?: string
    scheduledFor?: string
    estimatedHours?: number
    difficulty?: Difficulty
    dayOrder?: number
    terreno?: Terreno
    resultId?: string
  },
): Task | null {
  const trimmed = title.trim()
  if (!trimmed) return null
  const day = options?.scheduledFor || options?.dueAt || undefined
  const dayTasks = day
    ? getState().tasks.filter(
        (task) =>
          task.status !== 'cancelled' &&
          (task.scheduledFor === day || task.dueAt === day),
      )
    : []
  const nextOrder =
    options?.dayOrder ??
    (dayTasks.length
      ? Math.max(...dayTasks.map((task) => task.dayOrder ?? task.importance ?? 0)) + 1
      : 0)
  const activeResult = getState().results.find((r) => r.status === 'active')
  return createTask({
    title: trimmed,
    resultId: options?.resultId || activeResult?.id,
    terreno: options?.terreno ?? 'literatura',
    stage: 'execution',
    estimatedHours: options?.estimatedHours ?? 1,
    difficulty: options?.difficulty ?? 'medium',
    dueAt: day,
    scheduledFor: day,
    dayOrder: nextOrder,
  })
}

export function updateTask(id: string, patch: Partial<Omit<Task, 'id'>>): void {
  setState((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }))
}

// ---------------------------------------------------------------- tactical task actions

export function addTaskMetric(
  taskId: string,
  metric: { name: string; value: number; target?: number; unit?: string },
): TaskMetric {
  const item: TaskMetric = {
    id: newId('metric'),
    name: metric.name.trim(),
    value: metric.value,
    target: metric.target,
    unit: metric.unit?.trim() || undefined,
  }
  setState((s) => ({
    ...s,
    tasks: s.tasks.map((t) =>
      t.id === taskId
        ? { ...t, metrics: [...(t.metrics || []), item] }
        : t,
    ),
  }))
  return item
}

export function updateTaskMetric(
  taskId: string,
  metricId: string,
  patch: Partial<TaskMetric>,
): void {
  setState((s) => ({
    ...s,
    tasks: s.tasks.map((t) => {
      if (t.id !== taskId) return t
      return {
        ...t,
        metrics: (t.metrics || []).map((m) =>
          m.id === metricId ? { ...m, ...patch } : m,
        ),
      }
    }),
  }))
}

export function removeTaskMetric(taskId: string, metricId: string): void {
  setState((s) => ({
    ...s,
    tasks: s.tasks.map((t) =>
      t.id === taskId
        ? { ...t, metrics: (t.metrics || []).filter((m) => m.id !== metricId) }
        : t,
    ),
  }))
}

export function addTaskMoneyTransaction(
  taskId: string,
  tx: { type: 'income' | 'expense'; amount: number; concept: string; currency?: string; date?: string },
): TaskMoneyTransaction {
  const item: TaskMoneyTransaction = {
    id: newId('tx'),
    type: tx.type,
    amount: Math.abs(tx.amount),
    concept: tx.concept.trim(),
    currency: tx.currency || '$',
    date: tx.date || toDayKey(new Date()),
  }
  setState((s) => ({
    ...s,
    tasks: s.tasks.map((t) =>
      t.id === taskId
        ? { ...t, moneyTransactions: [...(t.moneyTransactions || []), item] }
        : t,
    ),
  }))
  return item
}

export function removeTaskMoneyTransaction(taskId: string, txId: string): void {
  setState((s) => ({
    ...s,
    tasks: s.tasks.map((t) =>
      t.id === taskId
        ? { ...t, moneyTransactions: (t.moneyTransactions || []).filter((tx) => tx.id !== txId) }
        : t,
    ),
  }))
}

export function addTaskWorkLog(
  taskId: string,
  log: { summary: string; deliverableUrl?: string },
): TaskWorkDone {
  const item: TaskWorkDone = {
    id: newId('work'),
    summary: log.summary.trim(),
    deliverableUrl: log.deliverableUrl?.trim() || undefined,
    createdAt: now(),
  }
  setState((s) => ({
    ...s,
    tasks: s.tasks.map((t) =>
      t.id === taskId
        ? { ...t, workLogs: [...(t.workLogs || []), item] }
        : t,
    ),
  }))
  return item
}

export function removeTaskWorkLog(taskId: string, logId: string): void {
  setState((s) => ({
    ...s,
    tasks: s.tasks.map((t) =>
      t.id === taskId
        ? { ...t, workLogs: (t.workLogs || []).filter((w) => w.id !== logId) }
        : t,
    ),
  }))
}

export function addTaskContact(
  taskId: string,
  contact: Omit<TaskContact, 'id'>,
): TaskContact {
  const item: TaskContact = {
    id: newId('contact'),
    name: contact.name.trim(),
    role: contact.role?.trim() || undefined,
    organization: contact.organization?.trim() || undefined,
    category: contact.category,
    phone: contact.phone?.trim() || undefined,
    email: contact.email?.trim() || undefined,
    status: contact.status?.trim() || undefined,
    notes: contact.notes?.trim() || undefined,
  }
  setState((s) => ({
    ...s,
    tasks: s.tasks.map((t) =>
      t.id === taskId
        ? { ...t, contacts: [...(t.contacts || []), item] }
        : t,
    ),
  }))
  return item
}

export function updateTaskContact(
  taskId: string,
  contactId: string,
  patch: Partial<TaskContact>,
): void {
  setState((s) => ({
    ...s,
    tasks: s.tasks.map((t) => {
      if (t.id !== taskId) return t
      return {
        ...t,
        contacts: (t.contacts || []).map((c) =>
          c.id === contactId ? { ...c, ...patch } : c,
        ),
      }
    }),
  }))
}

export function removeTaskContact(taskId: string, contactId: string): void {
  setState((s) => ({
    ...s,
    tasks: s.tasks.map((t) =>
      t.id === taskId
        ? { ...t, contacts: (t.contacts || []).filter((c) => c.id !== contactId) }
        : t,
    ),
  }))
}

export function updateTaskThoughtMap(taskId: string, thoughtMap: ThoughtMap): void {
  updateTask(taskId, { thoughtMap })
}

export function addRecordedTimeToTask(taskId: string, additionalHours: number): void {
  const task = getState().tasks.find((t) => t.id === taskId)
  if (!task) return
  const currentActual = task.actualHours ?? 0
  updateTask(taskId, { actualHours: Math.round((currentActual + additionalHours) * 100) / 100 })
}

export function toggleTaskCheckItem(taskId: string, itemId: string): void {
  const task = getState().tasks.find((t) => t.id === taskId)
  if (!task) return
  const checklist = (task.checklist || []).map((item) =>
    item.id === itemId ? { ...item, done: !item.done } : item,
  )
  updateTask(taskId, { checklist })
}

export function addTaskCheckItem(taskId: string, text: string): TaskCheckItem | null {
  const trimmed = text.trim()
  if (!trimmed) return null
  const item: TaskCheckItem = {
    id: newId('check'),
    text: trimmed,
    done: false,
  }
  const task = getState().tasks.find((t) => t.id === taskId)
  if (!task) return null
  updateTask(taskId, { checklist: [...(task.checklist || []), item] })
  return item
}

export function removeTaskCheckItem(taskId: string, itemId: string): void {
  const task = getState().tasks.find((t) => t.id === taskId)
  if (!task) return
  updateTask(taskId, { checklist: (task.checklist || []).filter((item) => item.id !== itemId) })
}

export function cancelTask(id: string): void {
  updateTask(id, { status: 'cancelled' })
}

/** Hard-deletes a task and its journal comments. No XP is paid; not undoable. */
export function deleteTask(id: string): void {
  setState((s) => ({
    ...s,
    tasks: s.tasks.filter((t) => t.id !== id),
    comments: s.comments.filter((c) => !(c.parentType === 'task' && c.parentId === id)),
  }))
}

export function reorderTasks(orderedIds: string[], field: 'importance' | 'dayOrder' = 'importance'): void {
  setState((s) => ({
    ...s,
    tasks: s.tasks.map((t) => {
      const index = orderedIds.indexOf(t.id)
      return index >= 0 ? { ...t, [field]: index } : t
    }),
  }))
}

export interface CompletionOutcome {
  task: Task
  reward: Reward
  skillId?: string
  skillLevelsGained: number
  characterLevelsGained: number
  newLevel: number
  unlockedCosmetics: Cosmetic[]
  paid: boolean
}

/**
 * Marks a task done. Pays XP/money/skill XP once (`rewardApplied`). Reopened
 * tasks can be completed again without a second payout.
 */
export function completeTask(
  id: string,
  options?: { actualHours?: number; skillId?: string },
): CompletionOutcome | null {
  const state = getState()
  const task = state.tasks.find((t) => t.id === id)
  if (!task || isTaskDone(task.status)) return null

  const completedAt = now()
  const objective = task.objectiveId
    ? state.objectives.find((o) => o.id === task.objectiveId)
    : undefined
  const resultId = task.resultId ?? objective?.resultId
  const result = resultId ? state.results.find((r) => r.id === resultId) : undefined
  const reward = computeReward({
    estimatedHours: task.estimatedHours,
    actualHours: options?.actualHours ?? task.actualHours,
    difficulty: task.difficulty,
    dueAt: task.dueAt,
    completedAt,
    activeResult: result?.status === 'active',
  })

  const pay = shouldPayReward(task)
  const explicitSkillId = options?.skillId
  const effectiveSkillId = explicitSkillId ?? task.skillId ?? objective?.skillId ?? result?.skillId
  const skill = pay && effectiveSkillId ? state.skills.find((s) => s.id === effectiveSkillId) : undefined
  const characterXp = pay ? addCharacterXp(state.character, reward.xp) : null
  const skillXp = pay && skill ? addSkillXp(skill, reward.xp) : null
  const unlockedCosmetics: Cosmetic[] = []

  const completedTask: Task = {
    ...task,
    skillId: explicitSkillId ?? task.skillId,
    actualHours: options?.actualHours ?? task.actualHours,
    completedAt,
    status: reward.status,
    xpGranted: pay ? reward.xp : task.xpGranted,
    moneyGranted: pay ? reward.money : task.moneyGranted,
    rewardApplied: true,
  }

  setState((s) => ({
    ...s,
    character: characterXp
      ? {
          ...s.character,
          level: characterXp.level,
          xp: characterXp.xp,
          xpToNext: characterXp.xpToNext,
          money: s.character.money + reward.money,
        }
      : s.character,
    skills: skillXp
      ? s.skills.map((sk) =>
          sk.id === skill!.id ? { ...sk, level: skillXp.level, xp: skillXp.xp } : sk,
        )
      : s.skills,
    tasks: s.tasks.map((t) => (t.id === id ? completedTask : t)),
  }))

  return {
    task: completedTask,
    reward: pay ? reward : { ...reward, xp: 0, money: 0 },
    skillId: effectiveSkillId,
    skillLevelsGained: skillXp?.levelsGained ?? 0,
    characterLevelsGained: characterXp?.levelsGained ?? 0,
    newLevel: characterXp?.level ?? state.character.level,
    unlockedCosmetics,
    paid: pay,
  }
}

/** Close only with required hours and one comment. Uses actualHours in the payout. */
export function closeTask(
  id: string,
  input: { actualHours: number; comment: string; skillId?: string },
): CompletionOutcome | null {
  const comment = input.comment.trim()
  const actualHours = Number(input.actualHours)
  if (!comment || !Number.isFinite(actualHours) || actualHours < MIN_ESTIMATED_HOURS) return null
  const outcome = completeTask(id, { actualHours, skillId: input.skillId })
  if (!outcome) return null
  addComment('task', id, comment)
  return outcome
}

/** Reopens a task as research. The reward already paid is kept: no clawback. */

/** Move open past-due scheduled tasks onto today, keeping relative order at the top. */
export function rollPendingTasksToToday(now: Date = new Date()): void {
  const today = toDayKey(now)
  setState((s) => {
    const pending = s.tasks
      .filter((task) => {
        if (isTaskDone(task.status) || task.status === 'cancelled') return false
        const day = task.scheduledFor || task.dueAt
        return Boolean(day && day < today)
      })
      .sort((a, b) => {
        const da = a.scheduledFor || a.dueAt || ''
        const db = b.scheduledFor || b.dueAt || ''
        if (da !== db) return da.localeCompare(db)
        return (a.dayOrder ?? a.importance) - (b.dayOrder ?? b.importance)
      })
    if (pending.length === 0) return s

    const todayExisting = s.tasks
      .filter(
        (task) =>
          !pending.some((p) => p.id === task.id) &&
          task.status !== 'cancelled' &&
          (task.scheduledFor === today || task.dueAt === today),
      )
      .sort((a, b) => (a.dayOrder ?? a.importance) - (b.dayOrder ?? b.importance))

    const orderIds = [...pending.map((t) => t.id), ...todayExisting.map((t) => t.id)]
    const orderIndex = new Map(orderIds.map((id, i) => [id, i]))

    return {
      ...s,
      tasks: s.tasks.map((task) => {
        if (pending.some((p) => p.id === task.id)) {
          return {
            ...task,
            scheduledFor: today,
            dueAt: today,
            dayOrder: orderIndex.get(task.id) ?? 0,
          }
        }
        if (orderIndex.has(task.id)) {
          return { ...task, dayOrder: orderIndex.get(task.id) }
        }
        return task
      }),
    }
  })
}

export function reopenTask(id: string): void {
  updateTask(id, { status: 'pending', stage: 'research', completedAt: undefined })
}

// ----------------------------------------------------------------- journal

export function addComment(parentType: ParentType, parentId: string, body: string): Comment | null {
  const trimmed = body.trim()
  if (!trimmed) return null
  const comment: Comment = {
    id: newId('comment'),
    parentType,
    parentId,
    body: trimmed,
    createdAt: now(),
  }
  setState((s) => ({ ...s, comments: [...s.comments, comment] }))
  return comment
}

/** Aliases kept for capture-UI call sites. */
export const markCharacterOnboarded = markOnboarded
export const setLocale = setCharacterLocale
