import { describe, expect, it } from 'vitest'
import { inferTaskViewTemplate, isTaskViewTemplate, resolveTaskViewTemplate } from './taskView'
import type { Task } from './types'

function task(partial: Partial<Task> = {}): Task {
  return {
    id: 't1',
    title: 'Draft',
    stage: 'execution',
    estimatedHours: 1,
    difficulty: 'medium',
    importance: 1,
    status: 'pending',
    rewardApplied: false,
    createdAt: '2026-09-20T00:00:00.000Z',
    ...partial,
  }
}

describe('resolveTaskViewTemplate', () => {
  it('prefers the saved template', () => {
    expect(
      resolveTaskViewTemplate(
        task({
          viewTemplate: 'money',
          checklist: [{ id: 'c', text: 'x', done: false }],
        }),
      ),
    ).toBe('money')
  })

  it('infers from existing data when none is saved', () => {
    expect(
      inferTaskViewTemplate(task({ contacts: [{ id: 'p', name: 'Ana', category: 'client' }] })),
    ).toBe('contacts')
    expect(inferTaskViewTemplate(task())).toBe(null)
  })

  it('ignores unknown saved values', () => {
    expect(isTaskViewTemplate('kanban')).toBe(false)
    expect(resolveTaskViewTemplate(task({ viewTemplate: 'kanban' as Task['viewTemplate'] }))).toBe(null)
  })
})
