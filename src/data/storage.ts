import { DEFAULT_SKILLS, initialState, newCharacter, STATE_VERSION } from './seed'
import { MIN_ESTIMATED_HOURS } from '@/domain/limits'
import { skillIdToPillar } from '@/domain/pillars'
import { xpToNextForLevel } from '@/domain/economy'
import type { AlephState, Locale, Objective, Project, Result, Task } from '@/domain/types'

export const STORAGE_KEY = 'aleph.state.v2'

/** Visible copy is frozen to Rioplatense Spanish for now; a Settings screen will own language later. */
function detectLocale(): Locale {
  return 'es'
}

/**
 * Legacy shape from the pre-Result hierarchy, where an Objective was top-level and
 * rewards came from a `size` field. Kept so old rows can be adopted without data loss.
 */
interface LegacyState {
  version?: number
  objectives?: Array<Partial<Objective> & { id: string; name?: string; title?: string }>
  results?: Result[]
  tasks?: Array<Partial<Task> & { id: string; size?: 'small' | 'normal' | 'large' }>
}

/** Wraps every top-level legacy objective in a Result of the same name. */
function adoptLegacy(raw: LegacyState): Partial<AlephState> {
  const results: Result[] = [...(raw.results ?? [])]
  const objectives: Objective[] = []
  const knownResultIds = new Set(results.map((r) => r.id))

  ;(raw.objectives ?? []).forEach((legacy, index) => {
    const name = legacy.name ?? legacy.title ?? 'Objective'
    let resultId = legacy.resultId
    if (!resultId || !knownResultIds.has(resultId)) {
      resultId = `result_${legacy.id}`
      results.push({
        id: resultId,
        name,
        why: legacy.why,
        skillId: legacy.skillId,
        pillar: skillIdToPillar(legacy.skillId),
        importance: results.length,
        status: 'active',
      })
      knownResultIds.add(resultId)
    }
    objectives.push({
      id: legacy.id,
      resultId,
      name,
      why: legacy.why,
      skillId: legacy.skillId,
      importance: legacy.importance ?? index + 1,
      currentStage: legacy.currentStage ?? 'research',
      status: legacy.status ?? 'pending',
    })
  })

  const tasks: Task[] = (raw.tasks ?? []).map((legacy, index) => ({
    id: legacy.id,
    title: legacy.title ?? 'Task',
    notes: legacy.notes,
    resultId: legacy.resultId,
    objectiveId: legacy.objectiveId,
    stage: legacy.stage ?? 'research',
    skillId: legacy.skillId,
    estimatedHours: legacy.estimatedHours ?? 1,
    actualHours: legacy.actualHours,
    difficulty: legacy.difficulty ?? 'medium',
    importance: legacy.importance ?? index,
    dueAt: legacy.dueAt,
    scheduledFor: legacy.scheduledFor,
    completedAt: legacy.completedAt,
    status: legacy.status ?? 'pending',
    xpGranted: legacy.xpGranted,
    moneyGranted: legacy.moneyGranted,
    rewardApplied: legacy.rewardApplied ?? Boolean(legacy.completedAt),
    createdAt: legacy.createdAt ?? new Date().toISOString(),
  }))

  return { results, objectives, tasks }
}

/** Fills in anything a stored state is missing so old snapshots keep working. */
export function normalize(input: unknown): AlephState {
  const base = initialState(detectLocale())
  if (!input || typeof input !== 'object') return base

  const raw = input as Partial<AlephState> & LegacyState
  const adopted = raw.version === undefined || raw.version < STATE_VERSION ? adoptLegacy(raw) : {}

  const character = { ...newCharacter(base.character.locale), ...(raw.character ?? {}) }
  character.level = Math.max(1, Math.round(character.level || 1))
  character.xp = Math.max(0, character.xp || 0)
  character.xpToNext = character.xpToNext > 0 ? character.xpToNext : xpToNextForLevel(character.level)
  character.money = Math.max(0, character.money || 0)
  character.locale = character.locale === 'en' ? 'en' : 'es'
  character.dailyHourCap =
    typeof character.dailyHourCap === 'number' && character.dailyHourCap > 0
      ? character.dailyHourCap
      : 5
  // Merge avatar with defaults so older snapshots gain new layers (e.g. eyes).
  character.avatar = { ...newCharacter(base.character.locale).avatar, ...(character.avatar ?? {}) }
  character.ownedCosmeticIds = Array.from(
    new Set([...base.character.ownedCosmeticIds, ...(character.ownedCosmeticIds ?? [])]),
  )
  character.seenNewCosmeticIds = character.seenNewCosmeticIds ?? []
  if (typeof raw.character?.onboarded === 'boolean') {
    character.onboarded = raw.character.onboarded
  } else {
    const hasHistory =
      (raw.results?.length ?? 0) > 0 ||
      (raw.objectives?.length ?? 0) > 0 ||
      (raw.tasks?.length ?? 0) > 0
    character.onboarded = hasHistory
  }

  const storedSkills = raw.skills ?? []
  const skills = [...DEFAULT_SKILLS.map((s) => ({ ...s }))]
  storedSkills.forEach((stored) => {
    const i = skills.findIndex((s) => s.id === stored.id)
    if (i >= 0) skills[i] = { ...skills[i], ...stored }
    else skills.push(stored)
  })

  const tasks = (raw.tasks ?? adopted.tasks ?? []).map((t) => ({
    ...t,
    estimatedHours: Math.max(MIN_ESTIMATED_HOURS, t.estimatedHours || 1),
    difficulty: t.difficulty ?? 'medium',
    rewardApplied: t.rewardApplied ?? false,
  }))

  const results = (raw.results ?? adopted.results ?? []).map((result) => ({
    ...result,
    pillar: result.pillar ?? skillIdToPillar(result.skillId),
  }))

  const rawProjects = (raw.projects ?? []) as Project[]
  const existingProjectNames = new Set(rawProjects.map((p) => p.name.trim().toLowerCase()))
  const projects: Project[] = [...rawProjects]
  for (const r of results) {
    const pName = r.projectName?.trim()
    if (pName && !existingProjectNames.has(pName.toLowerCase())) {
      existingProjectNames.add(pName.toLowerCase())
      projects.push({
        id: `proj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        name: pName,
        createdAt: new Date().toISOString(),
      })
    }
  }
  if (projects.length === 0) {
    projects.push({
      id: 'proj_obra_principal',
      name: 'La Obra Principal',
      description: 'Proyecto central de creación, arte y desarrollo económico.',
      color: '#7a3fe0',
      icon: 'sparkles',
      createdAt: new Date().toISOString(),
    })
  }

  return {
    version: STATE_VERSION,
    character,
    skills,
    projects,
    results,
    objectives: raw.objectives ?? adopted.objectives ?? [],
    tasks,
    comments: raw.comments ?? [],
    relations: raw.relations ?? [],
  }
}

export function loadState(): AlephState {
  if (typeof localStorage === 'undefined') return initialState(detectLocale())
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState(detectLocale())
    return normalize(JSON.parse(raw))
  } catch {
    return initialState(detectLocale())
  }
}

export function saveState(state: AlephState): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage full or blocked: the session keeps working in memory.
  }
}
