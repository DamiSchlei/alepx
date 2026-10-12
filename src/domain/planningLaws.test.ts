import { describe, expect, it } from 'vitest'
import { initialState } from '@/data/seed'
import { resolvePlanningFlow } from '@/domain/planningLaws'
import type { AlephState, Objective, Result, Task } from '@/domain/types'

const DAY = '2026-09-24'

function result(partial: Partial<Result> & Pick<Result, 'id' | 'name'>): Result {
  return { importance: 1, status: 'active', pillar: 'body', ...partial }
}

function objective(partial: Partial<Objective> & Pick<Objective, 'id' | 'resultId' | 'name'>): Objective {
  return { importance: 1, currentStage: 'execution', status: 'in_progress', ...partial }
}

function task(partial: Partial<Task> & Pick<Task, 'id' | 'title'>): Task {
  return {
    stage: 'execution',
    estimatedHours: 1,
    difficulty: 'medium',
    importance: 1,
    status: 'pending',
    rewardApplied: false,
    createdAt: '2026-09-24T00:00:00.000Z',
    ...partial,
  }
}

function state(patch: Partial<AlephState>): AlephState {
  return { ...initialState('es'), results: [], objectives: [], tasks: [], ...patch }
}

describe('resolvePlanningFlow', () => {
  it('starts at vision when no result has been decided', () => {
    const flow = resolvePlanningFlow(state({}), DAY)
    expect(flow.current).toBe('vision')
    expect(flow.steps.map((step) => step.done)).toEqual([false, false, false, false])
  })

  it('stays on vision until the result has a meaning', () => {
    const flow = resolvePlanningFlow(
      state({
        results: [result({ id: 'r1', name: 'Primer producto' })],
      }),
      DAY,
    )
    expect(flow.current).toBe('vision')
    expect(flow.result?.name).toBe('Primer producto')
  })

  it('asks for the intermediate vector once the result means something', () => {
    const flow = resolvePlanningFlow(
      state({
        results: [result({ id: 'r1', name: 'Primer producto', why: 'Salir a vender' })],
      }),
      DAY,
    )
    expect(flow.current).toBe('vector')
    expect(flow.steps[0]?.done).toBe(true)
  })

  it('asks for the daily pulse once the objective has a direction', () => {
    const flow = resolvePlanningFlow(
      state({
        results: [result({ id: 'r1', name: 'Primer producto', why: 'Salir a vender' })],
        objectives: [objective({ id: 'o1', resultId: 'r1', name: 'Oferta visible', why: 'Que se pueda comprar' })],
      }),
      DAY,
    )
    expect(flow.current).toBe('pulse')
  })

  it('asks for terreno when today has a step without a nature', () => {
    const flow = resolvePlanningFlow(
      state({
        results: [result({ id: 'r1', name: 'Primer producto', why: 'Salir a vender' })],
        objectives: [objective({ id: 'o1', resultId: 'r1', name: 'Oferta visible', why: 'Que se pueda comprar' })],
        tasks: [
          task({
            id: 't1',
            title: 'Cargar stock',
            resultId: 'r1',
            objectiveId: 'o1',
            scheduledFor: DAY,
            dueAt: DAY,
          }),
        ],
      }),
      DAY,
    )
    expect(flow.current).toBe('texture')
    expect(flow.todayTask?.title).toBe('Cargar stock')
  })

  it('holds when vision, vector, pulse and texture are coherent', () => {
    const flow = resolvePlanningFlow(
      state({
        results: [result({ id: 'r1', name: 'Primer producto', why: 'Salir a vender' })],
        objectives: [objective({ id: 'o1', resultId: 'r1', name: 'Oferta visible', why: 'Que se pueda comprar' })],
        tasks: [
          task({
            id: 't1',
            title: 'Cargar stock',
            resultId: 'r1',
            objectiveId: 'o1',
            terreno: 'empresa',
            scheduledFor: DAY,
            dueAt: DAY,
          }),
        ],
      }),
      DAY,
    )
    expect(flow.current).toBe('hold')
    expect(flow.steps.every((step) => step.done)).toBe(true)
  })
})
