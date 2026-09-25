import { freeStarterCosmeticIds } from './cosmetics'
import type { AlephState, Character, Skill } from '@/domain/types'

export const STATE_VERSION = 1

/** The six defaults. Names are rendered through i18n via `nameKey`. */
export const DEFAULT_SKILLS: Skill[] = [
  { id: 'creativity', nameKey: 'skills.creativity', icon: 'spark', color: '#a78bfa', level: 1, xp: 0, isCustom: false },
  { id: 'study', nameKey: 'skills.study', icon: 'book', color: '#60a5fa', level: 1, xp: 0, isCustom: false },
  { id: 'finance', nameKey: 'skills.finance', icon: 'coin', color: '#34d399', level: 1, xp: 0, isCustom: false },
  { id: 'relationships', nameKey: 'skills.relationships', icon: 'heart', color: '#f472b6', level: 1, xp: 0, isCustom: false },
  { id: 'health', nameKey: 'skills.health', icon: 'pulse', color: '#fb923c', level: 1, xp: 0, isCustom: false },
  { id: 'work', nameKey: 'skills.work', icon: 'hammer', color: '#facc15', level: 1, xp: 0, isCustom: false },
]

export function newCharacter(locale: Character['locale'] = 'es'): Character {
  return {
    id: 'character',
    name: 'Aleph',
    level: 1,
    xp: 0,
    xpToNext: 100,
    money: 0,
    avatar: {
      skinId: 'skin_sand',
      hairId: 'hair_short',
      eyesId: 'eyes_dark',
      outfitId: 'outfit_tee',
      accessoryId: 'accessory_none',
      backgroundId: 'bg_dawn',
    },
    ownedCosmeticIds: freeStarterCosmeticIds(),
    seenNewCosmeticIds: freeStarterCosmeticIds(),
    locale,
    dailyHourCap: 5,
    onboarded: false,
    journalBubbleHidden: true,
  }
}

/** Initial clean state for new users: clean slate that starts the onboarding flow */
export function initialState(locale: Character['locale'] = 'es'): AlephState {
  return {
    version: STATE_VERSION,
    character: newCharacter(locale),
    skills: DEFAULT_SKILLS.map((s) => ({ ...s })),
    projects: [
      {
        id: 'proj_obra_principal',
        name: 'La Obra Principal',
        description: 'Proyecto central de creación, arte y desarrollo económico.',
        color: '#7a3fe0',
        icon: 'sparkles',
        createdAt: new Date().toISOString(),
      },
    ],
    results: [],
    objectives: [],
    tasks: [],
    comments: [],
    relations: [],
  }
}

/** Sample state with demo work and tasks for previewing/testing */
export function demoState(locale: Character['locale'] = 'es'): AlephState {
  return {
    version: STATE_VERSION,
    character: {
      ...newCharacter(locale),
      name: 'Aleph',
      dailyHourCap: 5,
      onboarded: true,
      journalBubbleHidden: true,
    },
    skills: DEFAULT_SKILLS.map((s) => ({ ...s })),
    projects: [
      {
        id: 'proj_obra_principal',
        name: 'La Obra Principal',
        description: 'Proyecto central de creación, arte y desarrollo económico.',
        color: '#7a3fe0',
        icon: 'sparkles',
        createdAt: '2026-09-19T00:00:00.000Z',
      },
    ],
    results: [
      {
        id: 'result_obra_1',
        projectName: 'La Obra Principal',
        name: 'Primer producto listo para vender',
        pillar: 'body',
        importance: 1,
        status: 'active',
      },
    ],
    objectives: [
      {
        id: 'obj_oferta_1',
        resultId: 'result_obra_1',
        name: 'Oferta visible',
        importance: 1,
        currentStage: 'execution',
        status: 'in_progress',
      },
    ],
    tasks: [
      {
        id: 'task_arte_1',
        title: 'Sostener el precio aunque dé rechazo',
        terreno: 'arte',
        stage: 'execution',
        estimatedHours: 1,
        actualHours: 1,
        difficulty: 'medium',
        importance: 1,
        resultId: 'result_obra_1',
        objectiveId: 'obj_oferta_1',
        scheduledFor: '2026-09-19',
        dueAt: '2026-09-19',
        dayOrder: 1,
        status: 'done_on_time',
        completedAt: '2026-09-19T10:00:00.000Z',
        rewardApplied: true,
        createdAt: '2026-09-19T08:00:00.000Z',
      },
      {
        id: 'task_lit_1',
        title: 'Escribir propuesta de valor y condiciones',
        terreno: 'literatura',
        stage: 'execution',
        estimatedHours: 1,
        actualHours: 1,
        difficulty: 'medium',
        importance: 2,
        resultId: 'result_obra_1',
        objectiveId: 'obj_oferta_1',
        scheduledFor: '2026-09-19',
        dueAt: '2026-09-19',
        dayOrder: 2,
        status: 'done_on_time',
        completedAt: '2026-09-19T11:00:00.000Z',
        rewardApplied: true,
        createdAt: '2026-09-19T08:00:00.000Z',
      },
      {
        id: 'task_emp_1',
        title: 'Cargar stock y probar el cobro',
        terreno: 'empresa',
        stage: 'execution',
        estimatedHours: 1,
        difficulty: 'medium',
        importance: 3,
        resultId: 'result_obra_1',
        objectiveId: 'obj_oferta_1',
        scheduledFor: '2026-09-19',
        dueAt: '2026-09-19',
        dayOrder: 3,
        status: 'pending',
        rewardApplied: false,
        createdAt: '2026-09-19T08:00:00.000Z',
      },
    ],
    comments: [],
    relations: [],
  }
}
