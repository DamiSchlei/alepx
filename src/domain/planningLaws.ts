import { toDayKey } from '@/domain/dates'
import { isTaskDone } from '@/domain/economy'
import { activeObjectivesOfResult } from '@/domain/limits'
import type { AlephState, Objective, Result, Task, Terreno } from '@/domain/types'

/**
 * The planning laws, in the order a work is initiated.
 *
 * 1. Vision — a Result beyond today's limits, plus what it means to the person.
 * 2. Vector — an intermediate Objective (an "a dónde"), plus what it points at.
 * 3. Pulse — one base Task of that work scheduled on the day.
 * 4. Texture — the step's terreno: literatura, arte, or empresa.
 *
 * Hold is not a fifth law. It means the four are coherent, so the day can sustain them.
 * The tree is not a cage: later edits do not rewind a step that already has its meaning.
 */
export const PLANNING_LAW_ORDER = ['vision', 'vector', 'pulse', 'texture'] as const

export type PlanningLawId = (typeof PLANNING_LAW_ORDER)[number]

export type PlanningFlowPosition = PlanningLawId | 'hold'

export interface PlanningFlow {
  current: PlanningFlowPosition
  steps: Array<{ id: PlanningLawId; done: boolean }>
  result?: Pick<Result, 'id' | 'name' | 'why'>
  objective?: Pick<Objective, 'id' | 'name' | 'why'>
  todayTask?: Pick<Task, 'id' | 'title' | 'terreno'>
}

function taskDay(task: Task): string | undefined {
  if (task.dueAt) return toDayKey(task.dueAt)
  if (task.scheduledFor) return toDayKey(task.scheduledFor)
  return undefined
}

function belongsToResult(state: AlephState, task: Task, resultId: string): boolean {
  if (task.resultId === resultId) return true
  if (!task.objectiveId) return false
  return state.objectives.some((objective) => objective.id === task.objectiveId && objective.resultId === resultId)
}

function pickTodayTask(tasks: Task[]): Task | undefined {
  return (
    tasks.find((task) => !isTaskDone(task.status) && !task.terreno) ??
    tasks.find((task) => !task.terreno) ??
    tasks.find((task) => !isTaskDone(task.status)) ??
    tasks[0]
  )
}

/** Where the work stands in the natural planning sequence for this day. */
export function resolvePlanningFlow(state: AlephState, dayKey: string): PlanningFlow {
  const result = state.results
    .filter((item) => item.status === 'active')
    .sort((a, b) => a.importance - b.importance)[0]

  const objective = result
    ? activeObjectivesOfResult(state.objectives, result.id).sort((a, b) => a.importance - b.importance)[0]
    : undefined

  const todayTasks = result
    ? state.tasks.filter(
        (task) =>
          task.status !== 'cancelled' &&
          taskDay(task) === dayKey &&
          belongsToResult(state, task, result.id),
      )
    : []

  const todayTask = pickTodayTask(todayTasks)

  const visionDone = Boolean(result && result.why?.trim())
  const vectorDone = Boolean(visionDone && objective && objective.why?.trim())
  const pulseDone = Boolean(vectorDone && todayTasks.length > 0)
  const textureDone = Boolean(pulseDone && todayTasks.every((task) => task.terreno))

  const doneById: Record<PlanningLawId, boolean> = {
    vision: visionDone,
    vector: vectorDone,
    pulse: pulseDone,
    texture: textureDone,
  }

  const current = PLANNING_LAW_ORDER.find((id) => !doneById[id]) ?? 'hold'

  return {
    current,
    steps: PLANNING_LAW_ORDER.map((id) => ({ id, done: doneById[id] })),
    result: result ? { id: result.id, name: result.name, why: result.why } : undefined,
    objective: objective ? { id: objective.id, name: objective.name, why: objective.why } : undefined,
    todayTask: todayTask
      ? { id: todayTask.id, title: todayTask.title, terreno: todayTask.terreno as Terreno | undefined }
      : undefined,
  }
}
